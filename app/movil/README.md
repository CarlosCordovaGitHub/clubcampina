# App móvil de socios — La Campiña Country Club

App **100% móvil** para los socios del club (Expo / React Native + TypeScript),
pensada para reemplazar poco a poco la plataforma rentada
([miclubapp](../../docs/Hallazgos_Plataforma_Actual_miclubapp.md)) con una app
**propia**, con la identidad visual del club y funciones nuevas — sobre todo el
**control certero de invitados** y el **acceso inteligente** (placa/rostro) que
alimenta el módulo de Parqueadero y Control de Acceso de `servidor/`.

> Objetivo estratégico: dar más beneficios al socio para incentivar el uso de la
> app y, con ello, **recolectar su foto facial** para habilitar el acceso sin
> filas al club y sus áreas (gym, piscina, sala de juegos).

## Stack

- **Expo SDK 57** (React Native 0.86 / React 19) + **expo-router** + TypeScript.
- Corre en Android, iOS y **web** (para verificación rápida con capturas).
- Para probarla en un teléfono: ver **[docs/Probar_en_telefono.md](docs/Probar_en_telefono.md)**.
- `react-native-svg` (croquis del parqueadero), `react-native-qrcode-svg` (pase
  de invitado), `expo-linear-gradient`, `@expo/vector-icons`.
- Reutiliza el patrón del **cliente API tipado** de `app/web/src/api/client.ts` y
  los contratos de `@club-campina/shared-types` (solo cambia `BASE_URL`).

## Cómo correr

```bash
cd app/movil
npm install
npm run web        # abre en el navegador (verificación)
npm run start      # Expo Dev — escanear QR con Expo Go en el celular
```

Export estático de la web (lo que se usa para las capturas):

```bash
npm run export:web   # genera dist/
```

## Estructura

```
app/                       rutas (expo-router)
  _layout.tsx              stack raíz + tema
  index.tsx                Login / onboarding del socio
  (tabs)/                  navegación principal por pestañas
    index.tsx              INICIO: parqueadero en vivo, accesos rápidos,
                           próxima reserva, invitados de hoy, noticias
    reservas.tsx           canchas/espacios + horarios + eventos con cupos
    invitados.tsx          cupos de invitados + accesos con QR
    parqueadero.tsx        croquis en vivo (SVG) por bloques
    perfil.tsx             datos del socio, enrolamiento facial, vehículos
  noticias.tsx             feed de comunicados por secciones
  invitado-nuevo.tsx       crear invitación → genera pase QR
src/
  theme.ts                 paleta y tokens de la marca
  components/              UI (Card, Badge, Button…), Header, CroquisClub
  data/croquis.ts          ★ plano del parqueadero (bandas, plazas, geometría)
  data/live.ts             ★ estado EN VIVO compartido (simulación hoy; aquí se
                           enchufa el WebSocket real) + mini-stores de sesión
  data/mock.ts             datos de ejemplo estáticos (socio, noticias, reservas…)
assets/logo.png            logo oficial del club
docs/capturas/             capturas de referencia de cada pantalla
```

## El croquis del parqueadero

`CroquisClub` dibuja un mapa SVG **fiel a la vista aérea del club**
(`parqueaderos.jpg`): bandas traseras A–E en espina de pescado junto a las
canchas de tenis, columna V y banda G junto a la vía central, bloque frontal
(fila F de Casa Club, costado L, motos M en garita), Av. Galo Plaza Lasso,
garita única de entrada/salida, canchas de fútbol, arena, coliseo y bohíos.

- **Todo el plano es configuración**: `src/data/croquis.ts` define cada banda
  con su `count` de plazas por fila. ⚠ Las cantidades reales están **por
  confirmar** con el club — cuando se confirmen, basta editar los `count` y los
  códigos (`A-01`…) se regeneran solos.
- **Interacción** (sin dependencias extra): pellizcar = zoom 1×–3×, arrastrar =
  mover, doble toque = acercar/restablecer, tocar una plaza = detalle (el
  hit-testing es propio, con radio táctil generoso). Chips para saltar a
  Trasero/Frontal y filtro "Solo libres". Con zoom ≥ 1.55 aparecen los códigos.
- **En vivo (simulado)**: cada ~5 s una plaza cambia LIBRE↔OCUPADA con un pulso
  dorado. **Integración real**: cargar estados con `GET /api/v1/zonas` y
  actualizarlos con el WebSocket `/monitoreo` (evento `zona.actualizada`),
  usando `ZonaParqueadero.codigo` ↔ `Plaza.codigo` como llave (ver
  `docs/Modelo_de_datos_evaluacion.md` en la raíz del repo).

## Estado (fase 1) — qué es real y qué es mock

Esta fase es un **prototipo navegable y con la UI final**; la lógica usa datos de
ejemplo (`src/data/mock.ts`). Próximos pasos de integración:

| Pantalla | Hoy | Integración siguiente |
|---|---|---|
| Parqueadero en vivo | croquis fiel e interactivo con simulación en vivo | `GET /api/v1/zonas` + WS `/monitoreo` (llave: `codigo` de plaza) |
| Invitados / pase QR | QR local con vínculo socio↔placa | endpoint de invitados (crea autorización temporal + placa) |
| Reservas | canchas y horarios mock | API de reservas (hoy en miclubapp) o nueva API propia |
| Noticias / Eventos | feed mock con sedes reales | API de noticias/eventos |
| Perfil / facial | captura simulada | microservicio de reconocimiento facial (hueco ya previsto) |
| Login | navegación directa | `/auth/login` propio del club |

## Diseño

Paleta tomada del logo (ver `src/theme.ts`): azul marino `#004878`, dorado
`#D8A848`, celeste `#0078C0`. Encabezados con degradado azul y detalle dorado,
tarjetas redondeadas y tipografía marcada. Las capturas de cada pantalla están en
`docs/capturas/`.
