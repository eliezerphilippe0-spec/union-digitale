import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://uniondigitale.ht';

/**
 * Injecte les données structurées Schema.org pour une fiche produit :
 *   - Product + Offer  → active les Rich Snippets Google (prix, stock, étoiles)
 *   - BreadcrumbList   → fil d'Ariane dans les SERPs
 *
 * Compatible Google Rich Results Test :
 * https://search.google.com/test/rich-results
 */
export default function ProductSchema({ product, productId }) {
    const productUrl = `${BASE_URL}/product/${productId}`;

    // Ne garder que les vraies URLs d'images (pas les emojis des mocks)
    const imageList = (product.images || [])
        .concat(product.image ? [product.image] : [])
        .filter(img => img && (img.startsWith('http') || img.startsWith('/')));

    // Disponibilité dynamique — évite une pénalité Google pour données incorrectes
    const getAvailability = () => {
        if (product.type === 'digital') return 'https://schema.org/InStock';
        if (!product.stock || product.stock === 0) return 'https://schema.org/OutOfStock';
        if (product.stock <= 3) return 'https://schema.org/LimitedAvailability';
        return 'https://schema.org/InStock';
    };

    // priceValidUntil : requis par Google Merchant Center pour les rich snippets Shopping
    // 30 jours glissants — le recrawl de Google renouvelle automatiquement la date
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]; // format YYYY-MM-DD

    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description || product.title,
        ...(imageList.length > 0 && { image: imageList }),
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Union Digitale',
        },
        sku: String(productId),
        offers: {
            '@type': 'Offer',
            url: productUrl,
            price: product.price,
            priceCurrency: 'HTG',
            availability: getAvailability(),
            itemCondition: 'https://schema.org/NewCondition',
            priceValidUntil,
            seller: {
                '@type': 'Organization',
                name: product.brand || 'Union Digitale',
                url: BASE_URL,
            },
        },
        ...(product.rating && product.reviews && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: String(product.rating),
                reviewCount: String(product.reviews),
                bestRating: '5',
                worstRating: '1',
            },
        }),
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: BASE_URL + '/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: product.category || 'Catalogue',
                item: `${BASE_URL}/category/${encodeURIComponent(product.category || 'catalogue')}`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.title,
                item: productUrl,
            },
        ],
    };

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        </Helmet>
    );
}
