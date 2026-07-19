import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ActualizarVehiculoDto, CrearVehiculoDto } from './dto';

@Injectable()
export class VehiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearVehiculoDto) {
    const miembro = await this.prisma.miembro.findUnique({
      where: { id: dto.miembroId },
    });
    if (!miembro) throw new BadRequestException('El miembro no existe');
    try {
      return await this.prisma.vehiculo.create({
        data: dto,
        include: { miembro: true },
      });
    } catch (e) {
      this.traducirError(e);
    }
  }

  async listar(page = 1, pageSize = 20, buscar?: string) {
    const where: Prisma.VehiculoWhereInput = buscar
      ? {
          OR: [
            { placa: { contains: buscar.toUpperCase() } },
            { miembro: { nombre: { contains: buscar, mode: 'insensitive' } } },
          ],
        }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vehiculo.findMany({
        where,
        include: { miembro: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.vehiculo.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async obtener(id: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: { miembro: true },
    });
    if (!vehiculo) throw new NotFoundException('Vehículo no encontrado');
    return vehiculo;
  }

  async actualizar(id: string, dto: ActualizarVehiculoDto) {
    await this.obtener(id);
    try {
      return await this.prisma.vehiculo.update({
        where: { id },
        data: dto,
        include: { miembro: true },
      });
    } catch (e) {
      this.traducirError(e);
    }
  }

  async eliminar(id: string) {
    await this.obtener(id);
    await this.prisma.vehiculo.delete({ where: { id } });
    return { ok: true };
  }

  private traducirError(e: unknown): never {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un vehículo con esa placa');
    }
    throw e;
  }
}
