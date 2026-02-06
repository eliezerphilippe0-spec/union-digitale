/**
 * Union Digitale - Server Entry Point
 */

const app = require('./app');
const config = require('./config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server
    app.listen(config.PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║     🚀 Union Digitale API Server          ║
╠════════════════════════════════════════════╣
║  Port: ${config.PORT}                              ║
║  Mode: ${config.NODE_ENV.padEnd(11)}                    ║
║  URL:  http://localhost:${config.PORT}              ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
