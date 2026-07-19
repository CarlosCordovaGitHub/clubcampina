import time

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.ocr_engine import recognize_plate
from app.services.preprocessing import preprocess

router = APIRouter(prefix="/plate", tags=["plate"])


class PlateResponse(BaseModel):
    plate_text: str | None
    confidence: float
    bbox: tuple[int, int, int, int] | None
    processing_ms: int


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
    variants = preprocess(bgr)
    plate_text, confidence, bbox = recognize_plate(variants)
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    return PlateResponse(
        plate_text=plate_text,
        confidence=round(confidence, 4),
        bbox=bbox,
        processing_ms=elapsed_ms,
    )
