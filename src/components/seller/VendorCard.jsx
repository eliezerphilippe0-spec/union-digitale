import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Package, TrendingUp } from 'lucide-react';
import './VendorCard.css';

const VendorCard = ({ vendor }) => {
    const navigate = useNavigate();

    const {
        id,
        shopName,
        shopLogo,
        description,
        verified,
        verificationLevel,
        rating,
        reviewCount,
        totalSales,
        category
    } = vendor;

    const handleClick = () => {
        navigate(`/vendor/${id}`);
    };

    const getVerificationBadge = () => {
        if (!verified) return null;

        const badges = {
            basic: { text: 'Vérifié', color: '#10b981' },
            verified: { text: 'Vendeur Vérifié', color: '#3b82f6' },
            premium: { text: 'Vendeur Premium', color: '#f59e0b' }
        };

        const badge = badges[verificationLevel] || badges.basic;

        return (
            <div className="verification-badge" style={{ color: badge.color }}>
                <CheckCircle size={16} />
                <span>{badge.text}</span>
            </div>
        );
    };

    return (
        <div className="vendor-card" onClick={handleClick}>
            <div className="vendor-card-header">
                {shopLogo ? (
                    <img src={shopLogo} alt={shopName} className="vendor-logo" />
                ) : (
                    <div className="vendor-logo-placeholder">
                        <Package size={32} />
                    </div>
                )}
                <div className="vendor-info">
                    <h3 className="vendor-name">{shopName}</h3>
                    {getVerificationBadge()}
                </div>
            </div>

            <p className="vendor-description">
                {description?.substring(0, 100)}
                {description?.length > 100 && '...'}
            </p>

            {/* Universal Access Badge */}
            <div className="flex items-center gap-1 mb-3 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full w-fit">
                <span className="text-xs">📱</span>
                <span className="text-xs">💻</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Accessible partout</span>
            </div>

            <div className="vendor-stats">
                <div className="stat-item">
                    <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                    <span className="stat-value">{rating?.toFixed(1) || '0.0'}</span>
                    <span className="stat-label">({reviewCount || 0})</span>
                </div>

                <div className="stat-item">
                    <TrendingUp size={16} />
                    <span className="stat-value">{totalSales || 0}</span>
                    <span className="stat-label">ventes</span>
                </div>
            </div>

            {category && (
                <div className="vendor-category">
                    <MapPin size={14} />
                    <span>{category}</span>
                </div>
            )}
        </div>
    );
};

export default VendorCard;
