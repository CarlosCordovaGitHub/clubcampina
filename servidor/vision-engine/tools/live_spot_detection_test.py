"""Prueba en vivo de detección de espacios libres/ocupados con YOLO.

A diferencia de live_camera_test.py (que lee placas vía el motor de visión),
este script corre localmente un detector de vehículos (YOLOv8n de Ultralytics)
sobre el feed de una cámara y compara cada detección contra polígonos fijos
que representan cada espacio de parqueo, para decidir si está libre u ocupado.

Es una herramienta exploratoria/desechable, no toca el pipeline de negocio.

Requiere: pip install ultralytics opencv-python

Flujo:
    1) Calibrar los espacios una sola vez por cámara (dibujar polígonos):
       python tools/live_spot_detection_test.py --source <url> --calibrate --spots espacios_zona1.json

       En la ventana: clic izquierdo para agregar un punto al espacio actual,
       'n' para cerrar el espacio actual y empezar el siguiente,
       'z' para deshacer el último punto,
       's' para guardar y salir, 'q'/Esc para salir sin guardar.

    2) Correr la detección en vivo contra esos espacios:
       python tools/live_spot_detection_test.py --source <url> --spots espacios_zona1.json

Fuente de cámara (--source):
    - Índice de webcam local: 0, 1, ...
    - RTSP:  rtsp://usuario:clave@host:puerto/Streaming/Channels/101
    - Snapshot HTTP repetido (ISAPI Hikvision), ej. a través de un túnel SSH:
      http://usuario:clave@127.0.0.1:8080/ISAPI/Streaming/channels/101/picture
      (OpenCV no hace polling de una URL de imagen estática sola; para ese caso
      usar --snapshot-url en vez de --source, ver abajo)

Controles en modo detección: 'q' o Esc para salir.
"""

import argparse
import json
import time
from pathlib import Path

import cv2
import numpy as np

# Clases COCO relevantes para vehículos: car, motorcycle, bus, truck
CLASES_VEHICULO = {2, 3, 5, 7}

VERDE = (60, 200, 60)   # libre
ROJO = (50, 50, 230)    # ocupado
AMARILLO = (30, 200, 230)
# Con máscaras de segmentación el solape real es menor que con cajas; 0.20 va bien.
UMBRAL_OCUPACION = 0.20  # fracción del área del polígono cubierta por un vehículo
MODELO_DEFECTO = "yolov8s-seg.pt"  # 8s detecta mejor autos lejanos/en sombra que 8n


def cargar_espacios(ruta: Path) -> list[list[tuple[int, int]]]:
    data = json.loads(ruta.read_text(encoding="utf-8"))
    return [[tuple(p) for p in poligono] for poligono in data["espacios"]]


def guardar_espacios(ruta: Path, espacios: list[list[tuple[int, int]]]) -> None:
    ruta.write_text(
        json.dumps({"espacios": espacios}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Guardado {len(espacios)} espacio(s) en {ruta}")


def abrir_fuente(source: str) -> cv2.VideoCapture:
    if source.isdigit():
        cap = cv2.VideoCapture(int(source), cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise SystemExit(f"No se pudo abrir la fuente: {source}")
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return cap


def modo_calibrar(source: str, ruta_espacios: Path) -> None:
    cap = abrir_fuente(source)
    ok, frame = cap.read()
    if not ok:
        raise SystemExit("No se pudo leer un cuadro para calibrar.")
    cap.release()

    espacios: list[list[tuple[int, int]]] = []
    actual: list[tuple[int, int]] = []

    def click(event, x, y, flags, userdata):
        if event == cv2.EVENT_LBUTTONDOWN:
            actual.append((x, y))

    ventana = "Calibración de espacios (clic=punto, n=siguiente, z=deshacer, s=guardar, q=salir)"
    cv2.namedWindow(ventana)
    cv2.setMouseCallback(ventana, click)

    print("Dibuja cada espacio haciendo clic en sus esquinas. 'n' para cerrarlo y pasar al siguiente.")

    while True:
        vista = frame.copy()
        for poligono in espacios:
            pts = np.array(poligono, dtype=np.int32)
            cv2.polylines(vista, [pts], True, VERDE, 2)
        if actual:
            pts = np.array(actual, dtype=np.int32)
            cv2.polylines(vista, [pts], False, AMARILLO, 2)
            for p in actual:
                cv2.circle(vista, p, 4, AMARILLO, -1)

        cv2.putText(
            vista, f"espacios guardados: {len(espacios)}  puntos actuales: {len(actual)}",
            (10, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA,
        )
        cv2.imshow(ventana, vista)
        key = cv2.waitKey(20) & 0xFF

        if key == ord("n"):
            if len(actual) >= 3:
                espacios.append(actual)
                actual = []
            else:
                print("Necesitas al menos 3 puntos para cerrar un espacio.")
        elif key == ord("z"):
            if actual:
                actual.pop()
            elif espacios:
                actual = espacios.pop()
        elif key == ord("s"):
            if len(actual) >= 3:
                espacios.append(actual)
            guardar_espacios(ruta_espacios, espacios)
            break
        elif key in (ord("q"), 27):
            print("Salida sin guardar.")
            break

    cv2.destroyAllWindows()


def fraccion_cubierta(poligono: np.ndarray, mascara_vehiculos: np.ndarray) -> float:
    mascara_espacio = np.zeros(mascara_vehiculos.shape, dtype=np.uint8)
    cv2.fillPoly(mascara_espacio, [poligono], 255)
    area_espacio = cv2.countNonZero(mascara_espacio)
    if area_espacio == 0:
        return 0.0
    interseccion = cv2.countNonZero(cv2.bitwise_and(mascara_espacio, mascara_vehiculos))
    return interseccion / area_espacio


def modo_detectar(source: str, ruta_espacios: Path, modelo_path: str, conf: float) -> None:
    from ultralytics import YOLO

    espacios = cargar_espacios(ruta_espacios)
    print(f"{len(espacios)} espacio(s) cargados desde {ruta_espacios}")

    modelo = YOLO(modelo_path)
    cap = abrir_fuente(source)

    print("Detección en vivo. 'q' o Esc para salir.")
    ultimo_fps_t = time.time()
    frames = 0
    fps = 0.0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("No se pudo leer un cuadro; reintentando…")
                time.sleep(0.5)
                continue

            resultado = modelo.predict(frame, conf=conf, verbose=False)[0]

            h, w = frame.shape[:2]
            mascara_vehiculos = np.zeros((h, w), dtype=np.uint8)
            # Con un modelo de segmentación (…-seg.pt) usamos la silueta real del
            # vehículo; así una caja rectangular no "invade" el cajón vecino. Si el
            # modelo es de solo detección, caemos a la caja delimitadora.
            if resultado.masks is not None:
                for seg, caja in zip(resultado.masks.data, resultado.boxes):
                    if int(caja.cls[0]) not in CLASES_VEHICULO:
                        continue
                    m = cv2.resize((seg.cpu().numpy() * 255).astype(np.uint8),
                                   (w, h), interpolation=cv2.INTER_NEAREST)
                    mascara_vehiculos = cv2.bitwise_or(mascara_vehiculos, m)
            else:
                for caja in resultado.boxes:
                    if int(caja.cls[0]) not in CLASES_VEHICULO:
                        continue
                    x1, y1, x2, y2 = map(int, caja.xyxy[0])
                    cv2.rectangle(mascara_vehiculos, (x1, y1), (x2, y2), 255, -1)

            libres = 0
            for poligono_pts in espacios:
                poligono = np.array(poligono_pts, dtype=np.int32)
                ocupado = fraccion_cubierta(poligono, mascara_vehiculos) >= UMBRAL_OCUPACION
                color = ROJO if ocupado else VERDE
                libres += 0 if ocupado else 1
                cv2.polylines(frame, [poligono], True, color, 2)
                cx, cy = poligono_pts[0]
                cv2.putText(
                    frame, "OCUPADO" if ocupado else "LIBRE", (cx, cy - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA,
                )

            frames += 1
            if time.time() - ultimo_fps_t >= 1.0:
                fps = frames / (time.time() - ultimo_fps_t)
                frames = 0
                ultimo_fps_t = time.time()

            cv2.rectangle(frame, (0, 0), (frame.shape[1], 34), (20, 20, 20), -1)
            cv2.putText(
                frame, f"libres: {libres}/{len(espacios)}   {fps:.1f} fps",
                (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA,
            )

            cv2.imshow("Club Campiña — espacios libres/ocupados (q para salir)", frame)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, help="Índice de webcam o URL RTSP/HTTP de la cámara")
    parser.add_argument("--spots", required=True, type=Path, help="Ruta al JSON de polígonos de espacios")
    parser.add_argument("--calibrate", action="store_true", help="Modo calibración: dibujar y guardar espacios")
    parser.add_argument("--model", default=MODELO_DEFECTO, help="Modelo YOLO a usar (se descarga solo la 1ra vez)")
    parser.add_argument("--conf", type=float, default=0.25, help="Umbral de confianza de detección")
    args = parser.parse_args()

    if args.calibrate:
        modo_calibrar(args.source, args.spots)
    else:
        if not args.spots.exists():
            raise SystemExit(f"No existe {args.spots}. Corre primero con --calibrate.")
        modo_detectar(args.source, args.spots, args.model, args.conf)


if __name__ == "__main__":
    main()
