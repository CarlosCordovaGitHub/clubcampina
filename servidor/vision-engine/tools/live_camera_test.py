"""Prueba en vivo del ALPR con una cámara real (webcam o RTSP de una IP cam).

No pasa por la API de negocio ni requiere login: llama directo al motor de
visión (`POST /plate/recognize`) para validar rápidamente si el modelo lee
bien las placas de vehículos reales frente a una cámara.

Uso:
    # Webcam por defecto (índice 0) contra el motor de visión local
    python tools/live_camera_test.py

    # Otra webcam (índice 1) o una cámara IP por RTSP
    python tools/live_camera_test.py --source 1
    python tools/live_camera_test.py --source rtsp://usuario:clave@192.168.1.50/stream1

Controles: 'q' o Esc para salir. Cada `--interval` segundos se envía el
cuadro actual al motor de visión EN UN HILO APARTE, para que el video nunca
se congele esperando la respuesta; el resultado se dibuja sobre el video en
vivo hasta la siguiente lectura.
"""

import argparse
import threading
import time
from datetime import datetime

import cv2
import requests

VERDE = (60, 200, 60)
ROJO = (50, 50, 230)
AMBAR = (30, 170, 240)


def color_por_confianza(conf: float) -> tuple[int, int, int]:
    if conf >= 0.85:
        return VERDE
    if conf >= 0.5:
        return AMBAR
    return ROJO


class EstadoLectura:
    """Compartido entre el hilo de red y el loop de video; protegido por lock."""

    def __init__(self):
        self.lock = threading.Lock()
        self.texto = "esperando lectura…"
        self.bbox = None
        self.color = AMBAR
        self.enviando = False


def reconocer_en_hilo(url: str, frame_jpg: bytes, estado: EstadoLectura):
    hora = datetime.now().strftime("%H:%M:%S")
    try:
        resp = requests.post(
            url,
            files={"image": ("frame.jpg", frame_jpg, "image/jpeg")},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        placa = data.get("plate_text")
        conf = data.get("confidence", 0.0)
        backend = data.get("backend", "?")
        ms = data.get("processing_ms", "?")
        with estado.lock:
            estado.bbox = data.get("bbox")
            estado.color = color_por_confianza(conf)
            if placa:
                estado.texto = f"{placa}  {conf*100:.0f}%  [{backend}, {ms}ms]"
                print(f"[{hora}] {placa}  conf={conf*100:.0f}%  backend={backend}  {ms}ms", flush=True)
            else:
                estado.texto = f"sin lectura  (mejor intento {conf*100:.0f}%)"
                print(f"[{hora}] sin lectura  (mejor intento {conf*100:.0f}%)", flush=True)
    except requests.RequestException as e:
        with estado.lock:
            estado.texto = f"error llamando al motor de visión: {e}"
            estado.color = ROJO
            estado.bbox = None
        print(f"[{hora}] error: {e}", flush=True)
    finally:
        with estado.lock:
            estado.enviando = False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default="0",
        help="Índice de cámara local (0, 1, …) o URL RTSP/HTTP de una cámara IP",
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000/plate/recognize",
        help="Endpoint del motor de visión",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Segundos entre lecturas de placa (el video se ve fluido igual)",
    )
    args = parser.parse_args()

    if args.source.isdigit():
        # En Windows, abrir por índice sin backend explícito falla en muchos
        # equipos ("can't be used to capture by index"); DSHOW sí funciona.
        cap = cv2.VideoCapture(int(args.source), cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(args.source)  # URL RTSP/HTTP de una cámara IP
    if not cap.isOpened():
        raise SystemExit(f"No se pudo abrir la cámara/fuente: {args.source}")

    # Buffer de 1: si no se drena tan rápido como llegan cuadros (típico con
    # iVCam por WiFi), DirectShow acumula frames viejos y el video se atrasa
    # cada vez más ("lag" creciente). Con buffer 1 siempre se lee el más reciente.
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    print(f"Cámara abierta. Enviando lecturas a {args.url} cada {args.interval}s.")
    print("Presiona 'q' o Esc en la ventana de video para salir.")

    estado = EstadoLectura()
    ultimo_envio = 0.0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("No se pudo leer un cuadro de la cámara; reintentando…")
                time.sleep(0.5)
                continue

            ahora = time.time()
            with estado.lock:
                puede_enviar = not estado.enviando
            if puede_enviar and ahora - ultimo_envio >= args.interval:
                ultimo_envio = ahora
                ok_jpg, buf = cv2.imencode(".jpg", frame)
                if ok_jpg:
                    with estado.lock:
                        estado.enviando = True
                    threading.Thread(
                        target=reconocer_en_hilo,
                        args=(args.url, buf.tobytes(), estado),
                        daemon=True,
                    ).start()

            with estado.lock:
                texto, bbox, color = estado.texto, estado.bbox, estado.color

            if bbox:
                x1, y1, x2, y2 = bbox
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)

            cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (20, 20, 20), -1)
            cv2.putText(
                frame, texto, (10, 27),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA,
            )

            cv2.imshow("Club Campiña — prueba ALPR en vivo (q para salir)", frame)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
