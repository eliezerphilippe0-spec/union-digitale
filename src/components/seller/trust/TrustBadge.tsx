import React from 'react';

const styles: Record<string, string> = {
  ELITE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRUSTED: 'bg-blue-100 text-blue-700 border-blue-200',
  STANDARD: 'bg-slate-100 text-slate-700 border-slate-200',
  WATCH: 'bg-amber-100 text-amber-700 border-amber-200',
  RESTRICTED: 'bg-rose-100 text-rose-700 border-rose-200',
};

const TrustBadge = ({ tier }: { tier: string }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[tier] || styles.STANDARD}`}>
    {tier}
  </span>
);

export default TrustBadge;
