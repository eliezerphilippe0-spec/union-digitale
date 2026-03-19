import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/**
 * Zabely AI SEO Service
 * Generates optimized SEO metadata (title, description, keywords) for any listing
 * using Google Gemini via Firebase Cloud Functions.
 */
export const seoService = {

    /**
     * Generate SEO metadata for a product / service / car / real estate listing.
     * @param {Object} listing - The product/listing object
     * @returns {Promise<{title: string, description: string, keywords: string}>}
     */
    async generateSEOMetadata(listing) {
        const { name, title, description, category, price, currency = 'G', type = 'product', shopName } = listing;
        const displayName = name || title || shopName || 'Boutique';
        const displayPrice = price ? `${price.toLocaleString()} ${currency}` : '';
        const displayCategory = category || '';

        const prompt = `Tu es un expert SEO e-commerce spécialisé pour le marché haïtien.
Génère des métadonnées SEO optimisées pour la fiche suivante sur Zabely (marketplace en Haïti).
Type de fiche : ${type}
Nom : ${displayName}
Catégorie : ${displayCategory}
Prix : ${displayPrice}
Description existante : ${description || 'Aucune'}

Réponds UNIQUEMENT en JSON valide avec ce format exact (sans commentaire) :
{
  "title": "titre SEO optimisé (60 char max, inclure Zabely et Haïti si pertinent)",
  "description": "méta-description persuasive et riche en mots-clés (150 char max)",
  "keywords": "mot1, mot2, mot3, mot4, mot5 (5-10 mots-clés séparés par des virgules)"
}`;

        try {
            const generateFn = httpsCallable(functions, 'generateAIContent');
            const result = await generateFn({ type: 'seo', promptData: { prompt } });
            const raw = result.data.text || '';
            // Extract JSON from the response
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error('No JSON in response');
        } catch (error) {
            console.warn('AI SEO Backend unavailable, using intelligent fallback.', error.message);
            // Smart fallback based on listing data
            return seoService._generateFallbackSEO(displayName, displayCategory, displayPrice, type);
        }
    },

    /**
     * Intelligent fallback SEO generator when AI backend is unavailable
     */
    _generateFallbackSEO(name, category, price, type) {
        const typeLabels = {
            product: 'produit',
            service: 'service',
            car: 'voiture à vendre',
            'real-estate': 'propriété à vendre',
            digital: 'produit digital',
            vendor: 'boutique officielle',
        };
        const typeLabel = typeLabels[type] || 'article';
        const priceStr = price ? ` - ${price}` : '';
        const categoryStr = category ? ` | ${category}` : '';

        return {
            title: `${name}${priceStr} | Zabely Haïti`,
            description: `Achetez ${name}${categoryStr} sur Zabely, la marketplace #1 en Haïti. Paiement sécurisé MonCash & NatCash. Livraison rapide.`,
            keywords: `${name}, ${category || typeLabel}, acheter en ligne haiti, zabely, moncash, marketplace haiti`,
        };
    },

    /**
     * Generate SEO-optimized schema.org JSON-LD for a product.
     * This improves rich snippets in Google Search.
     */
    generateProductSchema(product) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name || product.title,
            description: product.description,
            image: product.images?.[0] || product.image || '',
            offers: {
                '@type': 'Offer',
                priceCurrency: 'HTG',
                price: product.price || 0,
                availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: 'Zabely',
                },
            },
        };
    },

    /**
     * Generate Schema.org JSON-LD for a Store/Vendor.
     */
    generateVendorSchema(vendor) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: vendor.shopName || vendor.name,
            description: vendor.description,
            image: vendor.shopLogo || '',
            address: {
                '@type': 'PostalAddress',
                addressLocality: vendor.city || 'Port-au-Prince',
                addressCountry: 'HT',
            },
            aggregateRating: vendor.rating ? {
                '@type': 'AggregateRating',
                ratingValue: vendor.rating,
                reviewCount: vendor.reviewCount || 0,
            } : undefined,
        };
    },

    /**
     * Generate Schema.org JSON-LD for a Store/Vendor.
     */
    generateVendorSchema(vendor) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: vendor.shopName || vendor.name,
            description: vendor.description,
            image: vendor.shopLogo || '',
            address: {
                '@type': 'PostalAddress',
                addressLocality: vendor.city || 'Port-au-Prince',
                addressCountry: 'HT',
            },
            aggregateRating: vendor.rating ? {
                '@type': 'AggregateRating',
                ratingValue: vendor.rating,
                reviewCount: vendor.reviewCount || 0,
            } : undefined,
        };
    },

    /**
     * Generate Schema.org JSON-LD for a Real Estate listing.
     */
    generateRealEstateSchema(property) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Accommodation',
            name: property.title || property.name,
            description: property.description,
            image: property.images?.[0] || property.image || '',
            address: {
                '@type': 'PostalAddress',
                addressLocality: property.location || 'Haïti',
                addressCountry: 'HT',
            },
            offers: {
                '@type': 'Offer',
                price: property.price || 0,
                priceCurrency: 'HTG',
            },
            numberOfRooms: property.rooms || property.bedrooms,
        };
    },

    /**
     * Generate Schema.org JSON-LD for a Car listing.
     */
    generateCarSchema(car) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Vehicle',
            name: car.title || `${car.brand} ${car.model}`,
            description: car.description,
            image: car.images?.[0] || car.image || '',
            vehicleModel: car.model,
            manufacturer: car.brand,
            vehicleModelDate: car.year,
            offers: {
                '@type': 'Offer',
                price: car.price || 0,
                priceCurrency: 'HTG',
            },
        };
    },

    /**
     * Generate breadcrumb schema for rich snippets.
     */
    generateBreadcrumbSchema(crumbs) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: crumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: `https://zabely.com${crumb.path}`,
            })),
        };
    },
};

export default seoService;
