# Herramientas de prueba con hardware real

## `live_camera_test.py` — probar el ALPR con una cámara en vivo

Abre una cámara (webcam USB, o una cámara IP por RTSP/HTTP) y muestra en una
ventana lo que el motor de visión lee de cada cuadro, en tiempo real. No pasa
por la API de negocio ni requiere login — es la forma más rápida de validar
si el modelo lee bien las placas de vehículos reales.

### Preparación (una sola vez)

El venv del servicio (`servidor/vision-engine/.venv`) usa
`opencv-python-headless` a propósito (sin soporte de ventanas — es lo correcto
para un contenedor Docker). Para poder abrir una ventana de video en tu
escritorio necesitas la variante con GUI:

```bash
cd servidor/vision-engine
.venv/Scripts/pip uninstall -y opencv-python-headless
.venv/Scripts/pip install -r tools/requirements-dev.txt
```

(Si más adelante vuelves a construir/desplegar el contenedor, no importa: el
`Dockerfile` instala sus propias dependencias desde `requirements.txt`, que
sigue apuntando a `opencv-python-headless`. Este cambio solo afecta tu venv
local de pruebas.)

### Uso

Con el motor de visión corriendo (`uvicorn app.main:app --port 8000`, o el del
stack Docker):

```bash
# Webcam por defecto de tu equipo
.venv/Scripts/python tools/live_camera_test.py

# Cámara IP de un celular (ver más abajo) o cualquier RTSP/HTTP
.venv/Scripts/python tools/live_camera_test.py --source rtsp://usuario:clave@192.168.1.50/stream1
```

Apunta la cámara a un vehículo real; la ventana muestra la placa leída, la
confianza y el recuadro detectado, actualizándose cada segundo. `q` o Esc para
salir.

### Si tu equipo no tiene webcam (como este ambiente de prueba)

Windows no detectó ninguna cámara en esta máquina al escribir esto
(`Get-PnpDevice -Class Camera` no devuelve nada). Dos formas de conseguir una
cámara real sin comprar hardware:

1. **App de "cámara IP" en el celular** — instala algo como *IP Webcam*
   (Android) o *EpocCam*/*iVCam* (iPhone), conecta el celular a la misma red
   Wi-Fi, y usa la URL RTSP/HTTP que la app te muestra con `--source`.
2. **Webcam USB** — conéctala y vuelve a correr el script; debería aparecer
   automáticamente en el índice `0`.

### Probar el flujo completo (no solo el OCR)

Este script solo prueba el motor de visión aislado. Para probar el flujo de
negocio completo (autorizar/rechazar, ocupar zona, historial) con una cámara
real, usa el botón **"Usar cámara en vivo"** en la página *Ingreso / Salida*
de la web — funciona con la cámara del navegador (celular o laptop) y sigue
exactamente el mismo camino que un archivo subido a mano.

Nota: los navegadores exigen HTTPS (o `localhost`) para dar permiso de
cámara a otro host — si abres la web desde el celular usando la IP del
servidor por HTTP plano, el navegador bloqueará el acceso a la cámara.
