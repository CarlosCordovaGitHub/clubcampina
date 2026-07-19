import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EstadoZona,
  type ZonaParqueadero,
} from '@club-campina/shared-types';
import { api } from '../api/client';

export function useZonas() {
  return useQuery({ queryKey: ['zonas'], queryFn: api.zonas.listar });
}

export function useZonasMutations() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['zonas'] });
  return {
    cambiarEstado: useMutation({
      mutationFn: ({ id, estado }: { id: string; estado: EstadoZona }) =>
        api.zonas.actualizar(id, { estado }),
      onSuccess: invalidar,
    }),
  };
}

export function resumenZonas(zonas: ZonaParqueadero[] | undefined) {
  const total = zonas?.length ?? 0;
  const ocupadas =
    zonas?.filter((z) => z.estado === EstadoZona.OCUPADA).length ?? 0;
  const fueraServicio =
    zonas?.filter((z) => z.estado === EstadoZona.FUERA_DE_SERVICIO).length ?? 0;
  return {
    total,
    ocupadas,
    fueraServicio,
    libres: total - ocupadas - fueraServicio,
  };
}
