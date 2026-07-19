# Club Campiña — Módulo de Parqueadero y Control de Acceso

Sistema que reconoce automáticamente las placas de los vehículos que ingresan y
salen del club (ALPR sobre imágenes subidas) y mantiene en tiempo real el estado
de cada zona del parqueadero. Implementa la arquitectura descrita en
[docs/Modulo_Parqueadero_y_Control_de_Acceso.docx](docs/Modulo_Parqueadero_y_Control_de_Acceso.docx):
un **motor de visión** (Python) separado del **motor principal** (NestJS), de
modo que un pico de reconocimiento nunca afecte la lógica de negocio.

## Arquitectura

```
                        ┌──────────────────────────┐
   navegador ──────────►│  web (React + Vite)      │
                        │  · en prod: Nginx =      │
                        │    puerta de entrada     │
                        └───────────┬──────────────┘
                          /api  /uploads  /socket.io
                                    │
                        ┌───────────▼──────────────┐   HTTP interno   ┌────────────────────┐
                        │  api (NestJS)            │─────────────────►│ vision-engine      │
                        │  · auth JWT + roles      │  POST /plate/    │ (FastAPI)          │
                        │  · miembros / vehículos  │      recognize   │ · OpenCV preproc.  │
                        │  · zonas / eventos       │                  │ · EasyOCR          │
                        │  · gateway WS /monitoreo │                  └────────────────────┘
                        └─────┬──────────────┬─────┘
                              │              │ pub/sub + cache zona:{id}:estado
                    ┌─────────▼───┐   ┌──────▼──────┐
                    │ PostgreSQL  │   │   Redis     │
                    │ (fuente de  │   │ (tiempo     │
                    │  verdad)    │   │  real)      │
                    └─────────────┘   └─────────────┘
```

- **Flujo de un ingreso**: la foto llega a `POST /api/v1/eventos-acceso/ingreso` →
  la API pide el OCR al motor de visión → valida placa/socio/membresía → asigna
  una zona libre (motos van a zonas MOTOS) → guarda el evento y la foto →
  publica `zona.actualizada` / `evento.nuevo` / `alerta` en Redis → el gateway
  Socket.io los re-emite a todos los tableros conectados.
- **Redis** cachea el estado de cada zona (`zona:{id}:estado`) como vista rápida;
  Postgres es siempre la fuente de verdad. También es el backplane pub/sub, así
  la API puede escalar a varias réplicas sin perder el tiempo real.

## Estructura del monorepo

```
servidor/            npm workspaces (shared + api)
  api/               Motor principal — NestJS + Prisma
  vision-engine/     Motor de visión — Python/FastAPI (servicio independiente)
  shared/            @club-campina/shared-types: DTOs, enums, eventos WS
app/
  web/               React + TypeScript + Vite (lógica en features/, API tipada)
docs/  assets/       Documento de la propuesta y logo
```

## Desarrollo local

Orden de arranque: **Postgres/Redis → vision-engine → api → web**.

```bash
# 1. Dependencias de infraestructura
docker compose up -d

# 2. Motor de visión (Python 3.11+)
cd servidor/vision-engine
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# 3. API (en otra terminal; Node 20+)
cd servidor
npm install
npm run build --workspace @club-campina/shared-types
cd api
cp .env.example .env
npx prisma migrate dev        # migraciones
npx prisma db seed            # admin/operador + zonas de ejemplo
npm run start:dev             # puerto 3000

# 4. Web (en otra terminal)
cd app/web
npm install
npm run dev                   # puerto 5173, proxy a la API
```

Usuarios del seed: `admin@clubcampina.com` y `operador@clubcampina.com`
(contraseña `admin1234` — cambiarla con `SEED_ADMIN_PASSWORD` en producción).

**Prueba end-to-end**: registrar un miembro y su vehículo en la UI → en
"Ingreso / Salida" subir una foto donde se vea la placa → el evento sale
AUTORIZADO, la zona pasa a ocupada en el mapa sin refrescar y el evento queda en
el historial con la foto.

## API (prefijo `/api/v1`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Login de operadores → JWT |
| CRUD | `/miembros`, `/vehiculos` | Socios y sus vehículos (paginado, búsqueda) |
| GET/POST/PATCH/DELETE | `/zonas` | Zonas; estado leído de Redis con fallback a Postgres |
| POST | `/eventos-acceso/ingreso` | multipart `imagen` → OCR → decisión → zona → WS |
| POST | `/eventos-acceso/salida` | multipart `imagen` → libera la zona |
| GET | `/eventos-acceso` | Historial paginado con filtros |

Roles: `ADMIN` (todo), `OPERADOR` (operación diaria), `CONSULTA` (solo lectura).
Tiempo real: Socket.io en el namespace `/monitoreo`
(eventos `zona.actualizada`, `evento.nuevo`, `alerta`).

## Despliegue con Docker

```bash
cp .env.prod.example .env     # y cambiar credenciales/JWT_SECRET
docker compose -f docker-compose.prod.yml up --build -d
```

Solo Nginx (servicio `web`) expone puerto; enruta `/` a los estáticos de React y
`/api`, `/uploads`, `/socket.io` hacia la API por la red interna. Healthchecks +
`depends_on: service_healthy` garantizan el orden de arranque. La imagen del
motor de visión pre-descarga los modelos de EasyOCR en el build. Este compose es
el punto de partida para el "servidor local con GPU dedicada" que menciona el
documento (bastaría cambiar la base de `vision-engine` por una imagen CUDA).

## Limitaciones conocidas y puntos de extensión

- **OCR genérico**: EasyOCR no es un ALPR entrenado; rinde bien con fotos
  razonablemente controladas. Mejora futura: modelo dedicado (YOLO+CRNN) o
  servicio ALPR comercial — solo habría que reemplazar
  `vision-engine/app/services/ocr_engine.py` (o el servicio completo, el
  contrato HTTP `POST /plate/recognize` es la frontera).
- **Reconocimiento facial**: entraría como microservicio hermano de
  `vision-engine`, con su propio cliente análogo a `vision-client/` en la API.
- **Hardware real (cámaras/barreras)**: la apertura es hoy un evento lógico; un
  futuro `barrera-driver` escucharía el mismo pub/sub de Redis.
- **App móvil**: `app/` ya está separado del backend; reutilizaría
  `@club-campina/shared-types`, el cliente API tipado y los hooks de `features/`.
- **Auth compleja (SSO/MFA)**: `AuthService` está aislado; se reemplaza sin
  tocar guards ni controladores.
