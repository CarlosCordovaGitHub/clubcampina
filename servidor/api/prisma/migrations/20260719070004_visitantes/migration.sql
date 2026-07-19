-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN     "visitante_id" TEXT,
ALTER COLUMN "miembro_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "visitantes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT,
    "tiempo_max_horas" INTEGER NOT NULL DEFAULT 4,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitantes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_visitante_id_fkey" FOREIGN KEY ("visitante_id") REFERENCES "visitantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
