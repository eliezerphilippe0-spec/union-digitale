import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Calendar, Download, Wrench, Car, Home, Package } from 'lucide-react';
import './OfferCard.css';

const OfferCard = ({ offer }) => {
    const navigate = useNavigate();

    const {
        id,
        type,
        title,
        description,
        price,
        images,
        rating,
        reviewCount,
        serviceDetails,
        rentalDetails,
        accommodationDetails
    } = offer;

    const handleClick = () => {
        navigate(`/offer/${id}`);
    };

    const getTypeIcon = () => {
        const icons = {
            physical: <Package size={20} />,
            digital: <Download size={20} />,
            service: <Wrench size={20} />,
            rental: <Car size={20} />,
            accommodation: <Home size={20} />
        };
        return icons[type] || icons.physical;
    };

    const getTypeLabel = () => {
        const labels = {
            physical: 'Produit',
            digital: 'Digital',
            service: 'Service',
            rental: 'Location',
            accommodation: 'Hébergement'
        };
        return labels[type] || 'Produit';
    };

    const getCTA = () => {
        const ctas = {
            physical: 'Acheter',
            digital: 'Acheter maintenant',
            service: 'Réserver',
            rental: 'Réserver',
            accommodation: 'Réserver un séjour'
        };
        return ctas[type] || 'Voir détails';
    };

    const getSubInfo = () => {
        if (type === 'service' && serviceDetails) {
            return (
                <div className="offer-subinfo">
                    <Calendar size={14} />
                    <span>{serviceDetails.duration || 'Durée variable'}</span>
                </div>
            );
        }
        if (type === 'rental' && rentalDetails) {
            return (
                <div className="offer-subinfo">
                    <Car size={14} />
                    <span>{rentalDetails.vehicleType || 'Véhicule'}</span>
                </div>
            );
        }
        if (type === 'accommodation' && accommodationDetails) {
            return (
                <div className="offer-subinfo">
                    <Home size={14} />
                    <span>{accommodationDetails.capacity || '1'} personnes</span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="offer-card" onClick={handleClick}>
            <div className="offer-image-container">
                {images && images.length > 0 ? (
                    <img src={images[0]} alt={title} className="offer-image" />
                ) : (
                    <div className="offer-image-placeholder">
                        {getTypeIcon()}
                    </div>
                )}
                <div className="offer-type-badge">
                    {getTypeIcon()}
                    <span>{getTypeLabel()}</span>
                </div>
            </div>

            <div className="offer-content">
                <h3 className="offer-title">{title}</h3>

                <p className="offer-description">
                    {description?.substring(0, 80)}
                    {description?.length > 80 && '...'}
                </p>

                {getSubInfo()}

                <div className="offer-footer">
                    <div className="offer-rating">
                        <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                        <span className="rating-value">{rating?.toFixed(1) || '0.0'}</span>
                        <span className="rating-count">({reviewCount || 0})</span>
                    </div>

                    <div className="offer-price-section">
                        <span className="offer-price">{price?.toLocaleString()} HTG</span>
                        {(type === 'rental' || type === 'accommodation') && (
                            <span className="price-unit">/{type === 'accommodation' ? 'nuit' : 'jour'}</span>
                        )}
                    </div>
                </div>

                <button className="offer-cta" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                    {getCTA()}
                </button>
            </div>
        </div>
    );
};

export default OfferCard;
