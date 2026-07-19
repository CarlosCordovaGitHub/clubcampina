import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActualizarVehiculoDto,
  CrearVehiculoDto,
} from '@club-campina/shared-types';
import { api } from '../api/client';

export function useVehiculos(params: { page?: number; buscar?: string } = {}) {
  return useQuery({
    queryKey: ['vehiculos', params],
    queryFn: () => api.vehiculos.listar(params),
    placeholderData: (prev) => prev,
  });
}

export function useVehiculosMutations() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['vehiculos'] });
  return {
    crear: useMutation({
      mutationFn: (dto: CrearVehiculoDto) => api.vehiculos.crear(dto),
      onSuccess: invalidar,
    }),
    actualizar: useMutation({
      mutationFn: ({ id, dto }: { id: string; dto: ActualizarVehiculoDto }) =>
        api.vehiculos.actualizar(id, dto),
      onSuccess: invalidar,
    }),
    eliminar: useMutation({
      mutationFn: (id: string) => api.vehiculos.eliminar(id),
      onSuccess: invalidar,
    }),
  };
}
