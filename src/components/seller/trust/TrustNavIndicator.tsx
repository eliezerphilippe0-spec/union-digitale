import React from 'react';

const tierColor = (tier?: string) => {
  if (!tier) return 'bg-slate-400';
  if (tier === 'ELITE' || tier === 'TRUSTED') return 'bg-emerald-400';
  if (tier === 'WATCH') return 'bg-amber-400';
  if (tier === 'RESTRICTED') return 'bg-rose-500';
  return 'bg-slate-400';
};

const TrustNavIndicator = ({ tier, label = 'Confiance' }: { tier?: string; label?: string }) => (
  <span className="inline-flex items-center gap-2">
    <span>{label}</span>
    <span className={`w-2 h-2 rounded-full ${tierColor(tier)}`} />
  </span>
);

export default TrustNavIndicator;
