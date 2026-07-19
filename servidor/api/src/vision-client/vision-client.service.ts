import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReconocimientoPlaca } from '@club-campina/shared-types';

// Cliente HTTP hacia el motor de visión (Python/FastAPI). Único punto de contacto:
// si el motor cae o se reemplaza (p. ej. por un ALPR comercial), solo cambia esta clase.
@Injectable()
export class VisionClientService {
  private readonly logger = new Logger(VisionClientService.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>(
      'VISION_ENGINE_URL',
      'http://localhost:8000',
    );
  }

  async reconocerPlaca(
    imagen: Buffer,
    nombreArchivo: string,
    mimeType: string,
  ): Promise<ReconocimientoPlaca> {
    const form = new FormData();
    form.append(
      'image',
      new Blob([new Uint8Array(imagen)], { type: mimeType }),
      nombreArchivo,
    );
    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.baseUrl}/plate/recognize`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e) {
      this.logger.error(`Motor de visión inaccesible: ${e}`);
      throw new ServiceUnavailableException(
        'El motor de visión no está disponible',
      );
    }
    if (!respuesta.ok) {
      const cuerpo = await respuesta.text().catch(() => '');
      this.logger.error(
        `Motor de visión respondió ${respuesta.status}: ${cuerpo}`,
      );
      throw new ServiceUnavailableException(
        'El motor de visión devolvió un error',
      );
    }
    return (await respuesta.json()) as ReconocimientoPlaca;
  }
}
