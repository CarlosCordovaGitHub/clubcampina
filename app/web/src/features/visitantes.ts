import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CrearVisitanteDto,
  Paginado,
  Visitante,
  VisitanteConEstado,
} from '@club-campina/shared-types';
import { request } from '../api/client';

export function useVisitantes(params: { page?: number; buscar?: string } = {}) {
  return useQuery({
    queryKey: ['visitantes', params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.page) sp.set('page', String(params.page));
      if (params.buscar) sp.set('buscar', params.buscar);
      const q = sp.toString();
      return request<Paginado<VisitanteConEstado>>(
        `/visitantes${q ? `?${q}` : ''}`,
      );
    },
    placeholderData: (prev) => prev,
    refetchInterval: 60_000, // el estado "excedido" depende del reloj
  });
}

export function useVisitantesMutations() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['visitantes'] });
  return {
    crear: useMutation({
      mutationFn: (dto: CrearVisitanteDto) =>
        request<Visitante>('/visitantes', {
          method: 'POST',
          body: JSON.stringify(dto),
        }),
      onSuccess: invalidar,
    }),
    desactivar: useMutation({
      mutationFn: (id: string) =>
        request<{ ok: true }>(`/visitantes/${id}`, { method: 'DELETE' }),
      onSuccess: invalidar,
    }),
  };
}
