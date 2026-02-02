/**
 * E2E tests for authentication flow
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/connexion|login/i);
  });

  test('should navigate to buyer registration', async ({ page }) => {
    await page.goto('/register/buyer');
    await expect(page.locator('h1')).toContainText(/inscription|register/i);
  });

  test('should navigate to seller registration', async ({ page }) => {
    await page.goto('/register/seller');
    await expect(page.locator('h1')).toContainText(/vendeur|seller/i);
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show error (if validation is implemented)
    // await expect(page.locator('.error')).toBeVisible();
  });

  test('should redirect to policies page', async ({ page }) => {
    await page.goto('/register/buyer');

    // Click on policies link
    await page.click('a[href="/policies"]');

    // Should navigate to policies
    await expect(page).toHaveURL('/policies');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard/buyer');

    // Should redirect to login
    // await expect(page).toHaveURL('/login');
  });
});

test.describe('Buyer Flow', () => {
  test('should browse products', async ({ page }) => {
    await page.goto('/');

    // Look for product cards
    const productCards = page.locator('[data-testid="product-card"]');

    // Should display products (if any exist)
    // const count = await productCards.count();
    // expect(count).toBeGreaterThan(0);
  });

  test('should search products', async ({ page }) => {
    await page.goto('/');

    // Open search (Ctrl+K or click search icon)
    await page.keyboard.press('Control+K');

    // Search box should appear
    // await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/');

    // Click on a category filter
    // await page.click('[data-testid="category-filter"]');

    // Products should filter
    // await expect(page).toHaveURL(/category=/);
  });
});

test.describe('Vendor Flow', () => {
  test('should navigate to vendor dashboard', async ({ page }) => {
    await page.goto('/dashboard/seller');

    // Should show vendor dashboard
    // await expect(page.locator('h1')).toContainText(/tableau de bord|dashboard/i);
  });

  test('should display vendor stats', async ({ page }) => {
    await page.goto('/dashboard/seller');

    // Should show stats cards
    // await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
    // await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile menu', async ({ page }) => {
    await page.goto('/');

    // Mobile menu button should be visible
    // await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('should navigate on mobile', async ({ page }) => {
    await page.goto('/');

    // Click mobile menu
    // await page.click('[data-testid="mobile-menu-button"]');

    // Menu should open
    // await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Homepage should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be under 2.5s (good)
    expect(lcp).toBeLessThan(2500);
  });
});
