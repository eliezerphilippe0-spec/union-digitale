/**
 * Database Seed Script
 * Run: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Électronique',
        slug: 'electronics',
        description: 'Téléphones, ordinateurs, accessoires',
        icon: '📱',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: {
        name: 'Mode',
        slug: 'fashion',
        description: 'Vêtements, chaussures, accessoires',
        icon: '👗',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home' },
      update: {},
      create: {
        name: 'Maison',
        slug: 'home',
        description: 'Meubles, décoration, électroménager',
        icon: '🏠',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'local' },
      update: {},
      create: {
        name: 'Produits Locaux',
        slug: 'local',
        description: 'Artisanat haïtien, produits locaux',
        icon: '🇭🇹',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: {
        name: 'Beauté',
        slug: 'beauty',
        description: 'Cosmétiques, soins, parfums',
        icon: '💄',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'food' },
      update: {},
      create: {
        name: 'Alimentation',
        slug: 'food',
        description: 'Épicerie, boissons, produits frais',
        icon: '🍎',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Sports',
        slug: 'sports',
        description: 'Équipements sportifs, fitness',
        icon: '⚽',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'energy' },
      update: {},
      create: {
        name: 'Énergie & Solaire',
        slug: 'energy',
        description: 'Panneaux solaires, batteries, onduleurs',
        icon: '⚡',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uniondigitale.ht' },
    update: {},
    create: {
      email: 'admin@uniondigitale.ht',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Union',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log('✅ Created admin user: admin@uniondigitale.ht');

  // Create demo seller
  const sellerPassword = await bcrypt.hash('Seller123!', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@demo.ht' },
    update: {},
    create: {
      email: 'seller@demo.ht',
      phone: '+50937001234',
      passwordHash: sellerPassword,
      firstName: 'Jean',
      lastName: 'Pierre',
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Create seller's store
  const store = await prisma.store.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      name: 'Tech Haiti',
      slug: 'tech-haiti',
      description: 'La meilleure boutique tech en Haïti',
      status: 'ACTIVE',
      isVerified: true,
      city: 'Port-au-Prince',
      department: 'Ouest',
      rating: 4.8,
    },
  });
  console.log('✅ Created demo seller and store');

  // Create demo products
  const products = [
    {
      title: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Le dernier iPhone avec puce A17 Pro',
      shortDescription: 'iPhone 15 Pro Max 256GB',
      price: 125000,
      comparePrice: 140000,
      stock: 10,
      images: ['📱'],
      brand: 'Apple',
      categoryId: categories[0].id,
      isFeatured: true,
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Le flagship Samsung avec S Pen',
      shortDescription: 'Galaxy S24 Ultra 512GB',
      price: 115000,
      stock: 15,
      images: ['📱'],
      brand: 'Samsung',
      categoryId: categories[0].id,
      isFeatured: true,
    },
    {
      title: 'MacBook Pro M3',
      slug: 'macbook-pro-m3',
      description: 'MacBook Pro avec puce M3 Pro',
      shortDescription: 'MacBook Pro 14" M3 Pro',
      price: 250000,
      stock: 5,
      images: ['💻'],
      brand: 'Apple',
      categoryId: categories[0].id,
    },
    {
      title: 'Panneau Solaire 400W',
      slug: 'panneau-solaire-400w',
      description: 'Panneau solaire haute efficacité',
      shortDescription: 'Panneau monocristallin 400W',
      price: 35000,
      stock: 50,
      images: ['☀️'],
      brand: 'SolarMax',
      categoryId: categories[7].id,
      isFeatured: true,
    },
    {
      title: 'Robe Traditionnelle Haïtienne',
      slug: 'robe-traditionnelle-haitienne',
      description: 'Magnifique robe avec motifs traditionnels',
      shortDescription: 'Robe karabela',
      price: 5000,
      stock: 20,
      images: ['👗'],
      categoryId: categories[3].id,
    },
    {
      title: 'Café Haïtien Premium',
      slug: 'cafe-haitien-premium',
      description: 'Café 100% arabica des montagnes haïtiennes',
      shortDescription: 'Café moulu 500g',
      price: 800,
      stock: 100,
      images: ['☕'],
      categoryId: categories[3].id,
      isFeatured: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        storeId: store.id,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✅ Created ${products.length} demo products`);

  // Create demo buyer
  const buyerPassword = await bcrypt.hash('Buyer123!', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.ht' },
    update: {},
    create: {
      email: 'buyer@demo.ht',
      phone: '+50938001234',
      passwordHash: buyerPassword,
      firstName: 'Marie',
      lastName: 'Joseph',
      role: 'BUYER',
      status: 'ACTIVE',
      loyaltyPoints: 500,
      loyaltyTier: 'silver',
    },
  });

  // Create address for buyer
  await prisma.address.upsert({
    where: { id: 'demo-address' },
    update: {},
    create: {
      id: 'demo-address',
      userId: buyer.id,
      label: 'Maison',
      fullName: 'Marie Joseph',
      phone: '+50938001234',
      street: '123 Rue Capois',
      city: 'Port-au-Prince',
      department: 'Ouest',
      isDefault: true,
    },
  });
  console.log('✅ Created demo buyer with address');

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:  admin@uniondigitale.ht / Admin123!');
  console.log('  Seller: seller@demo.ht / Seller123!');
  console.log('  Buyer:  buyer@demo.ht / Buyer123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
