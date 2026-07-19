import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolUsuario } from '@club-campina/shared-types';
import { Roles } from '../auth/decorators';
import { ActualizarMiembroDto, CrearMiembroDto } from './dto';
import { MiembrosService } from './miembros.service';

@Controller('miembros')
export class MiembrosController {
  constructor(private readonly miembrosService: MiembrosService) {}

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  crear(@Body() dto: CrearMiembroDto) {
    return this.miembrosService.crear(dto);
  }

  @Get()
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('buscar') buscar?: string,
  ) {
    return this.miembrosService.listar(page ?? 1, pageSize ?? 20, buscar);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.miembrosService.obtener(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarMiembroDto) {
    return this.miembrosService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  eliminar(@Param('id') id: string) {
    return this.miembrosService.eliminar(id);
  }
}
