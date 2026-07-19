# Motor de visión (FastAPI + EasyOCR) — CPU. Si el club llega a tener servidor
# con GPU (ver niveles de hardware del documento), cambiar la base por una
# imagen CUDA e instalar torch con soporte GPU.
FROM python:3.11-slim
WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-descarga de los modelos en el build: evita el retraso (y la dependencia
# de red) en el primer arranque del contenedor.
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False, verbose=False)" \
 && python -c "from fast_alpr import ALPR; ALPR(detector_model='yolo-v9-t-384-license-plate-end2end', ocr_model='cct-xs-v1-global-model')"

COPY app/ app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
