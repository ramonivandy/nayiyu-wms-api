import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Warehouse Manager' },
      update: {},
      create: {
        name: 'Warehouse Manager',
        description: 'Manages warehouse operations, inventory, and staff',
      },
    }),
    prisma.role.upsert({
      where: { name: 'Picker' },
      update: {},
      create: {
        name: 'Picker',
        description: 'Picks and packs orders for shipment',
      },
    }),
  ]);

  console.log('✅ Roles created');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@nexuswms.com' },
      update: {},
      create: {
        email: 'admin@nexuswms.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        roleId: roles[0].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'william@nexuswms.com' },
      update: {},
      create: {
        email: 'william@nexuswms.com',
        password: hashedPassword,
        firstName: 'William',
        lastName: 'Manager',
        roleId: roles[1].id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'peter@nexuswms.com' },
      update: {},
      create: {
        email: 'peter@nexuswms.com',
        password: hashedPassword,
        firstName: 'Peter',
        lastName: 'Picker',
        roleId: roles[2].id,
      },
    }),
  ]);

  console.log('✅ Users created');

  // Create bin locations
  const binLocations = [];
  const zones = ['A', 'B', 'C'];
  const aisles = ['01', '02', '03'];
  const racks = ['1', '2', '3'];
  const shelves = ['A', 'B', 'C'];
  const bins = ['1', '2', '3'];

  for (const zone of zones) {
    for (const aisle of aisles) {
      for (const rack of racks) {
        for (const shelf of shelves) {
          for (const bin of bins) {
            const code = `${zone}-${aisle}-${rack}-${shelf}-${bin}`;
            binLocations.push(
              await prisma.binLocation.upsert({
                where: { code },
                update: {},
                create: {
                  code,
                  zone,
                  aisle,
                  rack,
                  shelf,
                  bin,
                  capacity: 100,
                },
              })
            );
          }
        }
      }
    }
  }

  console.log(`✅ ${binLocations.length} bin locations created`);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'LAPTOP-001' },
      update: {},
      create: {
        sku: 'LAPTOP-001',
        barcode: '1234567890123',
        name: 'Business Laptop Pro',
        description: '15-inch business laptop with Intel i7 processor',
        unitOfMeasure: 'EACH',
        weight: 2.5,
        dimensions: { length: 35, width: 25, height: 2 },
        category: 'Electronics',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'MOUSE-002' },
      update: {},
      create: {
        sku: 'MOUSE-002',
        barcode: '2345678901234',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        unitOfMeasure: 'EACH',
        weight: 0.1,
        dimensions: { length: 10, width: 6, height: 4 },
        category: 'Electronics',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'KEYBOARD-003' },
      update: {},
      create: {
        sku: 'KEYBOARD-003',
        barcode: '3456789012345',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with blue switches',
        unitOfMeasure: 'EACH',
        weight: 1.2,
        dimensions: { length: 45, width: 15, height: 3 },
        category: 'Electronics',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'MONITOR-004' },
      update: {},
      create: {
        sku: 'MONITOR-004',
        barcode: '4567890123456',
        name: '27-inch Monitor',
        description: '4K UHD monitor with HDR support',
        unitOfMeasure: 'EACH',
        weight: 5.5,
        dimensions: { length: 65, width: 45, height: 20 },
        category: 'Electronics',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CABLE-005' },
      update: {},
      create: {
        sku: 'CABLE-005',
        barcode: '5678901234567',
        name: 'HDMI Cable 2m',
        description: 'High-speed HDMI cable, 2 meters',
        unitOfMeasure: 'EACH',
        weight: 0.2,
        dimensions: { length: 20, width: 10, height: 2 },
        category: 'Accessories',
      },
    }),
  ]);

  console.log('✅ Products created');

  // Create initial inventory levels
  const inventoryLevels = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    // Add inventory in 3 different locations for each product
    for (let j = 0; j < 3; j++) {
      const binLocation = binLocations[i * 3 + j];
      const quantity = Math.floor(Math.random() * 50) + 10;
      
      inventoryLevels.push(
        await prisma.inventoryLevel.upsert({
          where: {
            productId_binLocationId: {
              productId: product.id,
              binLocationId: binLocation.id,
            },
          },
          update: {},
          create: {
            productId: product.id,
            binLocationId: binLocation.id,
            quantityOnHand: quantity,
            quantityAvailable: quantity,
            quantityReserved: 0,
            lastCountDate: new Date(),
          },
        })
      );
    }
  }

  console.log(`✅ ${inventoryLevels.length} inventory levels created`);

  // Create sample picklists
  const picklists = await Promise.all([
    prisma.picklist.create({
      data: {
        orderNumber: 'ORD-2025-001',
        status: 'PENDING',
        assignedToId: users[2].id, // Peter Picker
        priority: 5,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        notes: 'Rush order for VIP customer',
        items: {
          create: [
            {
              productId: products[0].id,
              sourceBinLocationId: binLocations[0].id,
              quantityRequested: 2,
              quantityPicked: 0,
              isPicked: false,
              pickSequence: 1,
            },
            {
              productId: products[1].id,
              sourceBinLocationId: binLocations[3].id,
              quantityRequested: 4,
              quantityPicked: 0,
              isPicked: false,
              pickSequence: 2,
            },
          ],
        },
      },
    }),
    prisma.picklist.create({
      data: {
        orderNumber: 'ORD-2025-002',
        status: 'PENDING',
        assignedToId: users[2].id, // Peter Picker
        priority: 3,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
        notes: 'Standard shipment',
        items: {
          create: [
            {
              productId: products[2].id,
              sourceBinLocationId: binLocations[6].id,
              quantityRequested: 1,
              quantityPicked: 0,
              isPicked: false,
              pickSequence: 1,
            },
            {
              productId: products[3].id,
              sourceBinLocationId: binLocations[9].id,
              quantityRequested: 1,
              quantityPicked: 0,
              isPicked: false,
              pickSequence: 2,
            },
            {
              productId: products[4].id,
              sourceBinLocationId: binLocations[12].id,
              quantityRequested: 3,
              quantityPicked: 0,
              isPicked: false,
              pickSequence: 3,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Sample picklists created');

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