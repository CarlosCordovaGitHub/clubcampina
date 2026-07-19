# Mejoras pendientes — Módulo de Parqueadero y Control de Acceso

Estado actual: las 10 fases del [PLAN.md](PLAN.md) están implementadas y
verificadas end-to-end (dev y Docker prod), y el motor de visión ya usa un
**ALPR dedicado** (fast-alpr: YOLOv9 + OCR de matrículas, ~30 ms/foto) con
EasyOCR como respaldo. Lo que sigue, en orden aproximado de prioridad:

## Pendiente inmediato

- [ ] **Reconstruir la imagen Docker de `vision-engine`**: el Dockerfile ya
  pre-descarga los modelos de fast-alpr, pero la imagen del stack de producción
  quedó construida antes del cambio. Ejecutar:
  `docker compose -f docker-compose.prod.yml build vision-engine && docker compose -f docker-compose.prod.yml up -d vision-engine`
  y verificar que `POST /plate/recognize` responda `"backend": "fast_alpr"`.
- [ ] **Probar con fotos reales de vehículos del club**: todas las pruebas se
  hicieron con imágenes sintéticas. Recolectar fotos reales de la portería
  (día/noche, lluvia, contraluz) y medir tasa de acierto antes de confiar en el
  umbral de confianza actual (`OCR_MIN_CONFIDENCE=0.35`).

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

## Funciones de producto

- [ ] **Página de administración de zonas** (crear/eliminar desde la UI; hoy
  solo se cambia estado — el CRUD completo ya existe en la API).
- [ ] **Vehículos de visitantes**: registro temporal con placa + tiempo máximo,
  y alerta si excede la estadía.
- [ ] **Reportes**: ocupación por franja horaria, frecuencia por socio,
  exportación CSV del historial.
- [ ] **Notificaciones**: aviso al operador (push/correo) en eventos ALERTA
  (placa clonada, socio suspendido intentando entrar).
- [ ] Mostrar el campo `backend` y el bbox del reconocimiento en la UI de
  ingreso (útil para diagnosticar lecturas dudosas).

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
