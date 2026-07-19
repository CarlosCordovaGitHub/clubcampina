"""Motor de visión — microservicio independiente (ALPR sobre imágenes subidas).

Se comunica con el motor principal (NestJS) solo por HTTP: un pico de carga aquí
no afecta la lógica de negocio, y se puede escalar/reemplazar por separado.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routers import plate
from app.services.ocr_engine import get_reader


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Carga el modelo EasyOCR al arrancar (no en la primera petición)
    get_reader()
    yield


app = FastAPI(
    title="Club Campiña — Motor de Visión",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(plate.router)


@app.get("/health")
def health():
    return {"status": "ok"}
