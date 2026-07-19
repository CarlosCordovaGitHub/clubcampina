import { Logger, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EventoWS } from '@club-campina/shared-types';
import { RedisService } from '../cache/redis.service';

// Los productores (zonas, eventos-acceso) NO emiten directo al socket: publican en
// Redis y este gateway re-emite. Así un futuro `barrera-driver` u otra réplica de la
// API escuchan el mismo canal sin acoplarse a Socket.io.
@WebSocketGateway({ namespace: '/monitoreo', cors: { origin: true } })
export class MonitoreoGateway implements OnModuleInit {
  private readonly logger = new Logger(MonitoreoGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    this.redis.onSuscripcion((evento, payload) => {
      this.server.emit(evento, payload);
    });
    this.logger.log('Gateway /monitoreo suscrito al pub/sub de Redis');
  }

  // Utilidad para pruebas: confirma qué eventos existen
  eventosDisponibles(): string[] {
    return Object.values(EventoWS);
  }
}
