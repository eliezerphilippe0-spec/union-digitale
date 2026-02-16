import React from 'react';
import TrustTimelineItem from './TrustTimelineItem';

const TrustTimeline = ({ timeline }: { timeline: any[] }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-sm font-semibold text-slate-700 mb-3">Historique récent</div>
    <div className="space-y-3">
      {timeline.length === 0 && <div className="text-xs text-slate-500">Aucun événement récent.</div>}
      {timeline.slice(0, 5).map((item, idx) => (
        <TrustTimelineItem key={idx} item={item} />
      ))}
    </div>
  </div>
);

export default TrustTimeline;
