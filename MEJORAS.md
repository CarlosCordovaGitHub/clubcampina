# Mejoras pendientes — Módulo de Parqueadero y Control de Acceso

Estado actual: las 10 fases del [PLAN.md](PLAN.md) están implementadas y
verificadas end-to-end (dev y Docker prod), y el motor de visión ya usa un
**ALPR dedicado** (fast-alpr: YOLOv9 + OCR de matrículas, ~30 ms/foto) con
EasyOCR como respaldo. Lo que sigue, en orden aproximado de prioridad:

## Pendiente inmediato

- [x] ~~Reconstruir la imagen Docker de `vision-engine`~~ — hecho: el stack de
  producción ya corre fast-alpr (verificado con un ingreso real por Nginx).
- [x] ~~Probar con cámara real~~ — hecho con iVCam (cámara virtual desde
  celular) usando `servidor/vision-engine/tools/live_camera_test.py`. Placa
  real `PCP-6521` (Ecuador) leída correctamente y repetida al 100% de
  confianza en ~30ms; varias placas más leídas de forma consistente. En el
  camino se encontraron y corrigieron dos bugs reales (ver "Correcciones
  encontradas probando con cámara real" más abajo).
- [ ] **Recolectar más muestras reales de la portería**: la prueba con iVCam
  fue una validación puntual, no un dataset. Recolectar fotos/video reales
  en distintas condiciones (día/noche, lluvia, contraluz, vehículos en
  movimiento) y medir tasa de acierto antes de confiar en el umbral de
  confianza actual (`OCR_MIN_CONFIDENCE=0.35`). Herramientas disponibles:
  - `servidor/vision-engine/tools/live_camera_test.py` — cámara/webcam/IP
    directo al motor de visión, ver `tools/README.md`.
  - Botón **"Usar cámara en vivo"** en Ingreso/Salida de la web — prueba el
    flujo de negocio completo (esta parte aún no se probó con hardware real,
    solo el script aislado).

### Correcciones encontradas probando con cámara real

1. **Formato de placa hardcodeado a Colombia**: `normalize_plate()` (motor de
   visión) y la validación de los DTOs (`vehiculos/dto.ts`,
   `visitantes/dto.ts`) solo aceptaban 6 caracteres (`ABC123`). Una placa
   ecuatoriana real (`ABC1234`, 7 caracteres) se registraba con el último
   dígito **truncado**, y ni siquiera se podía dar de alta un vehículo con ese
   formato. Corregido para aceptar ambos formatos (ver `PLATE_RE` en
   `ocr_engine.py` y las regex de los DTOs) — probado con la placa real del
   usuario y con casos límite de confusión de caracteres (O/0, I/1).
2. **Ventana de video se congelaba**: `live_camera_test.py` hacía la llamada
   HTTP al motor de visión de forma síncrona en el mismo loop que dibuja el
   video, así que cada segundo la ventana se congelaba mientras esperaba
   respuesta. Corregido moviendo la llamada a un hilo aparte.
3. **Recorte de placa sin margen**: `fast-alpr` recorta exactamente al cuadro
   que devuelve el detector, sin margen; si el detector se queda un poco
   corto, el OCR recibe la imagen con el borde cortado. Se agregó un padding
   del 12% alrededor del cuadro detectado (`alpr_engine.py`) antes de pasarlo
   al OCR — reimplementando el pipeline detección→OCR en vez de usar
   `alpr.predict()` directo, para poder insertar ese paso.
4. Se intentó subir a modelos más grandes (`yolo-v9-s-608`, `cct-s-v2`)
   esperando mejor precisión, pero **el detector más grande no detectaba
   nada** en imágenes que el modelo pequeño sí leía — se revirtió a
   `yolo-v9-t-384` + `cct-xs-v1` (los de antes). Si se reintenta usar modelos
   más grandes, validar primero contra las imágenes de prueba existentes.

## Seguridad y operación

- [ ] Cambiar las credenciales seed (`admin1234`) y `JWT_SECRET` en cualquier
  despliegue real; considerar expiración/rotación de tokens y refresh tokens.
- [ ] HTTPS en Nginx (certificado + redirección) antes de exponer fuera de la LAN.
- [ ] Rate limiting en `/auth/login` y en los endpoints de eventos (hoy no hay).
- [ ] Backups automáticos de Postgres y de la carpeta `uploads/` (volumen Docker).
- [ ] Logs estructurados + retención (hoy solo consola) y métricas básicas
  (tiempo de OCR, eventos/hora) — un Prometheus/Grafana ligero bastaría.
- [ ] Tests automatizados: unitarios de la lógica de decisión de
  `eventos-acceso` (hoy la cobertura es solo verificación manual end-to-end) y
  un e2e con Supertest contra la API.

## Funciones de producto — IMPLEMENTADAS

- [x] **Administración de zonas desde la UI**: crear (ADMIN) y eliminar zonas
  en el mapa, además del habilitar/deshabilitar existente.
- [x] **Vehículos de visitantes**: autorización temporal con placa + tiempo
  máximo (1–24 h); el flujo de ingreso/salida los acepta como titulares; barrido
  cada 5 min publica alerta WS si exceden la estadía y el listado marca
  EXCEDIDO en vivo.
- [x] **Reportes** (`/reportes` en la UI, `GET /api/v1/reportes/resumen`):
  KPIs, ingresos por hora del día (hora local, `REPORTES_TZ`), socios más
  frecuentes, y exportación CSV del historial
  (`GET /api/v1/eventos-acceso/export.csv`).
- [x] **Notificaciones al operador**: notificaciones nativas del navegador en
  eventos ALERTA (opt-in con botón "Activar notificaciones") además del banner.
  *Pendiente si se quiere: canal por correo (requiere SMTP del club).*
- [x] El resultado del ingreso muestra motor de lectura (`backend`) y bbox.

## Extensiones de arquitectura (ganchos ya previstos)

- [ ] **Cámaras reales**: hoy la foto se sube manualmente; el siguiente paso es
  un pequeño agente que capture de una cámara IP (RTSP) y llame al mismo
  endpoint de ingreso/salida.
- [ ] **Barreras físicas**: un servicio `barrera-driver` que escuche el pub/sub
  de Redis (`evento.nuevo` AUTORIZADO → abrir talanquera).
- [ ] **Reconocimiento facial**: microservicio hermano de `vision-engine` con
  su propio `vision-client` en la API (fuera de alcance de esta fase, hueco
  arquitectónico ya dejado).
- [ ] **App móvil**: reutilizar `@club-campina/shared-types`, el cliente API
  tipado (`app/web/src/api/`) y los hooks de `features/` en React Native.
- [ ] **GPU**: si el club monta el servidor con GPU del documento, cambiar la
  base del Dockerfile de `vision-engine` a una imagen CUDA y onnxruntime-gpu.

## Deuda técnica menor

- [ ] Migrar la config de seed de Prisma a `prisma.config.ts` (el bloque
  `package.json#prisma` está deprecado en Prisma 7).
- [ ] Unificar fin de línea (añadir `.gitattributes`) para eliminar los avisos
  LF/CRLF de git en Windows.
- [ ] El listado de zonas ordena en memoria tras leer de Redis; si las zonas
  crecen a cientos, mover el orden/paginado a la consulta.
- [ ] `docker-compose.prod.yml` monta `uploads` como volumen anónimo con
  driver local; documentar (o automatizar) su backup junto al de Postgres.
