# Módulo de Parqueadero y Control de Acceso — Club Campiña

## Contexto

El documento `Modulo_Parqueadero_y_Control_de_Acceso.docx` describe la arquitectura ideal de un módulo que reconoce automáticamente las placas de los vehículos que ingresan/salen del club y mantiene en tiempo real el estado de cada zona del parqueadero (libre / ocupada / qué vehículo la ocupa). La arquitectura del documento separa un "motor de visión" (IA, Python) del "motor principal" (lógica de negocio, NestJS) para que un pico de reconocimiento de placas nunca afecte al resto del sistema — mismo principio que aplicaremos aquí aunque construyamos solo este módulo, de forma aislada y autocontenida.

El directorio de trabajo está vacío (solo el .docx y un logo.jpg) y no es un repo git: es un proyecto greenfield.

**Decisiones de alcance confirmadas con el usuario:**
1. Solo ALPR (placas) + zonas de parqueadero. Reconocimiento facial queda fuera, pero la arquitectura deja el hueco para añadirlo como otro microservicio hermano.
2. El "motor de visión" hace OCR **real** (no simulado) sobre imágenes subidas — no hay cámaras físicas conectadas.
3. Frontend: por ahora solo app **web** (React), pero separando toda la lógica de negocio del lado del cliente en `features/` y los tipos en un paquete compartido, para poder añadir una app móvil (React Native/Flutter) después sin tocar el backend.
4. Stack: NestJS + PostgreSQL + Redis (estado en tiempo real + pub/sub) + motor de visión Python/FastAPI + React/TypeScript.

## Estructura de carpetas

Monorepo simple (npm workspaces, sin Nx/Turborepo — no se justifica con solo 3 servicios en 2 lenguajes distintos):

```
Club Campiña/
├── docker-compose.yml              # Postgres + Redis para desarrollo local
├── docker-compose.prod.yml         # stack completo (api, vision-engine, web/nginx) para despliegue
├── docs/                           # mover aquí el .docx de la propuesta
├── assets/                         # mover aquí logo.jpg
│
├── servidor/                       # BACKEND
│   ├── package.json                # workspaces root
│   ├── api/                        # Motor principal — NestJS
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── auth/               # login JWT de operadores, guard de roles
│   │       ├── miembros/           # CRUD Socio
│   │       ├── vehiculos/          # CRUD Vehículo
│   │       ├── zonas/              # CRUD Zona de parqueadero + estado
│   │       ├── eventos-acceso/     # orquestación: llama vision-engine, decide, registra, emite WS
│   │       ├── vision-client/      # cliente HTTP hacia el microservicio Python
│   │       ├── realtime/           # Gateway Socket.io + Redis pub/sub
│   │       ├── cache/              # módulo Redis
│   │       ├── storage/            # guardado de fotos (filesystem, interfaz extensible a S3)
│   │       └── database/           # entidades Prisma + migraciones
│   ├── vision-engine/              # Motor de visión — Python FastAPI (servicio independiente)
│   │   ├── Dockerfile
│   │   └── app/
│   │       ├── routers/plate.py    # POST /plate/recognize
│   │       └── services/           # preprocessing.py (OpenCV), ocr_engine.py (EasyOCR)
│   └── shared/                     # @club-campina/shared-types (DTOs, enums, eventos WS)
│
└── app/                            # FRONTEND
    └── web/                        # React + TypeScript + Vite (única app por ahora)
        ├── Dockerfile              # build Vite + sirve estáticos con nginx:alpine (también reverse proxy a /api)
        └── src/
            ├── pages/               # DashboardPage, ZonasMapaPage, IngresoSimuladoPage,
            │                        # EventosHistorialPage, MiembrosPage, VehiculosPage
            ├── features/            # lógica de negocio por dominio (hooks, sin UI) — reutilizable por una futura app móvil
            ├── api/                 # cliente REST tipado (usa @club-campina/shared-types)
            ├── realtime/            # cliente Socket.io + integración con React Query
            └── components/          # solo presentación
            # (futuro: app/movil/ — React Native, reutiliza api/ y parte de features/)
```

`vision-engine` se comunica con `api` solo por HTTP interno — desacoplados como pide el documento. Nginx (la "puerta de entrada" del documento) se documenta como reverse proxy a añadir en fase de hardening; no es indispensable en desarrollo local (Vite proxy basta).

## Modelo de datos (PostgreSQL vía Prisma)

- **Miembro**: id, nombre, documento_identidad (único), tipo_membresia, estado. 1→N Vehículos.
- **Vehiculo**: id, placa (única), marca, modelo, tipo, miembro_id (FK), estado. 1→N EventoAcceso.
- **ZonaParqueadero**: id, codigo, tipo, estado (libre/ocupada/fuera_de_servicio), vehiculo_actual_id (FK nullable). Estado también cacheado en Redis (`zona:{id}:estado`) como vista rápida en tiempo real; Postgres es la fuente de verdad.
- **EventoAcceso**: id, tipo (ingreso/salida), vehiculo_id (FK nullable), placa_detectada, confianza_ocr, zona_id (FK), resultado (autorizado/rechazado/alerta), foto_url, timestamp, operador_id (FK nullable).
- **Usuario**: id, nombre, email, password_hash, rol (admin/operador/consulta).

## API REST (prefijo `/api/v1`) + tiempo real

```
POST   /auth/login
GET/POST/PATCH/DELETE  /miembros, /vehiculos
GET/PATCH               /zonas               (lee estado desde Redis, fallback Postgres)
POST   /eventos-acceso/ingreso   (multipart: imagen) → orquesta vision-engine → decide → registra → emite WS
POST   /eventos-acceso/salida
GET    /eventos-acceso           (historial paginado, filtros)
```

Tiempo real: **Socket.io** (namespace `/monitoreo`), con Redis como backplane pub/sub (`zona.actualizada`, `evento.nuevo`, `alerta`). Elegido sobre SSE porque necesitamos reconexión robusta y rooms, y es el estándar en el ecosistema NestJS (`@nestjs/websockets`).

## Microservicio de visión (Python + FastAPI)

`POST /plate/recognize` (multipart imagen) → `{ plate_text, confidence, bbox, processing_ms }`.

Pipeline: preprocesamiento con OpenCV (escala de grises, filtro bilateral, CLAHE) → OCR con **EasyOCR** (recomendado sobre Tesseract: trae su propia detección de regiones de texto, maneja mejor ángulos/contraste no ideales, y devuelve confianza) → normalización del texto (mayúsculas, regex de formato de placa).

Limitación honesta a documentar: EasyOCR es un OCR genérico, no un ALPR entrenado específicamente — funcionará bien con fotos controladas mientras se prueba el flujo, pero no tendrá la robustez de un producto ALPR comercial ante placas sucias/mal iluminadas/en movimiento. Se documenta como mejora futura (ej. modelo YOLO+CRNN entrenado, o servicio ALPR especializado), sin bloquear esta fase.

## Frontend React

React Query (TanStack Query) para estado de servidor + cache; un hook `useRealtimeZonas()` en `realtime/` que escucha Socket.io y actualiza la cache de React Query directamente (sin refetch manual). Zustand solo si hace falta estado de UI compartido. Cliente REST tipado contra `@club-campina/shared-types`.

## Desarrollo local

- `docker-compose.yml` raíz: Postgres 16 + Redis 7.
- `servidor/api`: `npm install && npx prisma migrate dev && npm run start:dev` (puerto 3000).
- `servidor/vision-engine`: venv Python, `pip install -r requirements.txt`, `uvicorn app.main:app --reload --port 8000`.
- `app/web`: `npm install && npm run dev` (Vite puerto 5173, proxy a la API).
- README raíz documentando el orden de arranque: Postgres/Redis → vision-engine → api → web.

## Docker para despliegue

Cada servicio lleva su propio `Dockerfile`, y un segundo compose orquesta todo el stack (no solo las dependencias de dev):

- `servidor/api/Dockerfile`: build multi-stage Node (build de TypeScript → imagen final `node:20-slim` solo con `dist/` + `node_modules` de producción). Corre `prisma migrate deploy` como parte del entrypoint antes de `node dist/main.js`.
- `servidor/vision-engine/Dockerfile`: `python:3.11-slim` (o `-cuda` si el club llega a tener GPU disponible, ver niveles de hardware del documento), instala `requirements.txt`, expone el puerto de `uvicorn`. EasyOCR descarga modelos la primera vez — se puede pre-descargar en el build para evitar el retraso en el primer arranque.
- `app/web/Dockerfile`: build multi-stage — `npm run build` (Vite) en una etapa, y sirve el resultado estático con `nginx:alpine` en la etapa final. Esta es la misma imagen de Nginx que además puede actuar como reverse proxy hacia `api` (la "puerta de entrada" del documento), evitando desplegar un Nginx separado.
- `docker-compose.prod.yml` (o perfiles dentro del mismo compose): además de `postgres` y `redis`, añade los servicios `api`, `vision-engine` y `web`, todos en una red Docker interna; solo `web` (Nginx) expone puerto público, y este enruta `/api` hacia `api` y `/` hacia los estáticos de React — igual que describe el documento para la "puerta de entrada". Variables sensibles (`JWT_SECRET`, credenciales de Postgres) vía `.env` no versionado + `env_file` en compose.
- Healthchecks en compose (`api` y `vision-engine`) para que Nginx/orquestador no enrute tráfico a un servicio aún no listo, y `depends_on` con `condition: service_healthy`.
- Este mismo `docker-compose.prod.yml` es el punto de partida si más adelante se despliega en un servidor propio del club (el documento menciona un "servidor local con GPU dedicada") — no requiere Kubernetes ni orquestadores adicionales para el volumen esperado.

## Orden de implementación (fases verificables)

1. **Andamiaje**: git init, estructura de carpetas, docker-compose, mover docx/logo a `docs/`/`assets/`. *Verificar: `docker compose up -d` levanta sin errores.*
2. **Backend base**: NestJS + Prisma + Postgres, CRUD de Miembros/Vehículos. *Verificar: crear miembro+vehículo vía REST client.*
3. **Zonas + tiempo real (sin visión aún)**: CRUD zonas, Redis, Gateway WS emitiendo `zona.actualizada` en un PATCH de prueba. *Verificar: cliente WS recibe el evento.*
4. **Motor de visión aislado** (puede ir en paralelo a 2-3): FastAPI + OpenCV + EasyOCR. *Verificar: `curl` con una foto real de placa devuelve texto plausible + confianza, sin depender de NestJS.*
5. **Orquestación del flujo de negocio** (el corazón del proyecto): `vision-client`, lógica de `eventos-acceso` (comparar placa, asignar/liberar zona, guardar foto, publicar WS). *Verificar: subir foto de una placa registrada produce evento "autorizado", ocupa zona, se ve en vivo por WS.*
6. **Auth mínima**: Usuario, JWT, guard de roles. *Verificar: mutaciones sin token → 401.*
7. **Frontend — lectura y tiempo real**: scaffold Vite/React, paquete `shared`, Dashboard + ZonasMapaPage conectadas a API+WS. *Verificar: dos pestañas reflejan un evento disparado por Postman sin refrescar.*
8. **Frontend — flujo completo + CRUDs**: IngresoSimuladoPage (subida real), historial, Miembros, Vehículos. *Verificar: flujo completo desde la UI sin usar Postman.*
9. **Dockerización**: Dockerfile por servicio (`api`, `vision-engine`, `web`), `docker-compose.prod.yml` con red interna y Nginx (imagen de `web`) como único punto expuesto, healthchecks. *Verificar: `docker compose -f docker-compose.prod.yml up --build` levanta el stack completo y el flujo end-to-end funciona igual que en desarrollo.*
10. **Pulido**: manejo de errores consistente, paginación, README con diagrama y puntos de extensión.

## Fuera de alcance ahora (con gancho de extensión documentado)

| Excluido | Punto de extensión futuro |
|---|---|
| Auth compleja (SSO/MFA) | `AuthService` aislado, reemplazable sin tocar guards/controladores |
| Reconocimiento facial | Nuevo microservicio hermano de `vision-engine` + nuevo `vision-client` análogo |
| Hardware real (cámaras/barreras) | `eventos-acceso` trata la apertura como evento lógico; un futuro `barrera-driver` escucharía el mismo pub/sub de Redis |
| App móvil / push | `app/` ya separado de `servidor/`, lógica en `features/`, tipos en `shared/` — una futura `app/movil` reutiliza el cliente API tipado |

## Verificación final end-to-end

Con las 4 piezas corriendo (Postgres, Redis, vision-engine, api, web): registrar un miembro y su vehículo desde la UI → subir una foto real de esa placa en "Ingreso simulado" → confirmar que el motor de visión la lee, el evento aparece como "autorizado", una zona pasa a ocupada en el mapa en vivo (sin refrescar), y el evento queda en el historial con la foto.
