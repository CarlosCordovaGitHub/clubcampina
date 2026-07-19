import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RolUsuario } from '@club-campina/shared-types';
import { Roles } from '../auth/decorators';
import { CrearVisitanteDto } from './dto';
import { VisitantesService } from './visitantes.service';

@Controller('visitantes')
export class VisitantesController {
  constructor(private readonly visitantesService: VisitantesService) {}

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  crear(@Body() dto: CrearVisitanteDto) {
    return this.visitantesService.crear(dto);
  }

  @Get()
  listar(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('buscar') buscar?: string,
  ) {
    return this.visitantesService.listar(page ?? 1, pageSize ?? 20, buscar);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.OPERADOR)
  desactivar(@Param('id') id: string) {
    return this.visitantesService.desactivar(id);
  }
}
