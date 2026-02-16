import React, { useState } from 'react';
import TrustTimelineItem from './TrustTimelineItem';
import { trackSellerEvent } from '../../../services/sellerAnalytics';

const TrustTimeline = ({ timeline, trustTier }: { timeline: any[]; trustTier?: string }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      trackSellerEvent('seller_trust_timeline_expand', {
        sourceDashboard: 'TrustPage',
        path: '/seller/trust',
        trustTier,
        timelineCountShown: timeline.length,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-700">Historique récent</div>
        <button onClick={handleToggle} className="text-xs text-indigo-600">
          {expanded ? 'Masquer' : 'Voir'}
        </button>
      </div>
      {expanded && (
        <div className="space-y-3">
          {timeline.length === 0 && <div className="text-xs text-slate-500">Aucun événement récent.</div>}
          {timeline.slice(0, 5).map((item, idx) => (
            <TrustTimelineItem key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrustTimeline;
