# Sesión de prueba: detección de espacios libres/ocupados con cámara real

Fecha: 2026-07-22

## Contexto

Se probó, contra una cámara real del club (Hikvision, accedida vía túnel SSH
`ssh -L 127.0.0.1:8080:127.0.0.1:18080 ubuntu@2.24.89.88`), si es viable
detectar visualmente qué espacios de parqueo están libres u ocupados,
como complemento al flujo actual del sistema (que infiere ocupación solo
a partir de lecturas ALPR de entrada/salida, sin mirar los espacios).

## Hallazgo de partida

Revisando el código (Prisma, NestJS, vision-engine, UI) se confirmó que
**no existe ningún modelo de cámara ni de espacio individual**:
- `ZonaParqueadero` en `servidor/api/prisma/schema.prisma` ya representa
  una sola plaza con estado LIBRE/OCUPADA, pero ese estado lo cambia
  `EventoAcceso` (ingreso/salida por placa), no una cámara.
- El `vision-engine` (FastAPI) solo expone `POST /plate/recognize` para
  leer una placa en un frame — no hay concepto de detección de vehículos
  genérica ni de polígonos de espacios.
- No hay CRUD de cámaras en el backend ni campos de cámara en la UI de
  zonas (`app/web/src/pages/ZonasMapaPage.tsx`).

## Prueba realizada

1. **Acceso a la cámara**: snapshot ISAPI vía túnel funcionó de inmediato:
   `http://admin:<clave>@127.0.0.1:8080/ISAPI/Streaming/channels/101/picture`
   (HTTP 200, ~550 KB, auth digest).
2. **Detección de vehículos**: se probó YOLO (Ultralytics) sobre el frame
   real capturado desde esa cámara.
   - `yolov8n` (nano): detectó bien la fila principal de autos, pero falló
     con el bus escolar, el taxi lejano y un auto en sombra en el borde
     del cuadro (confianza insuficiente).
   - `yolov8s-seg` (small, con segmentación): resolvió ambos problemas —
     detecta vehículos lejanos/en sombra con más confianza, y al usar la
     **silueta real** del vehículo (máscara) en vez de la caja rectangular,
     un auto ya no "invade" el polígono del cajón vecino.
3. **Lógica de ocupación**: por cada cajón se definió un polígono manual
   (coordenadas de sus 4 esquinas); un cajón se marca OCUPADO si la máscara
   de vehículos cubre ≥20% de su área, LIBRE en caso contrario.
4. **Resultado**: sobre la fila delantera de la zona probada (9 cajones,
   luego ampliada a 30 según conteo real del usuario) **la detección de
   ocupados acertó el 100%** — cero falsos negativos (nunca marcó "libre"
   un cajón que en realidad tenía un auto).

## Limitación encontrada

Desde el ángulo/altura actual de esta cámara, **solo la fila delantera del
parqueadero es confiable**. Las filas del medio y del fondo se ocluyen
visualmente entre sí (los techos/carrocerías de la fila delantera tapan
la vista de las filas de atrás), lo que hace poco fiable mapear esas
bahías con un solo polígono fijo por cajón. Un borrador automático de
polígonos para esas filas dio resultados imprecisos y se descartó a favor
de calibración manual (clic por cajón) cuando se retome.

**Implicación para producción**: para cubrir todo el parqueadero con
este método, hace falta evaluar por cámara/zona si conviene reubicar la
cámara (más alta o con más inclinación) o usar una cámara adicional por
sector, en vez de asumir que una sola cámara cubre confiablemente todas
las filas.

## Artefactos generados

- [`servidor/vision-engine/tools/live_spot_detection_test.py`](servidor/vision-engine/tools/live_spot_detection_test.py) —
  herramienta exploratoria (no toca el pipeline de negocio) para calibrar
  polígonos de espacios sobre un frame real y correr detección en vivo.
  Usa por defecto `yolov8s-seg.pt` con segmentación y umbral de solape 0.20
  (los valores que dieron 100% de acierto en la prueba).
- [`servidor/vision-engine/tools/calibraciones/zona1_porteria.json`](servidor/vision-engine/tools/calibraciones/zona1_porteria.json) —
  calibración validada de los 9 cajones de la fila delantera de la zona
  probada (portería). Sirve de base para completar el resto de la zona.

## Pendiente (siguiente sesión)

1. Completar la calibración de la zona probada: los cajones de las filas
   media y del fondo (hasta completar los ~30 reales) requieren clic manual
   con `live_spot_detection_test.py --calibrate`, no generación automática.
2. Decidir e implementar la integración real al sistema:
   - Modelo `Camara` (URL/credenciales de stream, zona asociada) y
     `EspacioParqueo` (polígono, cámara, estado) en Prisma.
   - CRUD de cámaras en NestJS.
   - Worker que haga polling del snapshot de cada cámara y actualice el
     estado LIBRE/OCUPADA de cada espacio (y opcionalmente de
     `ZonaParqueadero`).
   - Extender `ZonasMapaPage.tsx` (o una vista nueva) para visualizar el
     estado por espacio y, para administración, calibrar/editar polígonos.
3. Evaluar reposicionamiento o cámaras adicionales para cubrir filas que
   hoy quedan ocluidas.
