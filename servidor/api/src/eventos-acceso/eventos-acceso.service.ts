import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  EventoWS,
  ResultadoEvento,
  TipoEventoAcceso,
  TipoVehiculo,
  TipoZona,
} from '@club-campina/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { StorageService } from '../storage/storage.service';
import { VisionClientService } from '../vision-client/vision-client.service';
import { ZonasService } from '../zonas/zonas.service';

const INCLUDE_EVENTO = {
  vehiculo: { include: { miembro: true, visitante: true } },
  zona: true,
} satisfies Prisma.EventoAccesoInclude;

interface ContextoRegistro {
  tipo: TipoEventoAcceso;
  placaDetectada: string;
  confianzaOcr: number | null;
  resultado: ResultadoEvento;
  motivo: string | null;
  fotoUrl: string | null;
  vehiculoId?: string | null;
  zonaId?: string | null;
  operadorId?: string | null;
  /** Detalle transitorio del OCR (no se persiste; se devuelve al operador) */
  ocrExtra?: { backend?: string; bbox: number[] | null };
}

// Corazón del módulo: orquesta motor de visión → decisión → persistencia → tiempo real.
@Injectable()
export class EventosAccesoService {
  private readonly logger = new Logger(EventosAccesoService.name);
  private readonly minConfianza: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly vision: VisionClientService,
    private readonly storage: StorageService,
    private readonly zonas: ZonasService,
    config: ConfigService,
  ) {
    this.minConfianza = Number(config.get('OCR_MIN_CONFIDENCE', '0.35'));
  }

  async procesarIngreso(imagen: Express.Multer.File, operadorId?: string) {
    return this.procesar(TipoEventoAcceso.INGRESO, imagen, operadorId);
  }

  async procesarSalida(imagen: Express.Multer.File, operadorId?: string) {
    return this.procesar(TipoEventoAcceso.SALIDA, imagen, operadorId);
  }

  private async procesar(
    tipo: TipoEventoAcceso,
    imagen: Express.Multer.File,
    operadorId?: string,
  ) {
    if (!imagen) throw new BadRequestException('Falta la imagen');

    const [ocr, fotoUrl] = await Promise.all([
      this.vision.reconocerPlaca(
        imagen.buffer,
        imagen.originalname,
        imagen.mimetype,
      ),
      this.storage.guardarFoto(imagen.buffer, imagen.originalname),
    ]);

    const base = {
      tipo,
      placaDetectada: ocr.plate_text ?? '',
      confianzaOcr: ocr.confidence,
      fotoUrl,
      operadorId: operadorId ?? null,
      ocrExtra: { backend: ocr.backend, bbox: ocr.bbox },
    };

    // 1. ¿Se pudo leer una placa con confianza suficiente?
    if (!ocr.plate_text) {
      return this.registrar({
        ...base,
        placaDetectada: 'ILEGIBLE',
        resultado: ResultadoEvento.ALERTA,
        motivo: 'No se pudo leer ninguna placa en la imagen',
      });
    }
    if (ocr.confidence < this.minConfianza) {
      return this.registrar({
        ...base,
        resultado: ResultadoEvento.ALERTA,
        motivo: `Lectura con confianza baja (${(ocr.confidence * 100).toFixed(0)}%); requiere verificación manual`,
      });
    }

    // 2. ¿La placa pertenece a un vehículo registrado y habilitado?
    //    (de un socio, o de un visitante con autorización temporal vigente)
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { placa: ocr.plate_text },
      include: { miembro: true, visitante: true, zonaActual: true },
    });
    if (!vehiculo) {
      return this.registrar({
        ...base,
        resultado: ResultadoEvento.RECHAZADO,
        motivo: 'Placa no registrada en el club',
      });
    }
    const motivoPropietario = vehiculo.miembro
      ? vehiculo.miembro.estado !== 'ACTIVO'
        ? `Membresía del socio en estado ${vehiculo.miembro.estado}`
        : null
      : vehiculo.visitante?.activo
        ? null
        : 'Autorización de visitante desactivada';
    if (vehiculo.estado !== 'ACTIVO' || motivoPropietario) {
      return this.registrar({
        ...base,
        vehiculoId: vehiculo.id,
        resultado: ResultadoEvento.RECHAZADO,
        motivo:
          vehiculo.estado !== 'ACTIVO'
            ? 'Vehículo inactivo'
            : motivoPropietario,
      });
    }

    // 3. Reglas propias de ingreso / salida
    if (tipo === TipoEventoAcceso.INGRESO) {
      if (vehiculo.zonaActual) {
        return this.registrar({
          ...base,
          vehiculoId: vehiculo.id,
          resultado: ResultadoEvento.ALERTA,
          motivo: `El vehículo ya figura dentro (zona ${vehiculo.zonaActual.codigo}); posible placa clonada o salida no registrada`,
        });
      }
      const tipoZona =
        vehiculo.tipo === TipoVehiculo.MOTOCICLETA ? TipoZona.MOTOS : undefined;
      const zona =
        (await this.zonas.ocuparZonaLibre(vehiculo.id, tipoZona)) ??
        (tipoZona ? await this.zonas.ocuparZonaLibre(vehiculo.id) : null);
      if (!zona) {
        return this.registrar({
          ...base,
          vehiculoId: vehiculo.id,
          resultado: ResultadoEvento.RECHAZADO,
          motivo: 'Parqueadero sin zonas libres',
        });
      }
      return this.registrar({
        ...base,
        vehiculoId: vehiculo.id,
        zonaId: zona.id,
        resultado: ResultadoEvento.AUTORIZADO,
        motivo: null,
      });
    }

    // SALIDA
    const zonaLiberada = await this.zonas.liberarZonaDeVehiculo(vehiculo.id);
    return this.registrar({
      ...base,
      vehiculoId: vehiculo.id,
      zonaId: zonaLiberada?.id ?? null,
      resultado: zonaLiberada
        ? ResultadoEvento.AUTORIZADO
        : ResultadoEvento.ALERTA,
      motivo: zonaLiberada
        ? null
        : 'Salida de un vehículo que no figuraba dentro del parqueadero',
    });
  }

  private async registrar(ctx: ContextoRegistro) {
    const evento = await this.prisma.eventoAcceso.create({
      data: {
        tipo: ctx.tipo,
        placaDetectada: ctx.placaDetectada,
        confianzaOcr: ctx.confianzaOcr,
        resultado: ctx.resultado,
        motivo: ctx.motivo,
        fotoUrl: ctx.fotoUrl,
        vehiculoId: ctx.vehiculoId ?? null,
        zonaId: ctx.zonaId ?? null,
        operadorId: ctx.operadorId ?? null,
      },
      include: INCLUDE_EVENTO,
    });
    await this.redis.publicar(EventoWS.EVENTO_NUEVO, { evento });
    if (ctx.resultado === ResultadoEvento.ALERTA) {
      await this.redis.publicar(EventoWS.ALERTA, {
        mensaje: ctx.motivo ?? 'Alerta de acceso',
        evento,
      });
    }
    this.logger.log(
      `${ctx.tipo} placa=${ctx.placaDetectada} resultado=${ctx.resultado}`,
    );
    return {
      ...evento,
      ocrBackend: ctx.ocrExtra?.backend ?? null,
      ocrBbox: ctx.ocrExtra?.bbox ?? null,
    };
  }

  /** Exporta el historial filtrado como CSV (con BOM para Excel). */
  async exportarCsv(filtros: {
    placa?: string;
    resultado?: string;
    tipo?: string;
  }): Promise<string> {
    const { data } = await this.historial({
      page: 1,
      pageSize: 10_000,
      ...filtros,
    });
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const filas = data.map((e) =>
      [
        e.timestamp.toISOString(),
        e.tipo,
        e.placaDetectada,
        e.confianzaOcr != null ? (e.confianzaOcr * 100).toFixed(1) + '%' : '',
        e.resultado,
        e.vehiculo?.miembro?.nombre ??
          (e.vehiculo?.visitante ? `Visitante: ${e.vehiculo.visitante.nombre}` : ''),
        e.zona?.codigo ?? '',
        e.motivo ?? '',
      ]
        .map(esc)
        .join(';'),
    );
    return (
      '﻿' +
      ['fecha;tipo;placa;confianza;resultado;titular;zona;motivo', ...filas].join(
        '\r\n',
      )
    );
  }

  async historial(opts: {
    page: number;
    pageSize: number;
    placa?: string;
    resultado?: string;
    tipo?: string;
  }) {
    const where: Prisma.EventoAccesoWhereInput = {
      ...(opts.placa
        ? { placaDetectada: { contains: opts.placa.toUpperCase() } }
        : {}),
      ...(opts.resultado ? { resultado: opts.resultado as never } : {}),
      ...(opts.tipo ? { tipo: opts.tipo as never } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.eventoAcceso.findMany({
        where,
        include: INCLUDE_EVENTO,
        orderBy: { timestamp: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      this.prisma.eventoAcceso.count({ where }),
    ]);
    return { data, total, page: opts.page, pageSize: opts.pageSize };
  }
}
