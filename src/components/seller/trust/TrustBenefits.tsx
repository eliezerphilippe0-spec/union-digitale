import React from 'react';

const TrustBenefits = ({ payoutDelayHours, listingBoostFactor, tier }: { payoutDelayHours: number; listingBoostFactor: number; tier: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-sm font-semibold text-slate-700 mb-3">Tes avantages actuels</div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
        <div className="text-slate-500">Délai de paiement</div>
        <div className="text-sm font-semibold">{payoutDelayHours}h</div>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
        <div className="text-slate-500">Badge public</div>
        <div className="text-sm font-semibold">{tier}</div>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
        <div className="text-slate-500">Visibilité</div>
        <div className="text-sm font-semibold">{listingBoostFactor > 1 ? 'Prioritaire' : 'Standard'}</div>
      </div>
    </div>
  </div>
);

export default TrustBenefits;
