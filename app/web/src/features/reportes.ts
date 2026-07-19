import { useQuery } from '@tanstack/react-query';
import type { ResumenReportes } from '@club-campina/shared-types';
import { request, sesion } from '../api/client';

export function useReportes(dias: number) {
  return useQuery({
    queryKey: ['reportes', dias],
    queryFn: () => request<ResumenReportes>(`/reportes/resumen?dias=${dias}`),
    placeholderData: (prev) => prev,
  });
}

/** Descarga el CSV del historial con el token de sesión. */
export async function descargarCsvEventos(filtros: {
  placa?: string;
  resultado?: string;
  tipo?: string;
}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) if (v) sp.set(k, v);
  const res = await fetch(`/api/v1/eventos-acceso/export.csv?${sp}`, {
    headers: { Authorization: `Bearer ${sesion.token()}` },
  });
  if (!res.ok) throw new Error('No se pudo exportar el CSV');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eventos-acceso-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
