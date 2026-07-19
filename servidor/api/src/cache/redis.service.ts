import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CANAL_MONITOREO = 'monitoreo';

// Redis cumple dos papeles (según el plan):
//  1. Cache de estado de zonas (`zona:{id}:estado`) — vista rápida; Postgres es la fuente de verdad.
//  2. Backplane pub/sub para que el gateway WS emita eventos aunque haya varias réplicas de la API.
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  readonly subscriber: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { maxRetriesPerRequest: 2 });
    this.subscriber = new Redis(url, { maxRetriesPerRequest: 2 });
    this.client.on('error', (e) => this.logger.warn(`Redis: ${e.message}`));
    this.subscriber.on('error', () => undefined);
  }

  async publicar(evento: string, payload: unknown) {
    await this.client.publish(
      CANAL_MONITOREO,
      JSON.stringify({ evento, payload }),
    );
  }

  onSuscripcion(
    handler: (evento: string, payload: unknown) => void,
  ): void {
    void this.subscriber.subscribe(CANAL_MONITOREO);
    this.subscriber.on('message', (_canal, mensaje) => {
      try {
        const { evento, payload } = JSON.parse(mensaje);
        handler(evento, payload);
      } catch (e) {
        this.logger.warn(`Mensaje pub/sub inválido: ${e}`);
      }
    });
  }

  async setZonaEstado(zonaId: string, estado: object) {
    await this.client.set(`zona:${zonaId}:estado`, JSON.stringify(estado));
  }

  async getZonasEstado(zonaIds: string[]): Promise<(object | null)[]> {
    if (zonaIds.length === 0) return [];
    const valores = await this.client.mget(
      zonaIds.map((id) => `zona:${id}:estado`),
    );
    return valores.map((v) => (v ? JSON.parse(v) : null));
  }

  async delZonaEstado(zonaId: string) {
    await this.client.del(`zona:${zonaId}:estado`);
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.client.quit(), this.subscriber.quit()]);
  }
}
