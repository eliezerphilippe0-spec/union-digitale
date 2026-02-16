import React from 'react';

const STYLES = {
  ELITE: 'bg-amber-100 text-amber-800',
  TRUSTED: 'bg-green-100 text-green-800',
  STANDARD: 'bg-gray-100 text-gray-700',
  WATCH: 'bg-yellow-100 text-yellow-800',
  RESTRICTED: 'bg-red-100 text-red-800',
};

const LABELS = {
  ELITE: 'Vendeur Elite',
  TRUSTED: 'Vendeur Trusted',
  STANDARD: 'Vendeur Standard',
  WATCH: 'Vendeur Watch',
  RESTRICTED: 'Vendeur Restreint',
};

const TrustBadge = ({ tier }) => {
  if (!tier) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${STYLES[tier] || STYLES.STANDARD}`}
      title={LABELS[tier] || 'Vendeur'}
    >
      {LABELS[tier] || 'Vendeur'}
    </span>
  );
};

export default TrustBadge;
