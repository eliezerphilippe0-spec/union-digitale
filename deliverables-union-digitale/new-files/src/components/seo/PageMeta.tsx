import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  noindex?: boolean;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
}

const SITE_NAME = 'Union Digitale';
const BASE_URL = 'https://uniondigitale.ht';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;
const DEFAULT_LOCALE = 'fr_HT';

/**
 * PageMeta — Composant SEO universel
 * - Open Graph complet (Facebook, WhatsApp, Messenger)
 * - Twitter Cards
 * - JSON-LD Organization schema
 * - og:locale haïtien (ht_HT / fr_HT)
 * - Optimisé pour partage WhatsApp (diaspora haïtienne)
 */
export const PageMeta: React.FC<PageMetaProps> = ({
  title,
  description,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  locale = DEFAULT_LOCALE,
  noindex = false,
  keywords = [],
  structuredData,
}) => {
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Union Digitale',
    description: 'Marketplace haïtien — MonCash, NatCash, Stripe, PayPal',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['French', 'Haitian Creole'],
    },
    sameAs: [
      'https://facebook.com/uniondigitale',
      'https://instagram.com/uniondigitale',
    ],
  };

  const defaultKeywords = [
    'marketplace haïtien',
    'e-commerce Haïti',
    'MonCash',
    'NatCash',
    'acheter en ligne Haïti',
    'platfòm ayisyen',
    ...keywords,
  ];

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {defaultKeywords.length > 0 && (
        <meta name="keywords" content={defaultKeywords.join(', ')} />
      )}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="ht_HT" />
      <meta property="og:locale:alternate" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@uniondigitale" />

      {/* WhatsApp preview optimization */}
      <meta property="og:image:secure_url" content={image} />

      {/* Geo tags for Haiti */}
      <meta name="geo.region" content="HT" />
      <meta name="geo.country" content="Haïti" />
      <meta name="language" content="fr, ht" />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || organizationSchema)}
      </script>
    </Helmet>
  );
};

export default PageMeta;
