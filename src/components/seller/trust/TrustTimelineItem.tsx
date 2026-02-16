import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const TrustTimelineItem = ({ item }: { item: any }) => {
  const icon = item.type === 'UPGRADE'
    ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
    : item.type === 'DOWNGRADE'
      ? <ArrowDownRight className="w-4 h-4 text-rose-600" />
      : <Minus className="w-4 h-4 text-slate-500" />;

  const label = item.type === 'UPGRADE'
    ? `Ton niveau est passé de ${item.from} à ${item.to}`
    : item.type === 'DOWNGRADE'
      ? `Ton niveau a été ajusté de ${item.from} à ${item.to}`
      : 'Performance stable confirmée';

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-sm text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</div>
      </div>
    </div>
  );
};

export default TrustTimelineItem;
