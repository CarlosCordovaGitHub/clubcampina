import logging
import os
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.ocr_engine import recognize_plate
from app.services.preprocessing import preprocess

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plate", tags=["plate"])

# Backend de reconocimiento:
#   fast_alpr (defecto) — detector YOLOv9 + OCR entrenados en placas (ONNX, CPU)
#   easyocr             — OCR genérico con preprocesamiento OpenCV
VISION_BACKEND = os.getenv("VISION_BACKEND", "fast_alpr")


class PlateResponse(BaseModel):
    plate_text: str | None
    confidence: float
    bbox: tuple[int, int, int, int] | None
    processing_ms: int
    backend: str


@router.post("/recognize", response_model=PlateResponse)
async def recognize(image: UploadFile = File(...)) -> PlateResponse:
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Imagen vacía")

    array = np.frombuffer(raw, dtype=np.uint8)
    bgr = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if bgr is None:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")

    start = time.perf_counter()
    backend = VISION_BACKEND
    plate_text: str | None = None
    confidence = 0.0
    bbox = None

    if VISION_BACKEND == "fast_alpr":
        from app.services.alpr_engine import recognize_plate_alpr

        plate_text, confidence, bbox = recognize_plate_alpr(bgr)
        if plate_text is None:
            # El detector no encontró placa legible; EasyOCR a veces rescata
            # fotos muy cerradas (solo la placa) donde el detector falla.
            plate_text, confidence, bbox = recognize_plate(preprocess(bgr))
            if plate_text is not None:
                backend = "easyocr-fallback"
    else:
        backend = "easyocr"
        plate_text, confidence, bbox = recognize_plate(preprocess(bgr))

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "reconocimiento backend=%s placa=%s conf=%.3f (%d ms)",
        backend, plate_text, confidence, elapsed_ms,
    )

    return PlateResponse(
        plate_text=plate_text,
        confidence=round(confidence, 4),
        bbox=bbox,
        processing_ms=elapsed_ms,
        backend=backend,
    )
