import React from 'react';

const TrustImprovementTips = ({ tier, warnings }: { tier: string; warnings: string[] }) => {
  let headline = 'Comment améliorer ton niveau';
  if (tier === 'WATCH') headline = 'Comment retrouver un meilleur niveau';
  if (tier === 'ELITE') headline = 'Tu es au meilleur niveau — continue ainsi';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-700 mb-2">{headline}</div>
      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
        <li>Maintenir des livraisons rapides et confirmées</li>
        <li>Réduire les retours et litiges</li>
        <li>Éviter les contestations et problèmes de paiement</li>
        <li>Garder une performance stable sur 30 jours</li>
      </ul>
      {warnings.length > 0 && (
        <div className="mt-3 text-xs text-amber-700">
          Conseil : corrige d’abord les points “À surveiller” pour accélérer l’amélioration.
        </div>
      )}
    </div>
  );
};

export default TrustImprovementTips;
