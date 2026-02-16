import React from 'react';

const TrustInfluenceSection = ({ positives, warnings }: { positives: string[]; warnings: string[] }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-sm font-semibold text-emerald-700 mb-2">Points positifs</div>
        <div className="space-y-2">
          {positives.length === 0 && <div className="text-xs text-slate-500">Pas de signal positif notable pour l’instant.</div>}
          {positives.map((p) => (
            <div key={p} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
              {p}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-amber-700 mb-2">À surveiller</div>
        <div className="space-y-2">
          {warnings.length === 0 && <div className="text-xs text-slate-500">Aucun signal négatif récent.</div>}
          {warnings.map((w) => (
            <div key={w} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
              {w}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default TrustInfluenceSection;
