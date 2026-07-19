import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RolUsuario } from '@club-campina/shared-types';
import { CurrentUser, Roles, UsuarioJwt } from '../auth/decorators';
import { EventosAccesoService } from './eventos-acceso.service';

const LIMITE_IMAGEN = { fileSize: 10 * 1024 * 1024 };

function validarImagen(file?: Express.Multer.File) {
  if (!file) throw new BadRequestException('Campo "imagen" requerido');
  if (!file.mimetype.startsWith('image/')) {
    throw new BadRequestException('El archivo debe ser una imagen');
  }
  return file;
}

@Controller('eventos-acceso')
export class EventosAccesoController {
  constructor(private readonly eventosService: EventosAccesoService) {}

  @Post('ingreso')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @UseInterceptors(FileInterceptor('imagen', { limits: LIMITE_IMAGEN }))
  ingreso(
    @UploadedFile() imagen: Express.Multer.File,
    @CurrentUser() user?: UsuarioJwt,
  ) {
    return this.eventosService.procesarIngreso(validarImagen(imagen), user?.sub);
  }

  @Post('salida')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  @UseInterceptors(FileInterceptor('imagen', { limits: LIMITE_IMAGEN }))
  salida(
    @UploadedFile() imagen: Express.Multer.File,
    @CurrentUser() user?: UsuarioJwt,
  ) {
    return this.eventosService.procesarSalida(validarImagen(imagen), user?.sub);
  }

  @Get('export.csv')
  async exportar(
    @Res() res: Response,
    @Query('placa') placa?: string,
    @Query('resultado') resultado?: string,
    @Query('tipo') tipo?: string,
  ) {
    const csv = await this.eventosService.exportarCsv({ placa, resultado, tipo });
    res
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="eventos-acceso-${new Date().toISOString().slice(0, 10)}.csv"`,
      })
      .send(csv);
  }

  @Get()
  historial(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('placa') placa?: string,
    @Query('resultado') resultado?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.eventosService.historial({
      page: page ?? 1,
      pageSize: pageSize ?? 20,
      placa,
      resultado,
      tipo,
    });
  }
}
