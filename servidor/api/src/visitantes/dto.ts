import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { TipoVehiculo } from '@club-campina/shared-types';

export class CrearVisitanteDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @MinLength(4)
  documento!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/[\s-]/g, '')
      : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}[0-9]{2}[0-9A-Z]$/, {
    message: 'placa debe tener formato ABC123 o ABC12D',
  })
  placa!: string;

  @IsOptional()
  @IsEnum(TipoVehiculo)
  tipoVehiculo?: TipoVehiculo;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  tiempoMaxHoras?: number;
}
