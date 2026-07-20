# Evaluación del modelo de datos (julio 2026)

Revisión de `servidor/api/prisma/schema.prisma` y `servidor/shared/src/index.ts`
frente a: (a) el módulo de Parqueadero y Control de Acceso, (b) la app móvil de
socios, y (c) lo aprendido de la plataforma actual (miclubapp).

## Veredicto

**Sí — el modelo es correcto para la fase actual.** Está bien normalizado y las
decisiones importantes son acertadas:

- `Miembro 1→N Vehiculo` con `placa` única; los formatos de placa (Colombia
  `ABC123` y Ecuador `ABC1234`) ya están soportados en los DTOs.
- `Vehiculo` pertenece a un socio **o** a un `Visitante` temporal (los dos FKs
  nullable) — modela bien el caso real de garita.
- `ZonaParqueadero.vehiculoActualId` es `@unique` → un vehículo no puede ocupar
  dos plazas a la vez; consistencia garantizada por la base.
- `EventoAcceso` es una bitácora inmutable con índices en `timestamp` y
  `placaDetectada` (las dos consultas reales), y sus FKs usan `SetNull` para que
  el histórico sobreviva si se borra un vehículo/zona/usuario. Correcto.
- Redis como caché de estado + Postgres como fuente de verdad: bien.

Lo que sigue no son errores sino **huecos previsibles** para las siguientes
fases. En orden de cuándo van a doler:

## 1. Croquis ↔ zonas (necesario al conectar el croquis)

`ZonaParqueadero` no sabe dónde está la plaza físicamente. **Resuelto por
convención, sin migración**: la geometría vive en la app
(`app/movil/src/data/croquis.ts`) y la llave de unión es `codigo` con el formato
`{banda}-{nn}` (`A-01`, `F-12`, `M-03`…). Al sembrar las zonas reales, crearlas
con esos códigos. Opcional (nice-to-have): columnas `bloque` y `banda` para
reportes por sector ("ocupación del bloque trasero").

## 2. Identidad del socio en la app (la próxima migración real)

Hoy `Usuario` es solo personal operativo (ADMIN/OPERADOR/CONSULTA) y `Miembro`
no tiene credenciales ni los atributos que la app necesita. Falta:

- **Cuenta de socio**: login propio (o `CuentaSocio` 1↔1 con `Miembro`).
- `numeroDerecho` (el "Nº de Derecho" que ya usa el club en miclubapp).
- `invitadosPermitidos Int @default(5)` — la regla de negocio de invitados.
- **Enrolamiento facial**: `fotoFacialUrl`, `facialEnroladoEn DateTime?` y
  `consentimientoBiometrico DateTime?`. El dato biométrico es **sensible** bajo
  la LOPDP de Ecuador: el consentimiento explícito debe quedar registrado, con
  fecha, junto al dato.
- **Grupo familiar**: titular ↔ dependientes con `parentesco` (así lo modela
  miclubapp) — necesario porque el derecho y los cupos son por familia.

## 3. Invitación con QR (la función estrella de la app)

No existe entidad para la invitación del socio. `Visitante` se solapa pero no
alcanza (no tiene socio anfitrión, ni vigencia por fecha, ni QR, ni estado).
Propuesta:

```
Invitacion { id, socioId→Miembro, nombre, documento, placa?, llegaEn (VEHICULO|PIE),
             validaDesde, validaHasta, qrToken @unique, area?,
             estado (PENDIENTE|DENTRO|FINALIZADO|CANCELADA), creadaEn }
```

`Visitante` evoluciona a "autorización temporal de garita": cuando el invitado
llega (QR o placa), la Invitación genera/actualiza esa autorización. Así el
flujo del operador (hoy) y el del socio (app) convergen sin duplicar lógica.

## 4. Acceso peatonal / facial (cuando entre el reconocimiento facial)

`EventoAcceso` es 100 % vehicular (`placaDetectada` obligatoria). El docx exige
también flujo peatonal (garita, gym, piscina, sala de juegos). Cambios mínimos
llegado el momento: `tipoAcceso (VEHICULAR|PEATONAL)`, `miembroId?`,
`puntoAcceso (GARITA|GYM|PISCINA|SALA_JUEGOS)` y hacer `placaDetectada`
opcional (o una tabla hermana `EventoAccesoPeatonal`).

## 5. Estado RESERVADA (solo si se aprueba la reserva de plazas)

`EstadoZona` = LIBRE/OCUPADA/FUERA_DE_SERVICIO — **correcto hoy**. La app
muestra RESERVADA como estado provisional de demo. Si la directiva aprueba la
reserva de plazas: añadir `RESERVADA` al enum + entidad
`ReservaPlaza { zonaId, miembroId, desde, hasta, estado }`.

## 6. Reservas de canchas/espacios (dominio aparte)

Lo que hoy vive en miclubapp (Tenis, Fútbol, Piscina…, con horarios y cupos) es
un dominio nuevo (`Espacio`, `Horario`, `Reserva`) — no meterlo en el modelo del
parqueadero; conviene módulo NestJS propio cuando se migre.

## 7. Menores

- `Vehiculo.color` — el dato que garita usa para confirmar visualmente.
- `Visitante.documento` no es `@unique` (correcto — puede volver otro día),
  pero conviene índice para búsqueda.
- `Miembro.estado SUSPENDIDO` ya existe y el flujo de ingreso lo respeta — ✔.
