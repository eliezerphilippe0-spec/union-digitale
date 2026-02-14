import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, type = 'website' }) => {
    const siteTitle = 'Union Digitale - Le Futur du E-commerce en Haïti';
    const finalTitle = title ? `${title} | Union Digitale` : siteTitle;
    const defaultDescription = 'Découvrez Union Digitale, la première plateforme e-commerce en Haïti proposant des produits physiques et digitaux, livraison rapide et paiements sécurisés.';
    const finalDescription = description || defaultDescription;
    const finalImage = image || '/logo-ud-horizontal.svg';
    const finalUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={finalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:site_name" content="Union Digitale" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={finalImage} />
        </Helmet>
    );
};

export default SEO;
