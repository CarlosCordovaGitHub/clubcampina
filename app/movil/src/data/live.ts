// ─────────────────────────────────────────────────────────────────────────────
// Estado EN VIVO compartido entre pantallas (Inicio y Parqueadero ven lo mismo).
//
// Hoy lo alimenta una simulación local (una plaza cambia LIBRE↔OCUPADA cada
// ~5 s). Cuando el sistema de garita exista, este módulo es el único punto a
// tocar: reemplazar `tickSimulacion` por el WebSocket /monitoreo
// (evento zona.actualizada → aplicarCambio(codigo, estado)).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useReducer } from 'react';
import { EstadoPlaza, PLAZAS, estadoInicial } from './croquis';
import { socio } from './mock';

// ── Mini-store genérico (suficiente para la fase 1; sin dependencias) ────────

type Listener = () => void;

export function crearStore<T>(inicial: T) {
  let valor = inicial;
  const listeners = new Set<Listener>();
  const get = () => valor;
  const set = (v: T | ((prev: T) => T)) => {
    valor = typeof v === 'function' ? (v as (prev: T) => T)(valor) : v;
    listeners.forEach((l) => l());
  };
  const subscribe = (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  function useStore(): T {
    const [, forzar] = useReducer((x: number) => x + 1, 0);
    useEffect(() => subscribe(forzar), []);
    return get();
  }
  return { get, set, subscribe, useStore };
}

// ── Parqueadero en vivo ──────────────────────────────────────────────────────

export type ParqueaderoVivo = {
  estados: Record<string, EstadoPlaza>;
  /** plaza que acaba de cambiar (para el anillo de pulso) */
  pulso: string | null;
  /** timestamp del último cambio (el ticker "hace Xs" deriva de aquí) */
  ultimoCambio: number;
};

const parqueaderoStore = crearStore<ParqueaderoVivo>({
  estados: estadoInicial(),
  pulso: null,
  ultimoCambio: Date.now(),
});

let simTimer: ReturnType<typeof setInterval> | null = null;
let pulsoTimer: ReturnType<typeof setTimeout> | null = null;
let suscriptores = 0;

function tickSimulacion() {
  const { estados } = parqueaderoStore.get();
  const candidatas = PLAZAS.filter((p) => {
    const e = estados[p.codigo];
    return e === 'LIBRE' || e === 'OCUPADA';
  });
  if (candidatas.length === 0) return;
  const p = candidatas[Math.floor(Math.random() * candidatas.length)];
  const nuevo: EstadoPlaza = estados[p.codigo] === 'LIBRE' ? 'OCUPADA' : 'LIBRE';
  parqueaderoStore.set((prev) => ({
    estados: { ...prev.estados, [p.codigo]: nuevo },
    pulso: p.codigo,
    ultimoCambio: Date.now(),
  }));
  if (pulsoTimer) clearTimeout(pulsoTimer);
  pulsoTimer = setTimeout(() => {
    parqueaderoStore.set((prev) => ({ ...prev, pulso: null }));
    pulsoTimer = null;
  }, 1600);
}

/** La simulación corre solo mientras alguna pantalla la está mirando. */
function conectarSimulacion(): () => void {
  suscriptores++;
  if (!simTimer) simTimer = setInterval(tickSimulacion, 5000);
  return () => {
    suscriptores--;
    if (suscriptores <= 0) {
      if (simTimer) {
        clearInterval(simTimer);
        simTimer = null;
      }
      if (pulsoTimer) {
        clearTimeout(pulsoTimer);
        pulsoTimer = null;
      }
    }
  };
}

/** Hook: estado del parqueadero en vivo (y activa la simulación mientras se usa). */
export function useParqueaderoVivo(): ParqueaderoVivo {
  const valor = parqueaderoStore.useStore();
  useEffect(() => conectarSimulacion(), []);
  return valor;
}

// ── Sesión del socio (lo mínimo mutable de la demo) ──────────────────────────

export const sesionSocioStore = crearStore({
  /** true cuando el socio ya registró su rostro (Perfil ↔ banner del Inicio) */
  fotoFacial: socio.fotoFacial,
});
