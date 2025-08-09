import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Roles: Admin only
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Administrator' },
  });

  console.log('✅ Role Admin ensured');

  // Admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pesenin.app' },
    update: {},
    create: {
      email: 'admin@pesenin.app',
      password: hashedPassword,
      firstName: 'Pesenin',
      lastName: 'Admin',
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created/ensured');

  // Materials
  const materials = await prisma.material.createMany({
    data: [
      { name: 'Chicken Breast', quantity: 10, unit: 'kg', expiryDate: new Date(Date.now() + 7*86400000), lowStockThreshold: 3 },
      { name: 'Mentai Sauce', quantity: 5, unit: 'kg', expiryDate: new Date(Date.now() + 10*86400000), lowStockThreshold: 2 },
      { name: 'Nori Sheets', quantity: 100, unit: 'pcs', expiryDate: new Date(Date.now() + 30*86400000), lowStockThreshold: 20 },
      { name: 'Rice', quantity: 20, unit: 'kg', expiryDate: new Date(Date.now() + 60*86400000), lowStockThreshold: 5 },
    ],
  });

  console.log('✅ Materials seeded');

  // Fetch materials for ids
  const materialList = await prisma.material.findMany();

  // Products
  const dimsum = await prisma.product.upsert({
    where: { id: 'dimsum-placeholder-id' },
    update: {},
    create: { name: 'Dimsum Mentai' },
  });

  // Replace upsert by re-fetching created id
  const product = await prisma.product.findFirst({ where: { name: 'Dimsum Mentai' } });
  if (!product) {
    throw new Error('Failed to seed product');
  }

  // BOM for product
  await prisma.bOMItem.createMany({
    data: [
      {
        productId: product.id,
        materialId: materialList.find((m) => m.name === 'Chicken Breast')!.id,
        quantityPerPortion: 0.15,
      },
      {
        productId: product.id,
        materialId: materialList.find((m) => m.name === 'Mentai Sauce')!.id,
        quantityPerPortion: 0.05,
      },
      {
        productId: product.id,
        materialId: materialList.find((m) => m.name === 'Nori Sheets')!.id,
        quantityPerPortion: 1,
      },
      {
        productId: product.id,
        materialId: materialList.find((m) => m.name === 'Rice')!.id,
        quantityPerPortion: 0.2,
      },
    ],
  });

  console.log('✅ Product and BOM seeded');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });