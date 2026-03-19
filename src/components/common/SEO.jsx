import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for Zabely
 * Supports:
 * - Standard metadata (title, description, keywords)
 * - Open Graph (Facebook/WhatsApp)
 * - Twitter Card
 * - AI-generated metadata override (aiMeta prop)
 * - JSON-LD Schema.org structured data (schema prop)
 */
const SEO = ({ title, description, keywords, image, url, type = 'website', aiMeta = null, schema = null }) => {
    const siteTitle = 'Zabely - Le Futur du E-commerce en Haïti';

    // AI-generated metadata takes priority when available
    const finalTitle = aiMeta?.title || (title ? `${title} | Zabely` : siteTitle);
    const defaultDescription = 'Découvrez Zabely, la première plateforme e-commerce en Haïti proposant des produits physiques et digitaux, livraison rapide et paiements sécurisés.';
    const finalDescription = aiMeta?.description || description || defaultDescription;
    const finalKeywords = aiMeta?.keywords || keywords || 'zabely, e-commerce haiti, marketplace haiti, moncash, natcash';
    const finalImage = image || '/logo-ud-horizontal.svg';
    const finalUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <link rel="canonical" href={finalUrl} />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:site_name" content="Zabely" />
            <meta property="og:locale" content="fr_HT" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@ZabelyHT" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={finalImage} />

            {/* JSON-LD Schema.org for Google Rich Snippets */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
