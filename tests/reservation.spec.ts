// tests/reservation.spec.ts
import { test, expect } from '@playwright/test';

test('create car and reserve flow', async ({ page }) => {
    // login as seller (assumes test user exists)
    await page.goto('https://your-dev-site/login'); // Changed from /seller/login
    await page.fill('input[type=email]', 'seller@test.com'); // Adjusted selector
    await page.fill('input[type=password]', 'password123'); // Adjusted selector
    await page.click('button[type=submit]');
    await page.waitForURL('**/catalog'); // Assuming redirect to catalog/home

    // go to add car page
    await page.goto('https://your-dev-site/seller/cars/new');
    await page.fill('input[placeholder="Ex: Toyota"]', 'Toyota');
    await page.fill('input[placeholder="Ex: Rav4"]', 'Corolla');
    await page.fill('input[placeholder="Ex: 2018"]', '2018');
    await page.fill('input[placeholder="Ex: 50000"]', '120000');
    await page.fill('input[placeholder="Ex: 15000"]', '2500000');
    await page.fill('input[placeholder="Ex: Pétion-Ville"]', 'Port-au-Prince');

    // simulate file upload by mocking signed-url endpoint or skipping in test env
    // click publish
    await page.click('button:has-text("Publier l\'annonce")');

    // expect redirect 
    await page.waitForURL(/\/catalog/);

    // NOTE: This test needs adapting to the actual flow (redirect to details page) and selectors if they change.
});
