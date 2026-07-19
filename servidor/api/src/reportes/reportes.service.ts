import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FrecuenciaSocio,
  OcupacionPorHora,
  ResumenReportes,
} from '@club-campina/shared-types';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportesService {
  private readonly zonaHoraria: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.zonaHoraria = config.get<string>('REPORTES_TZ', 'America/Bogota');
  }

  async resumen(dias = 7): Promise<ResumenReportes> {
    const desde = new Date(Date.now() - dias * 86_400_000);

    const [porHora, porSocio, totales] = await Promise.all([
      this.prisma.$queryRaw<{ hora: number; ingresos: bigint }[]>`
        -- timestamp se guarda sin zona (UTC): se ancla a UTC y se convierte a hora local
        SELECT EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC' AT TIME ZONE ${this.zonaHoraria})::int AS hora,
               COUNT(*) AS ingresos
        FROM eventos_acceso
        WHERE tipo = 'INGRESO' AND resultado = 'AUTORIZADO' AND timestamp >= ${desde}
        GROUP BY 1 ORDER BY 1`,
      this.prisma.$queryRaw<
        { miembro_id: string; nombre: string; ingresos: bigint }[]
      >`
        SELECT m.id AS miembro_id, m.nombre, COUNT(*) AS ingresos
        FROM eventos_acceso e
        JOIN vehiculos v ON v.id = e.vehiculo_id
        JOIN miembros m ON m.id = v.miembro_id
        WHERE e.tipo = 'INGRESO' AND e.resultado = 'AUTORIZADO' AND e.timestamp >= ${desde}
        GROUP BY m.id, m.nombre
        ORDER BY ingresos DESC
        LIMIT 10`,
      this.prisma.eventoAcceso.groupBy({
        by: ['resultado'],
        where: { timestamp: { gte: desde } },
        _count: true,
      }),
    ]);

    // Las 24 horas siempre presentes (las vacías en 0) para un eje X estable
    const mapa = new Map(porHora.map((r) => [r.hora, Number(r.ingresos)]));
    const ocupacionPorHora: OcupacionPorHora[] = Array.from(
      { length: 24 },
      (_, hora) => ({ hora, ingresos: mapa.get(hora) ?? 0 }),
    );

    const frecuenciaSocios: FrecuenciaSocio[] = porSocio.map((r) => ({
      miembroId: r.miembro_id,
      nombre: r.nombre,
      ingresos: Number(r.ingresos),
    }));

    const contar = (resultado: string) =>
      totales.find((t) => t.resultado === resultado)?._count ?? 0;

    return {
      desdeDias: dias,
      totalIngresos: contar('AUTORIZADO'),
      totalRechazados: contar('RECHAZADO'),
      totalAlertas: contar('ALERTA'),
      ocupacionPorHora,
      frecuenciaSocios,
    };
  }
}
