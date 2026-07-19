import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EstadoVehiculo,
  EventoWS,
  ResultadoEvento,
  TipoEventoAcceso,
  VisitanteConEstado,
} from '@club-campina/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CrearVisitanteDto } from './dto';

const INTERVALO_VIGILANCIA_MS = 5 * 60 * 1000;

@Injectable()
export class VisitantesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VisitantesService.name);
  private timer?: NodeJS.Timeout;
  // Evita repetir la misma alerta de exceso en cada barrido
  private alertados = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(
      () => this.vigilarExcedidos().catch((e) => this.logger.error(e)),
      INTERVALO_VIGILANCIA_MS,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async crear(dto: CrearVisitanteDto) {
    const existente = await this.prisma.vehiculo.findUnique({
      where: { placa: dto.placa },
    });
    if (existente) {
      throw new ConflictException(
        'Esa placa ya está registrada (socio u otro visitante)',
      );
    }
    return this.prisma.visitante.create({
      data: {
        nombre: dto.nombre,
        documento: dto.documento,
        telefono: dto.telefono,
        tiempoMaxHoras: dto.tiempoMaxHoras ?? 4,
        vehiculos: {
          create: {
            placa: dto.placa,
            tipo: dto.tipoVehiculo ?? 'AUTOMOVIL',
          },
        },
      },
      include: { vehiculos: true },
    });
  }

  async listar(page = 1, pageSize = 20, buscar?: string) {
    const where: Prisma.VisitanteWhereInput = buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' } },
            { documento: { contains: buscar } },
            { vehiculos: { some: { placa: { contains: buscar.toUpperCase() } } } },
          ],
        }
      : {};
    const [visitantes, total] = await this.prisma.$transaction([
      this.prisma.visitante.findMany({
        where,
        include: { vehiculos: { include: { zonaActual: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.visitante.count({ where }),
    ]);
    const data = await Promise.all(
      visitantes.map((v) => this.conEstado(v)),
    );
    return { data, total, page, pageSize };
  }

  async desactivar(id: string) {
    const visitante = await this.prisma.visitante.findUnique({
      where: { id },
      include: { vehiculos: true },
    });
    if (!visitante) throw new NotFoundException('Visitante no encontrado');
    await this.prisma.$transaction([
      this.prisma.visitante.update({ where: { id }, data: { activo: false } }),
      this.prisma.vehiculo.updateMany({
        where: { visitanteId: id },
        data: { estado: EstadoVehiculo.INACTIVO },
      }),
    ]);
    return { ok: true };
  }

  /** Enriquecer con si está dentro, desde cuándo y si excedió su tiempo. */
  private async conEstado(
    visitante: Prisma.VisitanteGetPayload<{
      include: { vehiculos: { include: { zonaActual: true } } };
    }>,
  ): Promise<VisitanteConEstado> {
    const vehiculo = visitante.vehiculos[0];
    const zona = vehiculo?.zonaActual ?? null;
    let horaIngreso: Date | null = null;
    if (vehiculo && zona) {
      const ultimoIngreso = await this.prisma.eventoAcceso.findFirst({
        where: {
          vehiculoId: vehiculo.id,
          tipo: TipoEventoAcceso.INGRESO,
          resultado: ResultadoEvento.AUTORIZADO,
        },
        orderBy: { timestamp: 'desc' },
      });
      horaIngreso = ultimoIngreso?.timestamp ?? null;
    }
    const excedido =
      !!zona &&
      !!horaIngreso &&
      Date.now() - horaIngreso.getTime() >
        visitante.tiempoMaxHoras * 3_600_000;
    return {
      ...(visitante as never as VisitanteConEstado),
      placa: vehiculo?.placa ?? null,
      dentro: !!zona,
      zonaCodigo: zona?.codigo ?? null,
      horaIngreso: horaIngreso?.toISOString() ?? null,
      excedido,
    };
  }

  /** Barrido periódico: publica una alerta por cada visitante que excedió su estadía. */
  private async vigilarExcedidos() {
    const dentro = await this.prisma.visitante.findMany({
      where: { vehiculos: { some: { zonaActual: { isNot: null } } } },
      include: { vehiculos: { include: { zonaActual: true } } },
    });
    for (const visitante of dentro) {
      const estado = await this.conEstado(visitante);
      if (estado.excedido && !this.alertados.has(visitante.id)) {
        this.alertados.add(visitante.id);
        await this.redis.publicar(EventoWS.ALERTA, {
          mensaje: `Visitante ${visitante.nombre} (placa ${estado.placa}) excedió su tiempo máximo de ${visitante.tiempoMaxHoras}h en zona ${estado.zonaCodigo}`,
        });
        this.logger.warn(
          `Visitante excedido: ${visitante.nombre} placa=${estado.placa}`,
        );
      }
      if (!estado.dentro) this.alertados.delete(visitante.id);
    }
  }
}
