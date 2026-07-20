// ─────────────────────────────────────────────────────────────────────────────
// CROQUIS DEL PARQUEADERO — configuración fiel a la vista aérea del club
// (parqueaderos.jpg): vía central vertical, bandas en espina de pescado en el
// bloque TRASERO (junto a canchas de tenis), banda media a la derecha de la vía,
// y bloque FRONTAL junto a la Casa Club con el lazo de acceso desde la
// Av. Galo Plaza Lasso (garita = única entrada/salida).
//
// ⚠ CANTIDADES POR CONFIRMAR con el club: para ajustar una banda basta cambiar
//   su `count` (plazas por fila) aquí. Los códigos (A-01, F-05…) se regeneran
//   solos y son la LLAVE de integración con el backend cuando exista:
//   ZonaParqueadero.codigo ↔ Plaza.codigo (WS zona.actualizada → estado).
// ─────────────────────────────────────────────────────────────────────────────

export const VIEWBOX = { w: 1000, h: 1400 };

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

type FilaDef = { y: number; ang: number };

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
const BANDAS: BandaDef[] = [
  // Bloque trasero: 3 bandas largas arriba (junto a la cancha de tenis noroeste)
  { id: 'A', bloque: 'TRASERO', etiqueta: 'Trasero · banda A', x0: 78, pitch: 25, count: 14, filas: [{ y: 158, ang: -26 }, { y: 206, ang: 26 }] },
  { id: 'B', bloque: 'TRASERO', etiqueta: 'Trasero · banda B', x0: 78, pitch: 25, count: 14, filas: [{ y: 292, ang: -26 }, { y: 340, ang: 26 }] },
  { id: 'C', bloque: 'TRASERO', etiqueta: 'Trasero · banda C', x0: 78, pitch: 25, count: 14, filas: [{ y: 426, ang: -26 }, { y: 474, ang: 26 }] },
  // 2 bandas cortas abajo (junto a las canchas de tenis suroeste)
  { id: 'D', bloque: 'TRASERO', etiqueta: 'Trasero · banda D', x0: 208, pitch: 25, count: 9, filas: [{ y: 560, ang: -26 }, { y: 608, ang: 26 }] },
  { id: 'E', bloque: 'TRASERO', etiqueta: 'Trasero · banda E', x0: 208, pitch: 25, count: 9, filas: [{ y: 694, ang: -26 }, { y: 742, ang: 26 }] },
  // Columna pegada a la vía central (lado este)
  { id: 'V', bloque: 'TRASERO', etiqueta: 'Trasero · junto a la vía', vertical: { x: 527, y0: 262, pitch: 27 }, count: 6 },
  // Banda media al este de la vía (la que se ve al centro-derecha en la foto)
  { id: 'G', bloque: 'TRASERO', etiqueta: 'Trasero · banda G', x0: 548, pitch: 25, count: 12, filas: [{ y: 592, ang: -26 }, { y: 640, ang: 26 }] },

  // Bloque frontal (Casa Club)
  { id: 'F', bloque: 'FRONTAL', etiqueta: 'Frontal · Casa Club', x0: 592, pitch: 25, count: 12, filas: [{ y: 1108, ang: -26 }] },
  { id: 'L', bloque: 'FRONTAL', etiqueta: 'Frontal · costado oeste', vertical: { x: 495, y0: 900, pitch: 27 }, count: 6 },
  { id: 'M', bloque: 'FRONTAL', etiqueta: 'Frontal · motos (garita)', x0: 700, pitch: 15, count: 6, filas: [{ y: 1204, ang: 0 }], stall: { w: 9, h: 22 }, tipo: 'MOTOS' },
];

// Plazas con tipo especial (independiente de su banda)
const TIPO_OVERRIDE: Record<string, TipoPlaza> = {
  'F-11': 'DISCAPACITADOS', // las más cercanas a la garita / entrada de Casa Club
  'F-12': 'DISCAPACITADOS',
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
            x: b.x0! + i * b.pitch!, y: fila.y,
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

const FUERA_DE_SERVICIO_FIJAS = ['C-21', 'C-22', 'L-03']; // mantenimiento (demo)

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
