import React from 'react';
import TrustTierBadge from './TrustTierBadge';

const StoreTrustDrawer = ({ open, store, events, onClose, onRecompute }: any) => {
  if (!open) return null;

  const summary = store?.trustReasonSummary || {};
  const penalties = summary.penalties || [];
  const bonuses = summary.bonuses || [];
  const signals = summary.signals || {};

  const penaltyLabels: Record<string, string> = {
    refund_rate_7d: 'Refund rate 7d',
    refund_after_release_30d: 'Refund after release 30d',
    chargebacks_30d: 'Chargebacks 30d',
    critical_risk_events_30d: 'Critical events 30d',
    rapid_payout_pattern_7d: 'Rapid payout patterns 7d',
  };

  const formatPenaltyDetail = (item: any) => {
    const d = item?.details || {};
    if (d.refundRate7d !== undefined) return `${Math.round(d.refundRate7d * 100)}%`;
    if (d.refundAfterReleaseRate30d !== undefined) return `${Math.round(d.refundAfterReleaseRate30d * 100)}%`;
    if (d.chargebacks30d !== undefined) return `${d.chargebacks30d}`;
    if (d.criticalRiskEvents30d !== undefined) return `${d.criticalRiskEvents30d}`;
    if (d.rapidPayoutPatterns7d !== undefined) return `${d.rapidPayoutPatterns7d}`;
    return '';
  };

  const bonusLabels: Record<string, string> = {
    clean_30d: 'Clean 30d',
    clean_90d: 'Clean 90d',
  };

  const signalLabels: Record<string, string> = {
    orders7d: 'Orders 7d',
    orders30d: 'Orders 30d',
    orders90d: 'Orders 90d',
    refunds7d: 'Refunds 7d',
    refunds30d: 'Refunds 30d',
    refundsAfterRelease30d: 'Refund after release 30d',
    chargebacks30d: 'Chargebacks 30d',
    criticalRiskEvents30d: 'Critical events 30d',
    rapidPayoutPatterns7d: 'Rapid payout patterns 7d',
    refundRate7d: 'Refund rate 7d',
    refundRate30d: 'Refund rate 30d',
    refundAfterReleaseRate30d: 'Refund after release rate 30d',
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Penalties</div>
              <div className="space-y-2">
                {penalties.length === 0 && <span className="text-xs text-slate-500">No penalties.</span>}
                {penalties.map((p: any) => (
                  <div key={p.key} className="flex items-center justify-between text-xs px-2 py-1 rounded border border-rose-100 bg-rose-50 text-rose-700">
                    <span>{penaltyLabels[p.key] || p.key}{formatPenaltyDetail(p) ? `: ${formatPenaltyDetail(p)}` : ''}</span>
                    <span>−{p.points}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Bonuses</div>
              <div className="space-y-2">
                {bonuses.length === 0 && <span className="text-xs text-slate-500">No bonuses.</span>}
                {bonuses.map((b: any) => (
                  <div key={b.key} className="flex items-center justify-between text-xs px-2 py-1 rounded border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <span>{bonusLabels[b.key] || b.key}</span>
                    <span>+{b.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Signals</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.keys(signalLabels).map((key) => (
                <div key={key} className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600">
                  <div className="text-[10px] uppercase text-slate-400">{signalLabels[key]}</div>
                  <div className="text-sm font-semibold text-slate-800">{signals?.[key] ?? '-'}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              ComputedAt: {summary?.computedAt ? new Date(summary.computedAt).toLocaleString() : '—'} · Formula {summary?.version || 'v1'}
            </div>
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
