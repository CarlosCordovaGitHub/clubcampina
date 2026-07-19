import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { EstadoZona, TipoZona } from '@club-campina/shared-types';

export class CrearZonaDto {
  @IsString()
  @MinLength(1)
  codigo!: string;

  @IsOptional()
  @IsEnum(TipoZona)
  tipo?: TipoZona;
}

export class ActualizarZonaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  codigo?: string;

  @IsOptional()
  @IsEnum(TipoZona)
  tipo?: TipoZona;

  // Solo LIBRE ↔ FUERA_DE_SERVICIO manualmente; OCUPADA la gestiona eventos-acceso
  @IsOptional()
  @IsEnum(EstadoZona)
  estado?: EstadoZona;
}
