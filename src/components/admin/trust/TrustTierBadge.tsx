import React from 'react';

const tierStyles: Record<string, string> = {
  ELITE: 'bg-amber-100 text-amber-700 border-amber-200',
  TRUSTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  STANDARD: 'bg-slate-100 text-slate-700 border-slate-200',
  WATCH: 'bg-orange-100 text-orange-700 border-orange-200',
  RESTRICTED: 'bg-rose-100 text-rose-700 border-rose-200',
};

const TrustTierBadge = ({ tier }: { tier: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${tierStyles[tier] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
    {tier}
  </span>
);

export default TrustTierBadge;
