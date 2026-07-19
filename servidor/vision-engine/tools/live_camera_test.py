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

    # Contra el motor de visión del stack Docker de producción
    python tools/live_camera_test.py --url http://localhost:8080/api/v1/plate-passthrough

Controles: 'q' o Esc para salir. Cada `--interval` segundos se envía el
cuadro actual al motor de visión; el resultado se dibuja sobre el video en
vivo hasta la siguiente lectura.
"""

import argparse
import time

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

    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise SystemExit(f"No se pudo abrir la cámara/fuente: {args.source}")

    print(f"Cámara abierta. Enviando lecturas a {args.url} cada {args.interval}s.")
    print("Presiona 'q' o Esc en la ventana de video para salir.")

    ultimo_envio = 0.0
    ultimo_texto = "esperando lectura…"
    ultimo_bbox = None
    ultimo_color = AMBAR

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("No se pudo leer un cuadro de la cámara; reintentando…")
                time.sleep(0.5)
                continue

            ahora = time.time()
            if ahora - ultimo_envio >= args.interval:
                ultimo_envio = ahora
                ok_jpg, buf = cv2.imencode(".jpg", frame)
                if ok_jpg:
                    try:
                        resp = requests.post(
                            args.url,
                            files={"image": ("frame.jpg", buf.tobytes(), "image/jpeg")},
                            timeout=5,
                        )
                        resp.raise_for_status()
                        data = resp.json()
                        placa = data.get("plate_text")
                        conf = data.get("confidence", 0.0)
                        backend = data.get("backend", "?")
                        ms = data.get("processing_ms", "?")
                        ultimo_bbox = data.get("bbox")
                        ultimo_color = color_por_confianza(conf)
                        if placa:
                            ultimo_texto = f"{placa}  {conf*100:.0f}%  [{backend}, {ms}ms]"
                        else:
                            ultimo_texto = f"sin lectura  (mejor intento {conf*100:.0f}%)"
                    except requests.RequestException as e:
                        ultimo_texto = f"error llamando al motor de visión: {e}"
                        ultimo_color = ROJO
                        ultimo_bbox = None

            if ultimo_bbox:
                x1, y1, x2, y2 = ultimo_bbox
                cv2.rectangle(frame, (x1, y1), (x2, y2), ultimo_color, 3)

            cv2.rectangle(frame, (0, 0), (frame.shape[1], 40), (20, 20, 20), -1)
            cv2.putText(
                frame, ultimo_texto, (10, 27),
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
