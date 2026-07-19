import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

// Interfaz que un adaptador S3/GCS implementaría en el futuro sin tocar eventos-acceso
export interface AlmacenFotos {
  guardarFoto(buffer: Buffer, nombreOriginal: string): Promise<string>;
}

@Injectable()
export class StorageService implements AlmacenFotos {
  private readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = config.get<string>('UPLOADS_DIR', './uploads');
  }

  /** Guarda la foto en filesystem y devuelve la URL pública relativa. */
  async guardarFoto(buffer: Buffer, nombreOriginal: string): Promise<string> {
    const carpeta = join(process.cwd(), this.dir, 'eventos');
    await mkdir(carpeta, { recursive: true });
    const ext = extname(nombreOriginal) || '.jpg';
    const nombre = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    await writeFile(join(carpeta, nombre), buffer);
    return `/uploads/eventos/${nombre}`;
  }
}
