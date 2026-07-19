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
import { ActualizarVehiculoDto, CrearVehiculoDto } from './dto';
import { VehiculosService } from './vehiculos.service';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  crear(@Body() dto: CrearVehiculoDto) {
    return this.vehiculosService.crear(dto);
  }

  @Get()
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('buscar') buscar?: string,
  ) {
    return this.vehiculosService.listar(page ?? 1, pageSize ?? 20, buscar);
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.vehiculosService.obtener(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  actualizar(@Param('id') id: string, @Body() dto: ActualizarVehiculoDto) {
    return this.vehiculosService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  eliminar(@Param('id') id: string) {
    return this.vehiculosService.eliminar(id);
  }
}
