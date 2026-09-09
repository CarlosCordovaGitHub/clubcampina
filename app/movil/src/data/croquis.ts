// ─────────────────────────────────────────────────────────────────────────────
// CROQUIS DEL PARQUEADERO — plano vertical "desde la garita" (norte = arriba,
// Av. Galo Plaza Lasso al sur), fiel a la vista aérea de Club Campiña
// (parqueaderos.jpg + tomas cercanas):
//   · Vía central que baja desde el norte y curva al este hacia la Casa Club.
//   · Bloque TRASERO al oeste de la vía: 3 bandas largas en espina de pescado
//     (A–C) junto a la hilera de canchas de tenis/pádel, 2 bandas cortas (D–E)
//     más abajo, columna perpendicular (V) pegada a la vía y banda grande (G)
//     al este de la vía.
//   · Bloque FRONTAL alrededor de la Casa Club: explanada F, playón de doble
//     hilera K/L al costado oeste, bahías P del lazo de acceso, motos M en la
//     garita (única entrada/salida, sobre la Av.).
//
// ⚠ CANTIDADES POR CONFIRMAR con el club: para ajustar una banda basta cambiar
//   su `count` (plazas por fila) aquí. Los códigos (A-01, F-05…) se regeneran
//   solos y son la LLAVE de integración con el backend cuando exista:
//   ZonaParqueadero.codigo ↔ Plaza.codigo (WS zona.actualizada → estado).
// ─────────────────────────────────────────────────────────────────────────────

export const VIEWBOX = { w: 1000, h: 1460 };

export type BloquePlaza = 'TRASERO' | 'FRONTAL';
export type TipoPlaza = 'GENERAL' | 'DISCAPACITADOS' | 'MOTOS';
// Superset del enum del backend (EstadoZona): RESERVADA es provisional, solo
// existe en la app mientras el producto "reserva de plazas" se aprueba.
export type EstadoPlaza = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'FUERA_DE_SERVICIO';

export interface Plaza {
  codigo: string; // p. ej. "A-07" — llave única (futura ZonaParqueadero.codigo)
  banda: string;
  bloque: BloquePlaza;
  tipo: TipoPlaza;
  /** centro de la plaza en coordenadas del viewBox */
  x: number;
  y: number;
  /** rotación en grados (espina de pescado ±26°; 90 = plaza horizontal) */
  ang: number;
  w: number;
  h: number;
}

type FilaDef = {
  y: number;
  ang: number;
  /** desplazamiento vertical por columna: hace que la fila "baje" en diagonal
   *  como las bandas reales de la foto aérea (no perfectamente horizontales) */
  dyPerCol?: number;
};

type BandaDef = {
  id: string;
  bloque: BloquePlaza;
  etiqueta: string;
  /** bandas horizontales: filas de plazas a lo largo de X */
  filas?: FilaDef[];
  x0?: number;
  pitch?: number;
  /** bandas verticales (columnas junto a una vía): plazas apiladas en Y */
  vertical?: { x: number; y0: number; pitch: number };
  count: number; // plazas por fila (o por columna)
  tipo?: TipoPlaza;
  stall?: { w: number; h: number };
};

const STALL = { w: 18, h: 44 }; // tamaño estándar de plaza en unidades de viewBox

// ── Definición de bandas (AJUSTAR `count` CUANDO EL CLUB CONFIRME CANTIDADES) ──
// El parqueadero PRINCIPAL es un lote compacto en el centro-norte, al ESTE del
// gran complejo de canchas de tenis (que ocupa el costado noroeste). Tiene el
// cuerpo denso en espina de pescado (A–D), la columna perpendicular pegada a la
// vía (V) y el playón abierto más al este (G). El bloque FRONTAL rodea la Casa
// Club, al sur, junto a la Av. Galo Plaza Lasso.
const BANDAS: BandaDef[] = [
  // ── PARQUEADERO PRINCIPAL (centro-norte, al este del tenis) ─────────────────
  // Bandas rectas y horizontales (la espina de pescado ±26° es solo la
  // inclinación de cada plaza dentro de la fila).
  { id: 'A', bloque: 'TRASERO', etiqueta: 'Principal · banda A', x0: 250, pitch: 24, count: 13, filas: [{ y: 178, ang: -26 }, { y: 222, ang: 26 }] },
  { id: 'B', bloque: 'TRASERO', etiqueta: 'Principal · banda B', x0: 250, pitch: 24, count: 13, filas: [{ y: 302, ang: -26 }, { y: 346, ang: 26 }] },
  { id: 'C', bloque: 'TRASERO', etiqueta: 'Principal · banda C', x0: 250, pitch: 24, count: 13, filas: [{ y: 426, ang: -26 }, { y: 470, ang: 26 }] },
  // Banda inferior, algo más corta
  { id: 'D', bloque: 'TRASERO', etiqueta: 'Principal · banda D', x0: 276, pitch: 24, count: 11, filas: [{ y: 550, ang: -26 }, { y: 594, ang: 26 }] },
  // Columna perpendicular pegada a la vía central (borde este del lote)
  { id: 'V', bloque: 'TRASERO', etiqueta: 'Principal · junto a la vía', vertical: { x: 596, y0: 196, pitch: 27 }, count: 12 },
  // Playón abierto al este del lote (menos denso, se ve más despejado en la foto)
  { id: 'G', bloque: 'TRASERO', etiqueta: 'Principal · playón este', x0: 486, pitch: 26, count: 11, filas: [{ y: 712, ang: -24 }, { y: 756, ang: 24 }] },

  // ── BLOQUE FRONTAL (entrada de la Casa Club) ──────────────────────────────
  // Solo 8 plazas junto a la entrada (no hay parqueadero al costado oeste ni
  // motos). Dos filas de 4, bien separadas de la garita.
  { id: 'F', bloque: 'FRONTAL', etiqueta: 'Frontal · entrada Casa Club', x0: 690, pitch: 42, count: 4, filas: [{ y: 1146, ang: -16 }, { y: 1216, ang: 16 }] },
];

// Plazas con tipo especial (independiente de su banda)
const TIPO_OVERRIDE: Record<string, TipoPlaza> = {
  'F-01': 'DISCAPACITADOS', // las más cercanas a la entrada de la Casa Club
  'F-02': 'DISCAPACITADOS',
};

function construirPlazas(): Plaza[] {
  const plazas: Plaza[] = [];
  for (const b of BANDAS) {
    const stall = b.stall ?? STALL;
    let n = 1;
    if (b.vertical) {
      for (let i = 0; i < b.count; i++) {
        const codigo = `${b.id}-${String(n++).padStart(2, '0')}`;
        plazas.push({
          codigo, banda: b.id, bloque: b.bloque,
          tipo: TIPO_OVERRIDE[codigo] ?? b.tipo ?? 'GENERAL',
          x: b.vertical.x, y: b.vertical.y0 + i * b.vertical.pitch,
          ang: 90, w: stall.w, h: stall.h,
        });
      }
    } else {
      for (const fila of b.filas!) {
        for (let i = 0; i < b.count; i++) {
          const codigo = `${b.id}-${String(n++).padStart(2, '0')}`;
          plazas.push({
            codigo, banda: b.id, bloque: b.bloque,
            tipo: TIPO_OVERRIDE[codigo] ?? b.tipo ?? 'GENERAL',
            x: b.x0! + i * b.pitch!, y: fila.y + i * (fila.dyPerCol ?? 0),
            ang: fila.ang, w: stall.w, h: stall.h,
          });
        }
      }
    }
  }
  return plazas;
}

export const PLAZAS: Plaza[] = construirPlazas();

export const ETIQUETA_BANDA: Record<string, string> = Object.fromEntries(
  BANDAS.map((b) => [b.id, b.etiqueta]),
);

// ── Estado inicial simulado (determinista, para demo sin backend) ────────────
// Cuando el sistema de garita esté operativo, esto se reemplaza por
// GET /api/v1/zonas + WebSocket /monitoreo (evento zona.actualizada).

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FUERA_DE_SERVICIO_FIJAS = ['C-19', 'C-20', 'D-08']; // mantenimiento (demo)

export function estadoInicial(seed = 20260720): Record<string, EstadoPlaza> {
  const rnd = mulberry32(seed);
  const estados: Record<string, EstadoPlaza> = {};
  for (const p of PLAZAS) {
    if (FUERA_DE_SERVICIO_FIJAS.includes(p.codigo)) {
      estados[p.codigo] = 'FUERA_DE_SERVICIO';
      continue;
    }
    const pOcupada = p.tipo === 'MOTOS' ? 0.3 : p.bloque === 'TRASERO' ? 0.58 : 0.45;
    const r = rnd();
    estados[p.codigo] =
      r < pOcupada ? 'OCUPADA' : r < pOcupada + 0.07 ? 'RESERVADA' : 'LIBRE';
  }
  return estados;
}

export function resumen(estados: Record<string, EstadoPlaza>) {
  const total = PLAZAS.length;
  let libres = 0, ocupadas = 0, reservadas = 0, fueraServicio = 0;
  for (const p of PLAZAS) {
    switch (estados[p.codigo]) {
      case 'LIBRE': libres++; break;
      case 'OCUPADA': ocupadas++; break;
      case 'RESERVADA': reservadas++; break;
      case 'FUERA_DE_SERVICIO': fueraServicio++; break;
    }
  }
  return { total, libres, ocupadas, reservadas, fueraServicio };
}
