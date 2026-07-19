"""ALPR dedicado: fast-alpr (detector YOLOv9 de placas + OCR entrenado en placas).

A diferencia de EasyOCR (OCR genérico), ambos modelos están entrenados
específicamente para matrículas: localizan la placa aunque haya otros textos en
la escena y leen mejor placas con ángulo, sombra o bajo contraste. Corren sobre
ONNX Runtime en CPU — no requieren GPU.
"""

from functools import lru_cache

import numpy as np

from app.services.ocr_engine import normalize_plate

DETECTOR_MODEL = "yolo-v9-t-384-license-plate-end2end"
OCR_MODEL = "cct-xs-v1-global-model"

# fast-alpr recorta la placa EXACTAMENTE al cuadro que devuelve el detector,
# sin margen; si el detector se queda un poco corto, el OCR recibe la imagen
# con el último carácter cortado y falla o inventa. Un padding pequeño (en %
# del tamaño del cuadro) evita ese recorte ciego. Se reimplementa el pipeline
# detección→OCR aquí (en vez de alpr.predict()) solo para poder insertarlo.
PADDING_PCT = 0.12


@lru_cache(maxsize=1)
def get_alpr():
    from fast_alpr import ALPR  # import perezoso: carga los modelos ONNX

    return ALPR(detector_model=DETECTOR_MODEL, ocr_model=OCR_MODEL)


def recognize_plate_alpr(
    bgr: np.ndarray,
) -> tuple[str | None, float, tuple[int, int, int, int] | None]:
    """Devuelve la mejor placa detectada: (texto, confianza, bbox)."""
    alpr = get_alpr()
    h, w = bgr.shape[:2]
    best: tuple[str | None, float, tuple[int, int, int, int] | None] = (None, 0.0, None)
    fallback_conf = 0.0

    for detection in alpr.detector.predict(bgr):
        bb = detection.bounding_box
        bw, bh = bb.x2 - bb.x1, bb.y2 - bb.y1
        pad_x, pad_y = int(bw * PADDING_PCT), int(bh * PADDING_PCT)
        x1, y1 = max(bb.x1 - pad_x, 0), max(bb.y1 - pad_y, 0)
        x2, y2 = min(bb.x2 + pad_x, w), min(bb.y2 + pad_y, h)
        recorte = bgr[y1:y2, x1:x2]
        if recorte.size == 0:
            continue

        ocr_result = alpr.ocr.predict(recorte)
        if ocr_result is None:
            continue
        raw = (ocr_result.text or "").strip("_").strip()
        conf = ocr_result.confidence
        conf = float(np.mean(conf)) if isinstance(conf, (list, tuple)) else float(conf)
        fallback_conf = max(fallback_conf, conf)

        plate = normalize_plate(raw)
        if plate and conf > best[1]:
            best = (plate, conf, (x1, y1, x2, y2))

    if best[0] is None:
        return None, fallback_conf, None
    return best
