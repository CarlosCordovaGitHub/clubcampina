import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EstadoZona, EventoWS } from '@club-campina/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { ActualizarZonaDto, CrearZonaDto } from './dto';

const INCLUDE_ZONA = {
  vehiculoActual: { include: { miembro: true } },
} satisfies Prisma.ZonaParqueaderoInclude;

@Injectable()
export class ZonasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async crear(dto: CrearZonaDto) {
    try {
      const zona = await this.prisma.zonaParqueadero.create({
        data: dto,
        include: INCLUDE_ZONA,
      });
      await this.redis.setZonaEstado(zona.id, zona);
      return zona;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una zona con ese código');
      }
      throw e;
    }
  }

  // Lee estado desde Redis con fallback a Postgres (fuente de verdad)
  async listar() {
    const zonas = await this.prisma.zonaParqueadero.findMany({
      orderBy: { codigo: 'asc' },
      select: { id: true },
    });
    const cacheadas = await this.redis.getZonasEstado(zonas.map((z) => z.id));
    const faltantes = zonas
      .map((z, i) => (cacheadas[i] ? null : z.id))
      .filter((id): id is string => id !== null);

    let resultado = cacheadas.filter((z): z is object => z !== null);
    if (faltantes.length > 0) {
      const desdeDb = await this.prisma.zonaParqueadero.findMany({
        where: { id: { in: faltantes } },
        include: INCLUDE_ZONA,
      });
      await Promise.all(
        desdeDb.map((z) => this.redis.setZonaEstado(z.id, z)),
      );
      resultado = [...resultado, ...desdeDb];
    }
    return (resultado as { codigo: string }[]).sort((a, b) =>
      a.codigo.localeCompare(b.codigo, undefined, { numeric: true }),
    );
  }

  async obtener(id: string) {
    const zona = await this.prisma.zonaParqueadero.findUnique({
      where: { id },
      include: INCLUDE_ZONA,
    });
    if (!zona) throw new NotFoundException('Zona no encontrada');
    return zona;
  }

  async actualizar(id: string, dto: ActualizarZonaDto) {
    const actual = await this.obtener(id);
    if (dto.estado && actual.estado === EstadoZona.OCUPADA) {
      throw new BadRequestException(
        'La zona está ocupada; el estado lo gestiona el flujo de eventos de acceso',
      );
    }
    if (dto.estado === EstadoZona.OCUPADA) {
      throw new BadRequestException(
        'OCUPADA solo se asigna desde eventos de acceso',
      );
    }
    const zona = await this.prisma.zonaParqueadero.update({
      where: { id },
      data: dto,
      include: INCLUDE_ZONA,
    });
    await this.redis.setZonaEstado(zona.id, zona);
    await this.redis.publicar(EventoWS.ZONA_ACTUALIZADA, { zona });
    return zona;
  }

  async eliminar(id: string) {
    const zona = await this.obtener(id);
    if (zona.estado === EstadoZona.OCUPADA) {
      throw new BadRequestException('No se puede eliminar una zona ocupada');
    }
    await this.prisma.zonaParqueadero.delete({ where: { id } });
    await this.redis.delZonaEstado(id);
    return { ok: true };
  }

  // Usado por eventos-acceso: busca zona libre compatible, la ocupa y publica WS
  async ocuparZonaLibre(vehiculoId: string, tipoZona?: string) {
    const zona = await this.prisma.zonaParqueadero.findFirst({
      where: {
        estado: EstadoZona.LIBRE,
        ...(tipoZona ? { tipo: tipoZona as never } : {}),
      },
      orderBy: { codigo: 'asc' },
    });
    if (!zona) return null;
    const ocupada = await this.prisma.zonaParqueadero.update({
      where: { id: zona.id },
      data: { estado: EstadoZona.OCUPADA, vehiculoActualId: vehiculoId },
      include: INCLUDE_ZONA,
    });
    await this.redis.setZonaEstado(ocupada.id, ocupada);
    await this.redis.publicar(EventoWS.ZONA_ACTUALIZADA, { zona: ocupada });
    return ocupada;
  }

  // Usado por eventos-acceso en la salida
  async liberarZonaDeVehiculo(vehiculoId: string) {
    const zona = await this.prisma.zonaParqueadero.findUnique({
      where: { vehiculoActualId: vehiculoId },
    });
    if (!zona) return null;
    const libre = await this.prisma.zonaParqueadero.update({
      where: { id: zona.id },
      data: { estado: EstadoZona.LIBRE, vehiculoActualId: null },
      include: INCLUDE_ZONA,
    });
    await this.redis.setZonaEstado(libre.id, libre);
    await this.redis.publicar(EventoWS.ZONA_ACTUALIZADA, { zona: libre });
    return libre;
  }
}
