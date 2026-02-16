import React from 'react';
import TrustBadge from './TrustBadge';

const TrustHeader = ({ tier, updatedAt }: { tier: string; updatedAt?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-center gap-3">
      <TrustBadge tier={tier} />
      <div>
        <div className="text-sm text-slate-600">
          Ton niveau est recalculé automatiquement selon ta performance récente.
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Dernière mise à jour : {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
        </div>
      </div>
    </div>
  </div>
);

export default TrustHeader;
