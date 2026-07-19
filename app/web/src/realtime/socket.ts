import { io, Socket } from 'socket.io-client';
import { WS_NAMESPACE_MONITOREO } from '@club-campina/shared-types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_NAMESPACE_MONITOREO, {
      transports: ['websocket'],
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
