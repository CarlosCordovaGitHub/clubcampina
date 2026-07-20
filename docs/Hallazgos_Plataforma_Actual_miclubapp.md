# Hallazgos — plataforma actual del club (miclubapp)

Documento de referencia de lo que hoy usa el club, para decidir qué mantener y
qué mejorar en la app propia. Basado en una revisión (solo lectura) del panel de
administración con las credenciales del club.

- **Panel**: `https://www.miclubapp.com/plataform/` (login con reCAPTCHA v3).
- Es un **white-label "Mi Club Plataform"** con **~109 módulos** y una plantilla
  de administración genérica (ACE/Bootstrap, color teal). **No tiene identidad
  visual de La Campiña** — esa es una de las razones para tener app propia.
- El club es **La Campiña Country Club** (Ecuador): golf, tenis, piscinas,
  pesebrera (equinos), etc.

## Módulos que los socios usan hoy (a conservar en la app propia)

| Módulo | En el panel | Datos clave observados |
|---|---|---|
| **Reservas** por espacio | `reservas.php?ids=` | Tenis, Fútbol, Piscina, Squash, Vóley, Yoga, Básquet, Gimnasio. Campos: Fecha, Hora, Tipo Reserva, Socio, Cumplida, Observaciones |
| **Noticias** | `noticias.php` | Secciones **INSTITUCIONAL / Generales / Convenios CLC**; Titular, Publicar, Orden, Me gusta, comentarios |
| **Eventos** | `eventos.php` | #Permitidos / #Registrados (cupos), Fecha evento, Sección |
| **Notificaciones** push | `notificaciones.php` | Título, Mensaje, Enviados, Leído |
| **Invitados** | `invitadosespeciales.php` | **Documento, Nombre, Tipo, Predio, Fecha Desde/Hasta, Socio, Placa, Generar QR**, carga masiva. Reglas, listado de bloqueados |
| **Ingreso/Salida vehículos** | `reporteingresosalidavehiculos.php` | Placa, Tipo, Movimiento, Fecha/Hora, Usuario Portería |

### Modelo de socio (formulario admin)

Campos relevantes para nuestro sistema: Tipo Socio, Nº de Derecho, Usuario/Clave
de app, **Nº Invitados permitidos**, **Foto del socio**, **Push Ingreso
Invitado**, Parentesco, Estado, Ciudad, Email.

## Por qué esto importa

1. El módulo de **Invitados ya modela `Placa` + `Parqueadero` + `QR`**: nuestro
   sistema de Parqueadero y Control de Acceso encaja de forma natural encima —
   el control certero de invitados que pide el brief ya está semi-modelado.
2. Ya existe un **reporte de ingreso/salida de vehículos con placa**: valida que
   el club piensa en términos de placas y porterías, justo lo que automatiza
   nuestro ALPR.
3. El socio ya tiene **foto y nº de invitados permitidos**: la app propia puede
   reutilizar esos conceptos para el enrolamiento facial y el control de cupos
   (máx. 5 salvo fútbol, según el brief).

## Otros módulos existentes (fuera de la fase 1, referencia)

Billetera digital, domicilios/restaurantes, cuotas sociales, facturación + SRI,
pagos (múltiples pasarelas), pesebrera, caddies/golf, hotel/casa-hotel, valet
parking, carros compartidos, PQRs, encuestas, cursos, clasificados, beneficios,
directorio, objetos perdidos, votaciones, y un largo etcétera. La app propia
puede ir absorbiéndolos por fases según prioridad del club.
