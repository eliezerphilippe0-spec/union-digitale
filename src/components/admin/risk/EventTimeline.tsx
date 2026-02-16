import React from 'react';
import SeverityBadge from './SeverityBadge';
import RiskLevelBadge from './RiskLevelBadge';

const EventTimeline = ({ events }: { events: any[] }) => (
  <div className="space-y-3">
    {events.map((event) => (
      <div key={event.id} className="p-3 border rounded bg-gray-50">
        <div className="flex items-center gap-2 text-xs mb-1">
          <SeverityBadge severity={event.severity} />
          <span>{event.type}</span>
          <RiskLevelBadge level={event.nextLevel} />
          <span className="text-gray-500">{event.createdAt}</span>
        </div>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(event.details, null, 2)}</pre>
      </div>
    ))}
    {events.length === 0 && <div className="text-sm text-gray-500">Aucun event</div>}
  </div>
);

export default EventTimeline;
