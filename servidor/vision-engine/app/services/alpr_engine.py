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


@lru_cache(maxsize=1)
def get_alpr():
    from fast_alpr import ALPR  # import perezoso: carga los modelos ONNX

    return ALPR(detector_model=DETECTOR_MODEL, ocr_model=OCR_MODEL)


def recognize_plate_alpr(
    bgr: np.ndarray,
) -> tuple[str | None, float, tuple[int, int, int, int] | None]:
    """Devuelve la mejor placa detectada: (texto, confianza, bbox)."""
    alpr = get_alpr()
    best: tuple[str | None, float, tuple[int, int, int, int] | None] = (None, 0.0, None)
    fallback_conf = 0.0

    for res in alpr.predict(bgr):
        if res.ocr is None:
            continue
        raw = (res.ocr.text or "").strip("_").strip()
        conf = res.ocr.confidence
        conf = float(np.mean(conf)) if isinstance(conf, (list, tuple)) else float(conf)
        fallback_conf = max(fallback_conf, conf)

        plate = normalize_plate(raw)
        if plate and conf > best[1]:
            bb = res.detection.bounding_box
            best = (plate, conf, (int(bb.x1), int(bb.y1), int(bb.x2), int(bb.y2)))

    if best[0] is None:
        return None, fallback_conf, None
    return best
