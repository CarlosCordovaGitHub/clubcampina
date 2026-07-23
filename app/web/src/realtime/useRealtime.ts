// Integración Socket.io ↔ React Query: los eventos WS actualizan la cache
// directamente, sin refetch manual (las pestañas reflejan cambios al instante).
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  EventoWS,
  type EventoAcceso,
  type Paginado,
  type PayloadAlerta,
  type PayloadEventoNuevo,
  type PayloadZonaActualizada,
  type ZonaParqueadero,
} from '@club-campina/shared-types';
import { getSocket } from './socket';

export function useRealtimeMonitoreo() {
  const queryClient = useQueryClient();
  const [conectado, setConectado] = useState(false);
  const [alertas, setAlertas] = useState<PayloadAlerta[]>([]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConectado(true);
    const onDisconnect = () => setConectado(false);

    const onZona = ({ zona }: PayloadZonaActualizada) => {
      queryClient.setQueryData<ZonaParqueadero[]>(['zonas'], (prev) =>
        prev ? prev.map((z) => (z.id === zona.id ? zona : z)) : prev,
      );
    };

    const onEvento = ({ evento }: PayloadEventoNuevo) => {
      // Inserta el evento al frente de la primera página del historial
      queryClient.setQueriesData<Paginado<EventoAcceso>>(
        { queryKey: ['eventos'] },
        (prev) =>
          prev && prev.page === 1
            ? {
                ...prev,
                total: prev.total + 1,
                data: [evento, ...prev.data].slice(0, prev.pageSize),
              }
            : prev,
      );
    };

    const onAlerta = (payload: PayloadAlerta) => {
      setAlertas((prev) => [payload, ...prev].slice(0, 5));
      // Notificación nativa al operador (si dio permiso)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Alerta de acceso — Club Campiña', {
          body: payload.mensaje,
          icon: '/logo.jpg',
          tag: 'campina-alerta',
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(EventoWS.ZONA_ACTUALIZADA, onZona);
    socket.on(EventoWS.EVENTO_NUEVO, onEvento);
    socket.on(EventoWS.ALERTA, onAlerta);
    setConectado(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(EventoWS.ZONA_ACTUALIZADA, onZona);
      socket.off(EventoWS.EVENTO_NUEVO, onEvento);
      socket.off(EventoWS.ALERTA, onAlerta);
    };
  }, [queryClient]);

  return {
    conectado,
    alertas,
    descartarAlertas: () => setAlertas([]),
  };
}
