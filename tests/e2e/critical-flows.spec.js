// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Test Suite - Union Digitale
 * Tests critiques pour validation pré-publication
 */

test.describe('Flow Acheteur Complet', () => {

    test('Parcourir catalogue et ajouter au panier', async ({ page }) => {
        // Navigation vers la page d'accueil
        await page.goto('http://localhost:5173');

        // Vérifier que la page charge
        await expect(page).toHaveTitle(/Union Digitale/);

        // Cliquer sur "Catalogue"
        await page.click('a[href="/catalog"]');
        await page.waitForLoadState('networkidle');

        // Vérifier que des produits sont affichés
        const productCards = page.locator('[data-testid="product-card"]');
        await expect(productCards.first()).toBeVisible();

        // Cliquer sur le premier produit
        await productCards.first().click();
        await page.waitForLoadState('networkidle');

        // Ajouter au panier
        await page.click('button:has-text("Ajouter au panier")');

        // Vérifier notification de succès
        await expect(page.locator('text=Ajouté au panier')).toBeVisible({ timeout: 5000 });

        // Vérifier que le badge du panier est mis à jour
        const cartBadge = page.locator('[data-testid="cart-badge"]');
        await expect(cartBadge).toHaveText('1');
    });

    test('Processus de checkout complet', async ({ page }) => {
        // Pré-requis : Ajouter un produit au panier
        await page.goto('http://localhost:5173/catalog');
        await page.click('[data-testid="product-card"]:first-child');
        await page.click('button:has-text("Ajouter au panier")');

        // Aller au panier
        await page.click('[data-testid="cart-icon"]');
        await page.waitForLoadState('networkidle');

        // Vérifier que le produit est dans le panier
        await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

        // Procéder au checkout
        await page.click('button:has-text("Procéder au paiement")');
        await page.waitForLoadState('networkidle');

        // Remplir les informations de livraison
        await page.fill('input[name="fullName"]', 'Test User');
        await page.fill('input[name="phone"]', '+50912345678');
        await page.fill('input[name="address"]', '123 Rue Test, Port-au-Prince');

        // Sélectionner MonCash comme méthode de paiement
        await page.click('input[value="moncash"]');

        // Valider la commande
        await page.click('button:has-text("Confirmer la commande")');

        // Vérifier redirection vers page de confirmation
        await expect(page).toHaveURL(/order-confirmation/, { timeout: 10000 });
        await expect(page.locator('text=Commande confirmée')).toBeVisible();
    });

    test('Vérifier stock en temps réel', async ({ page, context }) => {
        // Ouvrir deux onglets
        const page1 = page;
        const page2 = await context.newPage();

        // Les deux pages vont sur le même produit
        await page1.goto('http://localhost:5173/product/test-product-id');
        await page2.goto('http://localhost:5173/product/test-product-id');

        // Noter le stock initial
        const initialStock = await page1.locator('[data-testid="stock-count"]').textContent();

        // Page 1 : Ajouter au panier et acheter
        await page1.click('button:has-text("Ajouter au panier")');
        // ... (processus d'achat complet)

        // Page 2 : Vérifier que le stock a diminué (< 2 secondes)
        await page2.waitForTimeout(2000);
        const updatedStock = await page2.locator('[data-testid="stock-count"]').textContent();

        expect(parseInt(updatedStock)).toBeLessThan(parseInt(initialStock));
    });
});

test.describe('Flow Vendeur', () => {

    test.beforeEach(async ({ page }) => {
        // Login en tant que vendeur
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'seller@test.com');
        await page.fill('input[name="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
    });

    test('Ajouter un nouveau produit', async ({ page }) => {
        // Aller au dashboard vendeur
        await page.goto('http://localhost:5173/seller/dashboard');

        // Cliquer sur "Ajouter un produit"
        await page.click('a[href="/seller/products/new"]');
        await page.waitForLoadState('networkidle');

        // Remplir le formulaire
        await page.fill('input[name="name"]', 'Produit Test E2E');
        await page.fill('textarea[name="description"]', 'Description du produit test');
        await page.fill('input[name="price"]', '1500');
        await page.fill('input[name="stock"]', '10');

        // Sélectionner une catégorie
        await page.selectOption('select[name="category"]', 'high_tech');

        // Upload d'image (mock)
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data')
        });

        // Soumettre le formulaire
        await page.click('button[type="submit"]');

        // Vérifier la notification de succès
        await expect(page.locator('text=Produit ajouté avec succès')).toBeVisible({ timeout: 5000 });

        // Vérifier redirection vers le dashboard
        await expect(page).toHaveURL(/seller\/dashboard/);
    });

    test('Vérifier commission sur vente', async ({ page }) => {
        // Simuler une vente de 25,000 HTG
        const saleAmount = 25000;
        const expectedVendorCommission = saleAmount * 0.85; // 21,250 HTG
        const expectedPlatformCommission = saleAmount * 0.15; // 3,750 HTG

        // Aller à la page des transactions
        await page.goto('http://localhost:5173/seller/dashboard');
        await page.click('a:has-text("Transactions")');

        // Vérifier la dernière transaction
        const lastTransaction = page.locator('[data-testid="transaction-row"]:first-child');

        // Vérifier le montant vendeur
        const vendorAmount = await lastTransaction.locator('[data-testid="vendor-amount"]').textContent();
        expect(vendorAmount).toContain(expectedVendorCommission.toLocaleString());

        // Vérifier la commission plateforme
        const platformFee = await lastTransaction.locator('[data-testid="platform-fee"]').textContent();
        expect(platformFee).toContain(expectedPlatformCommission.toLocaleString());
    });
});

test.describe('MonCash Sandbox', () => {

    test('Transaction MonCash complète', async ({ page }) => {
        // Ajouter un produit au panier
        await page.goto('http://localhost:5173/catalog');
        await page.click('[data-testid="product-card"]:first-child');
        await page.click('button:has-text("Ajouter au panier")');

        // Checkout
        await page.click('[data-testid="cart-icon"]');
        await page.click('button:has-text("Procéder au paiement")');

        // Remplir les infos
        await page.fill('input[name="fullName"]', 'MonCash Test');
        await page.fill('input[name="phone"]', '+50912345678');
        await page.fill('input[name="address"]', 'Test Address');

        // Sélectionner MonCash
        await page.click('input[value="moncash"]');
        await page.click('button:has-text("Confirmer la commande")');

        // Attendre redirection vers MonCash (sandbox)
        await page.waitForURL(/moncash/, { timeout: 10000 });

        // Simuler paiement sandbox
        await page.fill('input[name="phone"]', '50912345678');
        await page.fill('input[name="pin"]', '1234');
        await page.click('button:has-text("Payer")');

        // Vérifier retour sur le site
        await expect(page).toHaveURL(/order-confirmation/, { timeout: 15000 });
        await expect(page.locator('text=Paiement réussi')).toBeVisible();
    });

    test('Prévention des transactions dupliquées', async ({ page }) => {
        // Créer une commande
        const orderId = 'test-order-' + Date.now();

        // Tenter de payer deux fois
        await page.goto(`http://localhost:5173/checkout?orderId=${orderId}`);
        await page.click('button:has-text("Confirmer la commande")');

        // Attendre la première transaction
        await page.waitForTimeout(2000);

        // Tenter une deuxième fois
        await page.goto(`http://localhost:5173/checkout?orderId=${orderId}`);
        await page.click('button:has-text("Confirmer la commande")');

        // Vérifier message d'erreur
        await expect(page.locator('text=Transaction déjà en cours')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Performance & SEO', () => {

    test('Lighthouse Mobile Score @lighthouse', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Playwright Lighthouse plugin requis
        // npm install -D playwright-lighthouse
        const { playAudit } = require('playwright-lighthouse');

        await playAudit({
            page,
            thresholds: {
                performance: 90,
                accessibility: 90,
                'best-practices': 90,
                seo: 90,
            },
            port: 9222,
        });
    });

    test('Vérifier meta tags SEO', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Vérifier title
        await expect(page).toHaveTitle(/Union Digitale/);

        // Vérifier meta description
        const metaDescription = page.locator('meta[name="description"]');
        await expect(metaDescription).toHaveAttribute('content', /.+/);

        // Vérifier OpenGraph
        const ogTitle = page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveAttribute('content', /.+/);
    });
});
