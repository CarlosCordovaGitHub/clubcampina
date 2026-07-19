import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActualizarMiembroDto, CrearMiembroDto } from './dto';

@Injectable()
export class MiembrosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearMiembroDto) {
    try {
      return await this.prisma.miembro.create({ data: dto });
    } catch (e) {
      this.traducirError(e);
    }
  }

  async listar(page = 1, pageSize = 20, buscar?: string) {
    const where: Prisma.MiembroWhereInput = buscar
      ? {
          OR: [
            { nombre: { contains: buscar, mode: 'insensitive' } },
            { documentoIdentidad: { contains: buscar } },
          ],
        }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.miembro.findMany({
        where,
        include: { vehiculos: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.miembro.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async obtener(id: string) {
    const miembro = await this.prisma.miembro.findUnique({
      where: { id },
      include: { vehiculos: true },
    });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');
    return miembro;
  }

  async actualizar(id: string, dto: ActualizarMiembroDto) {
    await this.obtener(id);
    try {
      return await this.prisma.miembro.update({ where: { id }, data: dto });
    } catch (e) {
      this.traducirError(e);
    }
  }

  async eliminar(id: string) {
    await this.obtener(id);
    await this.prisma.miembro.delete({ where: { id } });
    return { ok: true };
  }

  private traducirError(e: unknown): never {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un miembro con ese documento');
    }
    throw e;
  }
}
