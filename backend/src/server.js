/**
 * Union Digitale - Server Entry Point
 */

const app = require('./app');
const config = require('./config');
const prisma = require('./lib/prisma');
const cron = require('node-cron');
const { runWeeklyPayoutBatch } = require('./jobs/payoutBatch');

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Schedule points maintenance (every 6 hours)
    const { run } = require('./jobs/pointsMaintenance');
    setInterval(run, 6 * 60 * 60 * 1000);

    // Weekly payout batch (Monday 09:00 server time)
    cron.schedule('0 9 * * 1', async () => {
      try {
        await runWeeklyPayoutBatch({ dryRun: false });
      } catch (error) {
        console.error('Payout batch cron error:', error);
      }
    });

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
