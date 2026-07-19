import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  EstadoMiembro,
  TipoMembresia,
} from '@club-campina/shared-types';

export class CrearMiembroDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(4)
  documentoIdentidad!: string;

  @IsEnum(TipoMembresia)
  tipoMembresia!: TipoMembresia;

  @IsOptional()
  @IsEnum(EstadoMiembro)
  estado?: EstadoMiembro;
}

export class ActualizarMiembroDto extends PartialType(CrearMiembroDto) {}
