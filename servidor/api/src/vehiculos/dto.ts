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
  // Ecuador: ABC1234 (3 letras + 4 dígitos) · Colombia: ABC123/ABC12D (3+3);
  // se normaliza a mayúsculas sin espacios/guiones antes de validar
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/[\s-]/g, '')
      : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}([0-9]{4}|[0-9]{2}[0-9A-Z])$/, {
    message: 'placa debe tener formato ABC1234 (Ecuador) o ABC123/ABC12D (Colombia)',
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
