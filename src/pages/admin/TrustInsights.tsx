import React, { useEffect, useState } from 'react';
import { useAdminTrustInsightsApi } from '../../api/adminTrustInsights';

const Card = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value ?? '-'}</div>
  </div>
);

const TrustInsights = () => {
  const api = useAdminTrustInsightsApi();
  const [summary, setSummary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.getSummary('24h').then(setSummary);
    api.getEvents(100).then((res) => setEvents(res.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Trust nav clicks" value={summary?.navClicks ?? 0} />
        <Card label="Trust page views" value={summary?.pageViews ?? 0} />
        <Card label="Timeline expands" value={summary?.timelineExpands ?? 0} />
        <Card label="Unique sellers" value={summary?.uniqueSellers ?? 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card label="Nav → Page" value={summary?.navToPageRate ?? 0} />
        <Card label="Page → Timeline" value={summary?.pageToTimelineRate ?? 0} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-slate-900 dark:text-slate-100">Derniers événements</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Seller</th>
                <th className="text-left px-4 py-2">Store</th>
                <th className="text-left px-4 py-2">Event</th>
                <th className="text-left px-4 py-2">Tier</th>
                <th className="text-left px-4 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-2 text-xs text-slate-500">{new Date(evt.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs">{evt.sellerId}</td>
                  <td className="px-4 py-2 text-xs">{evt.storeId}</td>
                  <td className="px-4 py-2 text-xs">{evt.eventName}</td>
                  <td className="px-4 py-2 text-xs">{evt.metadata?.trustTier || '-'}</td>
                  <td className="px-4 py-2 text-xs">{evt.metadata?.sourceDashboard || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrustInsights;
