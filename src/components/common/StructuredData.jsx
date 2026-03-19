import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Structured Data Component
 * Adds Schema.org JSON-LD markup for SEO
 */
const StructuredData = () => {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Zabely",
        "url": "https://zabely.ht",
        "logo": "https://zabely.ht/logo-zabely.png",
        "description": "La première plateforme e-commerce en Haïti. Achetez et vendez en toute sécurité avec Zabely Pay.",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "HT",
            "addressLocality": "Port-au-Prince"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+509-3424-2424",
            "contactType": "customer service",
            "availableLanguage": ["fr", "ht", "en"]
        },
        "sameAs": [
            "https://facebook.com/zabelyht",
            "https://twitter.com/zabelyht",
            "https://instagram.com/zabelyht"
        ]
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Zabely",
        "url": "https://zabely.ht",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://zabely.ht/catalog?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(websiteSchema)}
            </script>
        </Helmet>
    );
};

export default StructuredData;
