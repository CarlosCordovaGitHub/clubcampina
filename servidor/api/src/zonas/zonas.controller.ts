import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolUsuario } from '@club-campina/shared-types';
import { Roles } from '../auth/decorators';
import { ActualizarZonaDto, CrearZonaDto } from './dto';
import { ZonasService } from './zonas.service';

@Controller('zonas')
export class ZonasController {
  constructor(private readonly zonasService: ZonasService) {}

  @Post()
  @Roles(RolUsuario.ADMIN)
  crear(@Body() dto: CrearZonaDto) {
    return this.zonasService.crear(dto);
  }

  @Get()
  listar() {
    return this.zonasService.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.zonasService.obtener(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarZonaDto) {
    return this.zonasService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  eliminar(@Param('id') id: string) {
    return this.zonasService.eliminar(id);
  }
}
