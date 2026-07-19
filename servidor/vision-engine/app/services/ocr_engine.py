"""OCR de placas con EasyOCR.

Limitación conocida (documentada en el plan): EasyOCR es un OCR genérico, no un
ALPR entrenado. Funciona bien con fotos razonablemente controladas; para placas
sucias, en movimiento o mal iluminadas, la mejora futura es un modelo dedicado
(YOLO+CRNN) o un servicio ALPR comercial — solo habría que reemplazar este módulo.
"""

import re
from functools import lru_cache

import numpy as np

# Soporta placa ecuatoriana (3 letras + 4 dígitos, ej. "ABC-1234") y
# colombiana (3 letras + 3 alfanumérico, ej. "ABC123"/"ABC12D"). El patrón de
# 7 caracteres va primero: buscando con .search() en una cadena de 7 dígitos
# válidos, si el de 6 fuera primero encajaría igual (como substring) y
# truncaría el último carácter — justo el bug que causaba lecturas cortadas.
PLATE_RE = re.compile(r"[A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9]{2}[0-9A-Z]")

# Confusiones típicas del OCR cuando esperamos dígitos
DIGIT_FIXES = str.maketrans({"O": "0", "Q": "0", "I": "1", "L": "1", "Z": "2", "S": "5", "B": "8"})
LETTER_FIXES = str.maketrans({"0": "O", "1": "I", "5": "S", "8": "B", "2": "Z"})

ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- "


@lru_cache(maxsize=1)
def get_reader():
    import easyocr  # import perezoso: tarda varios segundos

    # Solo inglés: las placas no llevan tildes ni eñes y el modelo es más liviano
    return easyocr.Reader(["en"], gpu=False, verbose=False)


def normalize_plate(raw: str) -> str | None:
    """Limpia una lectura cruda y trata de encajarla al formato de placa.

    Usa fullmatch (no search) sobre cada ventana candidata: con search, una
    placa ecuatoriana de 7 caracteres calzaría igual como substring del
    patrón colombiano de 6, truncando el último dígito. Se prueban ventanas
    de 7 antes que de 6 en toda la cadena, cada una cruda y luego con
    corrección de confusiones típicas del OCR (O/0, I/1, etc.).
    """
    text = re.sub(r"[^A-Z0-9]", "", raw.upper())
    if len(text) < 5 or len(text) > 8:
        return None

    def corregir(chunk: str) -> str:
        return chunk[:3].translate(LETTER_FIXES) + chunk[3:].translate(DIGIT_FIXES)

    for tam in (7, 6):
        for start in range(0, len(text) - tam + 1):
            chunk = text[start : start + tam]
            if PLATE_RE.fullmatch(chunk):
                return chunk
            candidato = corregir(chunk)
            if PLATE_RE.fullmatch(candidato):
                return candidato
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
            plate = normalize_plate(raw_text)
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
