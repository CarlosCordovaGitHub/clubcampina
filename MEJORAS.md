# Mejoras pendientes — Módulo de Parqueadero y Control de Acceso

Estado actual: las 10 fases del [PLAN.md](PLAN.md) están implementadas y
verificadas end-to-end (dev y Docker prod), y el motor de visión ya usa un
**ALPR dedicado** (fast-alpr: YOLOv9 + OCR de matrículas, ~30 ms/foto) con
EasyOCR como respaldo. Lo que sigue, en orden aproximado de prioridad:

## Pendiente inmediato

- [x] ~~Reconstruir la imagen Docker de `vision-engine`~~ — hecho: el stack de
  producción ya corre fast-alpr (verificado con un ingreso real por Nginx).
- [ ] **Probar con fotos y cámara reales**: todas las pruebas hasta ahora usan
  imágenes sintéticas — esta máquina no tiene ninguna cámara física conectada
  (`Get-PnpDevice -Class Camera` no devuelve nada). Herramientas ya listas
  para cuando haya una cámara a mano:
  - `servidor/vision-engine/tools/live_camera_test.py` — apunta una webcam o
    una cámara IP (celular con app tipo *IP Webcam*/*EpocCam*) directo al
    motor de visión y muestra la lectura en vivo sobre el video (ver
    `tools/README.md` para instalar OpenCV con GUI, separado del venv
    "headless" que usa el contenedor).
  - Botón **"Usar cámara en vivo"** en Ingreso/Salida de la web — prueba el
    flujo de negocio completo con la cámara del navegador (celular o laptop).
  Con cualquiera de las dos, recolectar fotos reales de la portería
  (día/noche, lluvia, contraluz) y medir tasa de acierto antes de confiar en
  el umbral de confianza actual (`OCR_MIN_CONFIDENCE=0.35`).

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
