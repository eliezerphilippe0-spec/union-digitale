const { test, expect } = require('@playwright/test');

/**
 * E2E Test Suite: Union Digitale Marketplace
 * Flow: Vendor Login → Add Product → Buyer Purchase → MonCash Split → Stock Decrement
 */

// Test Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const FIREBASE_EMULATOR = process.env.FIREBASE_EMULATOR === 'true';

// Test Users
const VENDOR_EMAIL = 'vendor-test@uniondigitale.com';
const VENDOR_PASSWORD = 'TestVendor123!';
const BUYER_EMAIL = 'buyer-test@uniondigitale.com';
const BUYER_PASSWORD = 'TestBuyer123!';

test.describe('Marketplace E2E Flow', () => {
    let vendorContext;
    let buyerContext;
    let vendorPage;
    let buyerPage;
    let productId;
    let orderId;

    test.beforeAll(async ({ browser }) => {
        // Create separate contexts for vendor and buyer
        vendorContext = await browser.newContext();
        buyerContext = await browser.newContext();

        vendorPage = await vendorContext.newPage();
        buyerPage = await buyerContext.newPage();
    });

    test.afterAll(async () => {
        await vendorContext.close();
        await buyerContext.close();
    });

    test('1. Vendor Registration and Login', async () => {
        await vendorPage.goto(`${BASE_URL}/register`);

        // Fill registration form
        await vendorPage.fill('input[name="email"]', VENDOR_EMAIL);
        await vendorPage.fill('input[name="password"]', VENDOR_PASSWORD);
        await vendorPage.fill('input[name="displayName"]', 'Test Vendor Shop');
        await vendorPage.fill('input[name="storeName"]', 'Boutique Test Haiti');
        await vendorPage.selectOption('select[name="role"]', 'seller');
        await vendorPage.fill('input[name="phoneNumber"]', '+50912345678');

        // Submit registration
        await vendorPage.click('button[type="submit"]');

        // Wait for redirect to dashboard or login
        await vendorPage.waitForURL(/\/(dashboard|login|seller)/, { timeout: 10000 });

        // Verify vendor is logged in
        const isLoggedIn = await vendorPage.locator('text=Tableau de Bord').isVisible({ timeout: 5000 })
            .catch(() => false);

        if (!isLoggedIn) {
            // Login if registration redirected to login page
            await vendorPage.goto(`${BASE_URL}/login`);
            await vendorPage.fill('input[name="email"]', VENDOR_EMAIL);
            await vendorPage.fill('input[name="password"]', VENDOR_PASSWORD);
            await vendorPage.click('button[type="submit"]');
            await vendorPage.waitForURL(/\/dashboard|seller/, { timeout: 10000 });
        }

        expect(await vendorPage.title()).toContain('Union Digitale');
    });

    test('2. Vendor Adds Product', async () => {
        // Navigate to Add Product page
        await vendorPage.goto(`${BASE_URL}/seller/add-product`);

        // Fill product form
        await vendorPage.fill('input[name="name"]', 'Test Product - Laptop Haiti');
        await vendorPage.fill('textarea[name="description"]', 'High-quality laptop for professionals in Haiti');
        await vendorPage.fill('input[name="price"]', '25000'); // 25,000 HTG
        await vendorPage.fill('input[name="stock"]', '10');
        await vendorPage.selectOption('select[name="category"]', 'electronics');
        await vendorPage.selectOption('select[name="country"]', 'HT');

        // Upload product image (if file input exists)
        const fileInput = vendorPage.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles('./tests/fixtures/test-product.jpg');
        }

        // Submit product
        await vendorPage.click('button[type="submit"]');

        // Wait for success message or redirect
        await vendorPage.waitForSelector('text=/Product added|Produit ajouté/i', { timeout: 10000 });

        // Get product ID from URL or response
        const url = vendorPage.url();
        const match = url.match(/product[s]?\/([a-zA-Z0-9-_]+)/);
        if (match) {
            productId = match[1];
            console.log('✅ Product created with ID:', productId);
        }

        expect(productId).toBeTruthy();
    });

    test('3. Verify Product in Stock Dashboard', async () => {
        await vendorPage.goto(`${BASE_URL}/seller/stock-dashboard`);

        // Wait for products to load
        await vendorPage.waitForSelector('table tbody tr', { timeout: 10000 });

        // Verify product appears in dashboard
        const productRow = vendorPage.locator(`text="Test Product - Laptop Haiti"`);
        await expect(productRow).toBeVisible();

        // Verify stock count
        const stockCell = vendorPage.locator('tr:has-text("Test Product - Laptop Haiti") td:has-text("10")');
        await expect(stockCell).toBeVisible();

        console.log('✅ Product visible in stock dashboard');
    });

    test('4. Buyer Registration and Login', async () => {
        await buyerPage.goto(`${BASE_URL}/register`);

        // Fill registration form
        await buyerPage.fill('input[name="email"]', BUYER_EMAIL);
        await buyerPage.fill('input[name="password"]', BUYER_PASSWORD);
        await buyerPage.fill('input[name="displayName"]', 'Test Buyer');
        await buyerPage.selectOption('select[name="role"]', 'buyer');

        // Submit registration
        await buyerPage.click('button[type="submit"]');

        // Wait for redirect
        await buyerPage.waitForURL(/\/(home|products|login)/, { timeout: 10000 });

        // Login if needed
        const isLoggedIn = await buyerPage.locator('text=/Mon Compte|Account/i').isVisible({ timeout: 5000 })
            .catch(() => false);

        if (!isLoggedIn) {
            await buyerPage.goto(`${BASE_URL}/login`);
            await buyerPage.fill('input[name="email"]', BUYER_EMAIL);
            await buyerPage.fill('input[name="password"]', BUYER_PASSWORD);
            await buyerPage.click('button[type="submit"]');
        }

        console.log('✅ Buyer logged in');
    });

    test('5. Buyer Browses and Adds Product to Cart', async () => {
        // Navigate to products page
        await buyerPage.goto(`${BASE_URL}/products`);

        // Search for test product
        const searchInput = buyerPage.locator('input[placeholder*="Search"], input[placeholder*="Rechercher"]');
        if (await searchInput.count() > 0) {
            await searchInput.fill('Test Product - Laptop Haiti');
            await buyerPage.keyboard.press('Enter');
            await buyerPage.waitForTimeout(1000);
        }

        // Click on product
        await buyerPage.click('text="Test Product - Laptop Haiti"');

        // Wait for product details page
        await buyerPage.waitForSelector('text=/25,?000|25000/', { timeout: 10000 });

        // Add to cart
        await buyerPage.click('button:has-text("Ajouter au panier"), button:has-text("Add to Cart")');

        // Wait for cart confirmation
        await buyerPage.waitForSelector('text=/Ajouté|Added to cart/i', { timeout: 5000 });

        console.log('✅ Product added to cart');
    });

    test('6. Buyer Proceeds to Checkout', async () => {
        // Navigate to cart
        await buyerPage.goto(`${BASE_URL}/cart`);

        // Verify product in cart
        await expect(buyerPage.locator('text="Test Product - Laptop Haiti"')).toBeVisible();

        // Proceed to checkout
        await buyerPage.click('button:has-text("Passer la commande"), button:has-text("Checkout")');

        // Fill shipping address (if required)
        const addressInput = buyerPage.locator('input[name="address"]');
        if (await addressInput.count() > 0) {
            await addressInput.fill('123 Rue Test, Port-au-Prince, Haiti');
        }

        // Select MonCash payment
        await buyerPage.click('text="MonCash"');

        // Submit order
        await buyerPage.click('button:has-text("Confirmer"), button:has-text("Confirm Order")');

        // Wait for order confirmation or MonCash redirect
        await buyerPage.waitForURL(/\/(order-confirmation|moncash|payment)/, { timeout: 15000 });

        // Extract order ID from URL
        const url = buyerPage.url();
        const match = url.match(/order[s]?\/([a-zA-Z0-9-_]+)/);
        if (match) {
            orderId = match[1];
            console.log('✅ Order created with ID:', orderId);
        }

        expect(orderId).toBeTruthy();
    });

    test('7. Simulate MonCash Payment Success', async () => {
        if (!FIREBASE_EMULATOR) {
            test.skip('Skipping webhook simulation - only works with emulator');
        }

        // Simulate MonCash webhook call
        const crypto = require('crypto');
        const webhookPayload = {
            type: 'payment.success',
            data: {
                orderId: orderId,
                transactionId: `MC-TEST-${Date.now()}`,
                amount: 25000,
                currency: 'HTG',
                payer: '+50912345678'
            }
        };

        // Calculate signature (use test secret)
        const secret = 'test-webhook-secret';
        const signature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(webhookPayload))
            .digest('hex');

        // Send webhook request
        const response = await fetch('http://localhost:5001/union-digitale-haiti/us-central1/moncashWebhookEnhanced', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-moncash-signature': signature
            },
            body: JSON.stringify(webhookPayload)
        });

        expect(response.status).toBe(200);
        console.log('✅ MonCash webhook processed');

        // Wait for webhook processing
        await buyerPage.waitForTimeout(3000);
    });

    test('8. Verify Commission Split (15% Platform / 85% Vendor)', async () => {
        if (!FIREBASE_EMULATOR) {
            test.skip('Skipping Firestore verification - only works with emulator');
        }

        const admin = require('firebase-admin');
        const db = admin.firestore();

        // Get vendor ID from vendor page context
        const vendorId = await vendorPage.evaluate(() => {
            return localStorage.getItem('userId') || sessionStorage.getItem('userId');
        });

        // Check vendor balance
        const balanceDoc = await db.collection('balances').doc(vendorId).get();
        const balance = balanceDoc.data();

        // Expected: 25,000 * 0.85 = 21,250 HTG
        expect(balance.available).toBe(21250);
        expect(balance.total).toBe(21250);

        console.log('✅ Vendor balance: 21,250 HTG (85%)');

        // Check platform revenue
        const revenueSnapshot = await db.collection('platform_revenue')
            .where('orderId', '==', orderId)
            .limit(1)
            .get();

        expect(revenueSnapshot.empty).toBe(false);
        const revenue = revenueSnapshot.docs[0].data();

        // Expected: 25,000 * 0.15 = 3,750 HTG
        expect(revenue.amount).toBe(3750);

        console.log('✅ Platform revenue: 3,750 HTG (15%)');
    });

    test('9. Verify Stock Decrement', async () => {
        // Refresh vendor stock dashboard
        await vendorPage.goto(`${BASE_URL}/seller/stock-dashboard`);
        await vendorPage.waitForTimeout(2000); // Wait for real-time update

        // Verify stock decreased from 10 to 9
        const stockCell = vendorPage.locator('tr:has-text("Test Product - Laptop Haiti") td:has-text("9")');
        await expect(stockCell).toBeVisible({ timeout: 10000 });

        console.log('✅ Stock decremented: 10 → 9');
    });

    test('10. Verify Real-time Stock Update Speed', async () => {
        if (!FIREBASE_EMULATOR) {
            test.skip('Skipping real-time test - only works with emulator');
        }

        const admin = require('firebase-admin');
        const db = admin.firestore();

        // Update stock directly in Firestore
        const startTime = Date.now();

        await db.collection('products').doc(productId).update({
            stock: 5
        });

        // Wait for UI to update
        await vendorPage.waitForSelector('tr:has-text("Test Product - Laptop Haiti") td:has-text("5")', {
            timeout: 5000
        });

        const updateTime = Date.now() - startTime;

        console.log(`✅ Real-time update latency: ${updateTime}ms`);
        expect(updateTime).toBeLessThan(2000); // Should be < 2 seconds
    });

    test('11. Buyer Verifies Order Confirmation', async () => {
        // Navigate to order history
        await buyerPage.goto(`${BASE_URL}/orders`);

        // Verify order appears
        await expect(buyerPage.locator(`text="${orderId}"`)).toBeVisible({ timeout: 10000 });

        // Verify order status is "paid"
        const statusBadge = buyerPage.locator(`tr:has-text("${orderId}") text=/Payé|Paid/i`);
        await expect(statusBadge).toBeVisible();

        console.log('✅ Order confirmed in buyer history');
    });
});

// Performance Tests
test.describe('Performance Tests', () => {
    test('Lighthouse Mobile Score > 90', async ({ page }) => {
        const { playAudit } = require('playwright-lighthouse');

        await page.goto(BASE_URL);

        const report = await playAudit({
            page,
            thresholds: {
                performance: 90,
                accessibility: 90,
                'best-practices': 90,
                seo: 90
            },
            port: 9222
        });

        expect(report.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(90);
        console.log('✅ Lighthouse Performance:', report.lhr.categories.performance.score * 100);
    });
});
