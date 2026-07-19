// Seed idempotente: usuario admin + zonas de parqueadero de ejemplo.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || 'admin1234',
    10,
  );
  await prisma.usuario.upsert({
    where: { email: 'admin@clubcampina.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@clubcampina.com',
      passwordHash,
      rol: 'ADMIN',
    },
  });
  await prisma.usuario.upsert({
    where: { email: 'operador@clubcampina.com' },
    update: {},
    create: {
      nombre: 'Operador Portería',
      email: 'operador@clubcampina.com',
      passwordHash,
      rol: 'OPERADOR',
    },
  });

  const zonas = [
    ...['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06'].map((codigo) => ({
      codigo,
      tipo: 'GENERAL',
    })),
    { codigo: 'V-01', tipo: 'VIP' },
    { codigo: 'V-02', tipo: 'VIP' },
    { codigo: 'D-01', tipo: 'DISCAPACITADOS' },
    { codigo: 'M-01', tipo: 'MOTOS' },
    { codigo: 'M-02', tipo: 'MOTOS' },
    { codigo: 'M-03', tipo: 'MOTOS' },
  ];
  for (const zona of zonas) {
    await prisma.zonaParqueadero.upsert({
      where: { codigo: zona.codigo },
      update: {},
      create: zona,
    });
  }
  console.log('Seed completado: 2 usuarios, %d zonas', zonas.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
