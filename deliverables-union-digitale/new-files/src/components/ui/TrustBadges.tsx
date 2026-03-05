import React from 'react';
import '../styles/TrustBadges.css';

/**
 * TrustBadges Component
 * 
 * Displays 4 trust signals for Union Digitale customers:
 * - Secure payment (MonCash/Natcash SSL)
 * - Guaranteed delivery
 * - Large customer base
 * - Easy returns policy
 * 
 * Used on product pages, cart, and checkout to build customer confidence.
 */

interface TrustBadgesProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  compact?: boolean;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({
  className = '',
  variant = 'horizontal',
  compact = false,
}) => {
  const badges = [
    {
      id: 'security',
      icon: '🔒',
      label: 'Peman Sekirize',
      description: 'MonCash/Natcash SSL',
    },
    {
      id: 'delivery',
      icon: '🚚',
      label: 'Livrezon Garanti',
      description: 'Port-au-Prince & nasyonal',
    },
    {
      id: 'customers',
      icon: '⭐',
      label: '50k+ Kliyan',
      description: 'Konfianse sou Union Digitale',
    },
    {
      id: 'returns',
      icon: '↩️',
      label: 'Retounen 30 jou',
      description: 'Garanti satisfaksyon',
    },
  ];

  return (
    <div
      className={`trust-badges trust-badges--${variant} ${
        compact ? 'trust-badges--compact' : ''
      } ${className}`}
      aria-label="Trust and security badges"
    >
      {badges.map((badge) => (
        <div key={badge.id} className="trust-badge">
          <div className="trust-badge__icon" aria-hidden="true">
            {badge.icon}
          </div>
          <div className="trust-badge__content">
            <p className="trust-badge__label">{badge.label}</p>
            <p className="trust-badge__description">{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
