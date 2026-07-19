"""Preprocesamiento OpenCV previo al OCR.

Devuelve varias variantes de la imagen; EasyOCR se ejecuta sobre cada una y se
queda con la lectura de mayor confianza (las placas reales llegan con
iluminación y ángulos variados; ninguna variante gana siempre).
"""

import cv2
import numpy as np

MAX_WIDTH = 1280


def preprocess(bgr: np.ndarray) -> list[np.ndarray]:
    # Reescalar: imágenes enormes solo hacen lento el OCR
    h, w = bgr.shape[:2]
    if w > MAX_WIDTH:
        scale = MAX_WIDTH / w
        bgr = cv2.resize(bgr, (MAX_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Filtro bilateral: reduce ruido conservando bordes (los caracteres)
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # CLAHE: ecualización adaptativa para placas sobre/subexpuestas
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    equalized = clahe.apply(denoised)

    return [bgr, denoised, equalized]
