import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Star,
    MapPin,
    CheckCircle,
    Package,
    TrendingUp,
    Mail,
    Phone,
    ArrowLeft,
    Filter
} from 'lucide-react';
import { getVendor, getVendorStats } from '../services/vendorService';
import { getVendorOffers } from '../services/offerService';
import OfferCard from '../components/OfferCard';
import './VendorShop.css';
import SEO from '../components/common/SEO';
import TrustBadge from '../components/common/TrustBadge';
import { getStoreTrust } from '../services/trustService';

const VendorShop = () => {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [offers, setOffers] = useState({});
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');
    const [trust, setTrust] = useState(null);

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    const loadVendorData = async () => {
        try {
            setLoading(true);
            const [vendorData, offersData, statsData] = await Promise.all([
                getVendor(vendorId),
                getVendorOffers(vendorId),
                getVendorStats(vendorId)
            ]);

            setVendor(vendorData);
            setOffers(offersData);
            setStats(statsData);

            const slug = vendorData?.storeSlug || vendorData?.shopSlug || vendorData?.slug;
            if (slug) {
                getStoreTrust(slug).then(setTrust).catch(() => {});
            }
        } catch (error) {
            console.error('Error loading vendor:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVerificationBadge = () => {
        if (!vendor?.verified) return null;

        const badges = {
            basic: { text: 'Vérifié', color: '#10b981', icon: CheckCircle },
            verified: { text: 'Vendeur Vérifié', color: '#3b82f6', icon: CheckCircle },
            premium: { text: 'Vendeur Premium', color: '#f59e0b', icon: CheckCircle }
        };

        const badge = badges[vendor.verificationLevel] || badges.basic;
        const Icon = badge.icon;

        return (
            <div className="vendor-verification" style={{ color: badge.color }}>
                <Icon size={20} />
                <span>{badge.text}</span>
            </div>
        );
    };

    const getFilteredOffers = () => {
        if (selectedType === 'all') {
            return Object.values(offers).flat();
        }
        return offers[selectedType] || [];
    };

    const offerTypes = [
        { key: 'all', label: 'Tout', count: stats?.totalOffers || 0 },
        { key: 'physical', label: 'Produits', count: stats?.offersByType?.physical || 0 },
        { key: 'digital', label: 'Digital', count: stats?.offersByType?.digital || 0 },
        { key: 'service', label: 'Services', count: stats?.offersByType?.service || 0 },
        { key: 'rental', label: 'Locations', count: stats?.offersByType?.rental || 0 },
        { key: 'accommodation', label: 'Hébergements', count: stats?.offersByType?.accommodation || 0 }
    ];

    if (loading) {
        return (
            <div className="vendor-shop-loading">
                <div className="spinner"></div>
                <p>Chargement de la boutique...</p>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="vendor-shop-error">
                <Package size={48} />
                <h2>Boutique introuvable</h2>
                <button onClick={() => navigate('/vendors')} className="back-button">
                    Retour aux boutiques
                </button>
            </div>
        );
    }

    return (
        <div className="vendor-shop">
            <SEO title={vendor?.name ? `${vendor.name} | Boutique` : 'Boutique'} description={vendor?.description || 'Découvrez cette boutique sur Union Digitale.'} />
            {/* Header with banner */}
            <div className="vendor-banner">
                {vendor.shopBanner ? (
                    <img src={vendor.shopBanner} alt={vendor.shopName} className="banner-image" />
                ) : (
                    <div className="banner-placeholder" />
                )}
            </div>

            {/* Vendor Info */}
            <div className="vendor-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} />
                    Retour
                </button>

                <div className="vendor-profile">
                    {vendor.shopLogo ? (
                        <img src={vendor.shopLogo} alt={vendor.shopName} className="vendor-avatar" />
                    ) : (
                        <div className="vendor-avatar-placeholder">
                            <Package size={40} />
                        </div>
                    )}

                    <div className="vendor-details">
                        <h1 className="vendor-shop-name">{vendor.shopName}</h1>
                        {getVerificationBadge()}
                        {trust?.trustTier && (
                            <div className="mt-2">
                                <TrustBadge tier={trust.trustTier} />
                            </div>
                        )}

                        <div className="vendor-meta">
                            {vendor.category && (
                                <div className="meta-item">
                                    <MapPin size={16} />
                                    <span>{vendor.category}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                                <span>{vendor.rating?.toFixed(1) || '0.0'} ({vendor.reviewCount || 0} avis)</span>
                            </div>
                            <div className="meta-item">
                                <TrendingUp size={16} />
                                <span>{vendor.totalSales || 0} ventes</span>
                            </div>
                        </div>

                        {vendor.description && (
                            <p className="vendor-bio">{vendor.description}</p>
                        )}

                        <div className="vendor-contact">
                            {vendor.email && (
                                <a href={`mailto:${vendor.email}`} className="contact-link">
                                    <Mail size={16} />
                                    <span>Contacter</span>
                                </a>
                            )}
                            {vendor.phone && (
                                <a href={`tel:${vendor.phone}`} className="contact-link">
                                    <Phone size={16} />
                                    <span>{vendor.phone}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Offer Filters */}
            <div className="offers-section">
                <div className="offers-header">
                    <h2>Offres de la boutique</h2>
                    <div className="offer-filters">
                        {offerTypes.map(type => (
                            <button
                                key={type.key}
                                className={`filter-btn ${selectedType === type.key ? 'active' : ''}`}
                                onClick={() => setSelectedType(type.key)}
                                disabled={type.count === 0}
                            >
                                {type.label}
                                {type.count > 0 && <span className="filter-count">{type.count}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Offers Grid */}
                <div className="offers-grid">
                    {getFilteredOffers().length > 0 ? (
                        getFilteredOffers().map(offer => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))
                    ) : (
                        <div className="no-offers">
                            <Package size={48} />
                            <p>Aucune offre disponible dans cette catégorie</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorShop;
