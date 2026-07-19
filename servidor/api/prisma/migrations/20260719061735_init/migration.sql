-- CreateEnum
CREATE TYPE "EstadoMiembro" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoMembresia" AS ENUM ('PLENA', 'FAMILIAR', 'JUVENIL', 'CORPORATIVA');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('AUTOMOVIL', 'CAMIONETA', 'MOTOCICLETA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoZona" AS ENUM ('GENERAL', 'VIP', 'DISCAPACITADOS', 'MOTOS');

-- CreateEnum
CREATE TYPE "EstadoZona" AS ENUM ('LIBRE', 'OCUPADA', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "TipoEventoAcceso" AS ENUM ('INGRESO', 'SALIDA');

-- CreateEnum
CREATE TYPE "ResultadoEvento" AS ENUM ('AUTORIZADO', 'RECHAZADO', 'ALERTA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTA');

-- CreateTable
CREATE TABLE "miembros" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento_identidad" TEXT NOT NULL,
    "tipo_membresia" "TipoMembresia" NOT NULL,
    "estado" "EstadoMiembro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "tipo" "TipoVehiculo" NOT NULL DEFAULT 'AUTOMOVIL',
    "estado" "EstadoVehiculo" NOT NULL DEFAULT 'ACTIVO',
    "miembro_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_parqueadero" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoZona" NOT NULL DEFAULT 'GENERAL',
    "estado" "EstadoZona" NOT NULL DEFAULT 'LIBRE',
    "vehiculo_actual_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_parqueadero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_acceso" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEventoAcceso" NOT NULL,
    "placa_detectada" TEXT NOT NULL,
    "confianza_ocr" DOUBLE PRECISION,
    "resultado" "ResultadoEvento" NOT NULL,
    "motivo" TEXT,
    "foto_url" TEXT,
    "vehiculo_id" TEXT,
    "zona_id" TEXT,
    "operador_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'OPERADOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "miembros_documento_identidad_key" ON "miembros"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_parqueadero_codigo_key" ON "zonas_parqueadero"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_parqueadero_vehiculo_actual_id_key" ON "zonas_parqueadero"("vehiculo_actual_id");

-- CreateIndex
CREATE INDEX "eventos_acceso_timestamp_idx" ON "eventos_acceso"("timestamp");

-- CreateIndex
CREATE INDEX "eventos_acceso_placa_detectada_idx" ON "eventos_acceso"("placa_detectada");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_miembro_id_fkey" FOREIGN KEY ("miembro_id") REFERENCES "miembros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas_parqueadero" ADD CONSTRAINT "zonas_parqueadero_vehiculo_actual_id_fkey" FOREIGN KEY ("vehiculo_actual_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas_parqueadero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
