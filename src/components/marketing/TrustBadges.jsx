import React from 'react';
import { Shield, CheckCircle, Lock, Users, CreditCard, MapPin } from 'lucide-react';
import './TrustBadges.css';

export default function TrustBadges({ variant = 'default', showAll = true }) {
    const badges = [
        {
            icon: <Lock className="w-5 h-5" />,
            label: 'SSL 256-bit',
            description: 'Paiements sécurisés',
            color: 'green'
        },
        {
            icon: <CheckCircle className="w-5 h-5" />,
            label: '500+ Vendeurs',
            description: 'Vérifiés',
            color: 'blue'
        },
        {
            icon: <Shield className="w-5 h-5" />,
            label: 'Protection Acheteur',
            description: 'Garantie 30 jours',
            color: 'purple'
        },
        {
            icon: <CreditCard className="w-5 h-5" />,
            label: 'MonCash & NatCash',
            description: 'Paiements locaux',
            color: 'gold'
        },
        {
            icon: <MapPin className="w-5 h-5" />,
            label: '100% Haïtien',
            description: 'Fait en Haïti',
            color: 'red'
        },
        {
            icon: <Users className="w-5 h-5" />,
            label: '10,000+ Clients',
            description: 'Satisfaits',
            color: 'teal'
        }
    ];

    const displayBadges = showAll ? badges : badges.slice(0, 3);

    if (variant === 'compact') {
        return (
            <div className="trust-badges-compact">
                {displayBadges.map((badge, index) => (
                    <div key={index} className={`trust-badge-compact ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="trust-badges-inline">
                {displayBadges.map((badge, index) => (
                    <div key={index} className={`trust-badge-inline ${badge.color}`}>
                        {badge.icon}
                        <div className="badge-text">
                            <span className="badge-label">{badge.label}</span>
                            <span className="badge-description">{badge.description}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Default variant - full cards
    return (
        <div className="trust-badges-grid">
            {displayBadges.map((badge, index) => (
                <div key={index} className={`trust-badge-card ${badge.color}`}>
                    <div className="badge-icon">
                        {badge.icon}
                    </div>
                    <div className="badge-content">
                        <h4 className="badge-label">{badge.label}</h4>
                        <p className="badge-description">{badge.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Specific badge for vendor profiles
export function VendorTrustBadge({ vendor }) {
    const badges = [];

    if (vendor.verificationLevel === 'verified') {
        badges.push({
            icon: <CheckCircle className="w-4 h-4" />,
            label: 'Vérifié',
            color: 'green'
        });
    }

    if (vendor.verificationLevel === 'premium') {
        badges.push({
            icon: <Shield className="w-4 h-4" />,
            label: 'Premium',
            color: 'gold'
        });
    }

    if (vendor.rating >= 4.5) {
        badges.push({
            icon: '⭐',
            label: 'Top Vendeur',
            color: 'yellow'
        });
    }

    if (vendor.responseTime < 2) {
        badges.push({
            icon: '⚡',
            label: 'Réponse Rapide',
            color: 'blue'
        });
    }

    if (vendor.totalOrders > 100) {
        badges.push({
            icon: '🏆',
            label: 'Expérimenté',
            color: 'purple'
        });
    }

    return (
        <div className="vendor-trust-badges">
            {badges.map((badge, index) => (
                <span key={index} className={`vendor-badge ${badge.color}`}>
                    {typeof badge.icon === 'string' ? badge.icon : badge.icon}
                    {badge.label}
                </span>
            ))}
        </div>
    );
}

// Security indicators for checkout
export function SecurityIndicators() {
    return (
        <div className="security-indicators">
            <div className="security-item">
                <Lock className="w-4 h-4 text-green-600" />
                <span>Connexion sécurisée SSL</span>
            </div>
            <div className="security-item">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Protection des données</span>
            </div>
            <div className="security-item">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Paiement vérifié</span>
            </div>
        </div>
    );
}
