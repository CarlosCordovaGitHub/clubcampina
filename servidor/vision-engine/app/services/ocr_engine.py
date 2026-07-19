"""OCR de placas con EasyOCR.

Limitación conocida (documentada en el plan): EasyOCR es un OCR genérico, no un
ALPR entrenado. Funciona bien con fotos razonablemente controladas; para placas
sucias, en movimiento o mal iluminadas, la mejora futura es un modelo dedicado
(YOLO+CRNN) o un servicio ALPR comercial — solo habría que reemplazar este módulo.
"""

import re
from functools import lru_cache

import numpy as np

# Placa colombiana: 3 letras + 3 dígitos (autos) o 3 letras + 2 dígitos + letra (motos)
PLATE_RE = re.compile(r"[A-Z]{3}[0-9]{2}[0-9A-Z]")

# Confusiones típicas del OCR cuando esperamos dígitos
DIGIT_FIXES = str.maketrans({"O": "0", "Q": "0", "I": "1", "L": "1", "Z": "2", "S": "5", "B": "8"})
LETTER_FIXES = str.maketrans({"0": "O", "1": "I", "5": "S", "8": "B", "2": "Z"})

ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- "


@lru_cache(maxsize=1)
def get_reader():
    import easyocr  # import perezoso: tarda varios segundos

    # Solo inglés: las placas no llevan tildes ni eñes y el modelo es más liviano
    return easyocr.Reader(["en"], gpu=False, verbose=False)


def _normalize(raw: str) -> str | None:
    """Limpia una lectura cruda y trata de encajarla al formato de placa."""
    text = re.sub(r"[^A-Z0-9]", "", raw.upper())
    if len(text) < 5 or len(text) > 8:
        return None

    match = PLATE_RE.search(text)
    if match:
        return match.group(0)

    # Intento de corrección posicional sobre los últimos 6 caracteres plausibles
    for start in range(0, len(text) - 5):
        chunk = text[start : start + 6]
        letters = chunk[:3].translate(LETTER_FIXES)
        digits = chunk[3:5].translate(DIGIT_FIXES)
        last = chunk[5]
        candidate = letters + digits + last
        if PLATE_RE.fullmatch(candidate):
            return candidate
    return None


def recognize_plate(
    variants: list[np.ndarray],
) -> tuple[str | None, float, tuple[int, int, int, int] | None]:
    """Corre OCR sobre cada variante preprocesada y devuelve la mejor lectura."""
    reader = get_reader()

    best: tuple[str | None, float, tuple[int, int, int, int] | None] = (None, 0.0, None)
    fallback_conf = 0.0

    for img in variants:
        results = reader.readtext(img, allowlist=ALLOWLIST, detail=1)
        for bbox, raw_text, conf in results:
            fallback_conf = max(fallback_conf, float(conf))
            plate = _normalize(raw_text)
            if plate and conf > best[1]:
                xs = [int(p[0]) for p in bbox]
                ys = [int(p[1]) for p in bbox]
                best = (plate, float(conf), (min(xs), min(ys), max(xs), max(ys)))
        # Si ya hay una lectura muy confiable, no hace falta seguir probando variantes
        if best[1] >= 0.90:
            break

    if best[0] is None:
        return None, fallback_conf, None
    return best
