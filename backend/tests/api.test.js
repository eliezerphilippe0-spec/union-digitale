/**
 * Union Digitale - API Tests
 */

const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
  test('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Products API', () => {
  test('GET /api/products returns products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('GET /api/products with pagination', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination.limit).toBe(5);
  });

  test('GET /api/products/:id returns 404 for invalid id', async () => {
    const res = await request(app).get('/api/products/invalid-id-123');
    expect(res.statusCode).toBe(404);
  });

  test('GET /api/products with search', async () => {
    const res = await request(app).get('/api/products?search=iPhone');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('products');
  });
});

describe('Categories API', () => {
  test('GET /api/categories returns categories object', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });
});

describe('Auth API', () => {
  test('POST /api/auth/login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@test.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login with valid credentials returns accessToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@demo.ht', password: 'Buyer123!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
  });

  test('POST /api/auth/register validates email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: 'Test123!', name: 'Test' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/register validates password strength', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123', name: 'Test' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Authentication Flow', () => {
  test('Login returns tokens that can be used', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@demo.ht', password: 'Buyer123!' });
    
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    
    // Use token
    const token = loginRes.body.accessToken;
    const ordersRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    // Should not be 401 (authenticated)
    expect(ordersRes.statusCode).not.toBe(401);
  });

  test('Request without token is rejected', async () => {
    const res = await request(app).get('/api/cart');
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe('Stores API', () => {
  test('GET /api/stores returns stores list', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.statusCode).toBe(200);
  });
});

describe('Rate Limiting', () => {
  test('Normal requests are allowed', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});

describe('Security Headers', () => {
  test('Response includes security headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});
