/**
 * Union Digitale - Express Application
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./lib/prisma');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const storeRoutes = require('./routes/stores');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const payoutRoutes = require('./routes/payouts');
const uploadRoutes = require('./routes/upload');
const adminRiskRoutes = require('./routes/adminRisk');
const adminTrustRoutes = require('./routes/adminTrust');

const app = express();

// ============== MIDDLEWARE ==============

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
});
app.use('/api/', limiter);

// Stripe webhook needs raw body
app.use('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ============== ROUTES ==============

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Dynamic sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (config.FRONTEND_URL || 'https://uniondigitale.ht').replace(/\/$/, '');
    const formatDate = (date) => new Date(date || Date.now()).toISOString().split('T')[0];

    const staticRoutes = [
      '/',
      '/catalog',
      '/services',
      '/cars',
      '/real-estate',
      '/utilities',
      '/pay',
      '/learn',
      '/music',
      '/books',
      '/apps',
      '/seller/welcome',
      '/ambassador',
      '/union-plus',
      '/gift-cards',
      '/about-us',
      '/customer-service',
      '/shipping-policy',
      '/policies',
      '/careers',
      '/sustainability',
      '/best-shops'
    ];

    const [products, stores] = await Promise.all([
      prisma.product.findMany({
        where: { status: { in: ['ACTIVE', 'OUT_OF_STOCK'] } },
        select: { slug: true, updatedAt: true }
      }),
      prisma.store.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true }
      })
    ]);

    const urls = [];
    for (const path of staticRoutes) {
      urls.push(`\n  <url><loc>${baseUrl}${path}</loc><lastmod>${formatDate()}</lastmod></url>`);
    }
    for (const product of products) {
      urls.push(`\n  <url><loc>${baseUrl}/product/${product.slug}</loc><lastmod>${formatDate(product.updatedAt)}</lastmod></url>`);
    }
    for (const store of stores) {
      urls.push(`\n  <url><loc>${baseUrl}/store/${store.slug}</loc><lastmod>${formatDate(store.updatedAt)}</lastmod></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Sitemap generation error');
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRiskRoutes);
app.use('/api/admin', adminTrustRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
