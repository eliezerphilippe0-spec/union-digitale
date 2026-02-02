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
        "url": "https://uniondigitale.com",
        "logo": "https://uniondigitale.com/logo.png",
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
        "url": "https://uniondigitale.com",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://uniondigitale.com/search?q={search_term_string}",
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
