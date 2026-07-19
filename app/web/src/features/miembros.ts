// Lógica de negocio del dominio Miembros (sin UI) — reutilizable por una app móvil.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarMiembroDto,
  CrearMiembroDto,
} from '@club-campina/shared-types';
import { api } from '../api/client';

export function useMiembros(params: { page?: number; buscar?: string } = {}) {
  return useQuery({
    queryKey: ['miembros', params],
    queryFn: () => api.miembros.listar(params),
    placeholderData: (prev) => prev,
  });
}

export function useMiembrosMutations() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['miembros'] });
  return {
    crear: useMutation({
      mutationFn: (dto: CrearMiembroDto) => api.miembros.crear(dto),
      onSuccess: invalidar,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: ActualizarMiembroDto }) =>
        api.miembros.actualizar(id, dto),
      onSuccess: invalidar,
    }),
    eliminar: useMutation({
      mutationFn: (id: string) => api.miembros.eliminar(id),
      onSuccess: invalidar,
    }),
  };
}
