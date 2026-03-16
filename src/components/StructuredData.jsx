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
        "name": "Union Digitale",
        "url": "https://uniondigitale.ht",
        "logo": "https://uniondigitale.ht/logo.png",
        "description": "La première plateforme e-commerce en Haïti. Achetez et vendez en toute sécurité avec MonCash et NatCash.",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "HT",
            "addressLocality": "Port-au-Prince"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+509-XXXX-XXXX",
            "contactType": "customer service",
            "availableLanguage": ["fr", "ht", "en"]
        },
        "sameAs": [
            "https://facebook.com/uniondigitale",
            "https://twitter.com/uniondigitale",
            "https://instagram.com/uniondigitale"
        ]
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Union Digitale",
        "url": "https://uniondigitale.ht",
        // SearchAction : active la Sitelinks Searchbox Google sur le nom de marque.
        // Target corrigé : /catalog?q= (route existante) et domaine .ht
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://uniondigitale.ht/catalog?q={search_term_string}"
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
