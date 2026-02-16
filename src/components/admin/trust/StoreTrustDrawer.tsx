import React from 'react';
import TrustTierBadge from './TrustTierBadge';

const StoreTrustDrawer = ({ open, store, events, onClose, onRecompute }: any) => {
  if (!open) return null;

  const summary = store?.trustReasonSummary || {};
  const summaryEntries = Object.entries(summary || {});

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{store?.name || store?.id}</div>
              <div className="text-sm text-slate-500">{store?.id}</div>
            </div>
            <button onClick={onClose} className="text-slate-500">✕</button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-2xl font-semibold">{store?.trustScore ?? '-'}</div>
            {store?.trustTier && <TrustTierBadge tier={store.trustTier} />}
            <div className="text-xs text-slate-500">Boost {store?.listingBoostFactor ?? '-'}</div>
            <div className="text-xs text-slate-500">Delay {store?.payoutDelayHours ?? '-'}h</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onRecompute(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700"
            >
              Recompute (dry)
            </button>
            <button
              onClick={() => onRecompute(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white"
            >
              Recompute now
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reasons</div>
          <div className="flex flex-wrap gap-2">
            {summaryEntries.length === 0 && <span className="text-xs text-slate-500">No signals.</span>}
            {summaryEntries.map(([key, value]) => (
              <span key={key} className="px-2 py-1 text-xs rounded-full border border-slate-200 text-slate-600">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Trust timeline</div>
          <div className="space-y-3">
            {(events || []).map((evt: any) => (
              <div key={evt.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">{new Date(evt.createdAt).toLocaleString()}</div>
                <div className="text-sm text-slate-800 dark:text-slate-100">
                  {evt.prevTier} → {evt.nextTier} ({evt.prevScore} → {evt.nextScore})
                </div>
              </div>
            ))}
            {(events || []).length === 0 && <div className="text-xs text-slate-500">No events.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreTrustDrawer;
