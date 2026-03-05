import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ProductMetaProps {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  url: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  sku?: string;
  ratingValue?: number;
  ratingCount?: number;
  category?: string;
}

const BASE_URL = 'https://uniondigitale.ht';
const SITE_NAME = 'Union Digitale';

/**
 * ProductMeta — SEO pour pages produit
 * - Product JSON-LD schema (Google Shopping ready)
 * - Open Graph avec og:price
 * - Rich snippets: prix, disponibilité, avis
 * - Optimisé partage WhatsApp avec prix HTG visible
 */
export const ProductMeta: React.FC<ProductMetaProps> = ({
  name,
  description,
  price,
  currency = 'HTG',
  image,
  url,
  availability = 'InStock',
  brand = 'Union Digitale',
  sku,
  ratingValue,
  ratingCount,
  category,
}) => {
  const fullTitle = `${name} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${url}`;
  const priceFormatted = new Intl.NumberFormat('fr-HT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: currency,
      price: price.toString(),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
  };

  if (sku) {
    (productSchema as Record<string, unknown>).sku = sku;
    (productSchema as Record<string, unknown>).mpn = sku;
  }

  if (category) {
    (productSchema as Record<string, unknown>).category = category;
  }

  if (ratingValue && ratingCount) {
    (productSchema as Record<string, unknown>).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      ratingCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  const ogDescription = `${description} — ${priceFormatted} | Livrezon disponib an Ayiti`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={ogDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Product */}
      <meta property="og:type" content="product" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="800" />
      <meta property="og:image:height" content="800" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_HT" />

      {/* Product-specific OG tags */}
      <meta property="product:price:amount" content={price.toString()} />
      <meta property="product:price:currency" content={currency} />
      <meta
        property="product:availability"
        content={availability === 'InStock' ? 'in stock' : 'out of stock'}
      />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};

export default ProductMeta;
