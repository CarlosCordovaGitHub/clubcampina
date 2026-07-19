import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface FiltrosEventos {
  page?: number;
  placa?: string;
  resultado?: string;
  tipo?: string;
}

export function useEventos(filtros: FiltrosEventos = {}) {
  return useQuery({
    queryKey: ['eventos', filtros],
    queryFn: () => api.eventos.historial(filtros),
    placeholderData: (prev) => prev,
  });
}

// El resultado llega también por WS (evento.nuevo actualiza la cache); la
// mutación devuelve el evento para mostrar el detalle inmediato al operador.
export function useRegistrarAcceso() {
  return {
    ingreso: useMutation({
      mutationFn: (imagen: File) => api.eventos.ingreso(imagen),
    }),
    salida: useMutation({
      mutationFn: (imagen: File) => api.eventos.salida(imagen),
    }),
  };
}
