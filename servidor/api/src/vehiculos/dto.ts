import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import {
  EstadoVehiculo,
  TipoVehiculo,
} from '@club-campina/shared-types';

export class CrearVehiculoDto {
  // Placas colombianas: ABC123 (autos) o ABC12D (motos); se normaliza a mayúsculas sin espacios/guiones
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
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsEnum(TipoVehiculo)
  tipo!: TipoVehiculo;

  @IsOptional()
  @IsEnum(EstadoVehiculo)
  estado?: EstadoVehiculo;

  @IsUUID()
  miembroId!: string;
}

export class ActualizarVehiculoDto extends PartialType(CrearVehiculoDto) {}
