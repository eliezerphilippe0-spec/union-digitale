import React from 'react';

const TrustJobStatusCard = ({ status, onRun, onDryRun }: any) => {
  const locked = status?.expiresAt && new Date(status.expiresAt) > new Date();
  const report = status?.lastReport || null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-slate-900 dark:text-slate-100">Daily trust recompute</div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${locked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {locked ? 'LOCKED' : 'IDLE'}
        </span>
      </div>
      <div className="text-xs text-slate-500 mb-3">
        {status?.lockedAt ? `Locked at ${new Date(status.lockedAt).toLocaleString()}` : 'Not locked'}
      </div>
      <div className="text-xs text-slate-600 mb-3">
        Last report: {report ? `${report.evaluated} eval / ${report.changedTier} changed / ${report.errors} errors` : '—'}
      </div>
      <div className="flex gap-2">
        <button onClick={onDryRun} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">Run dry</button>
        <button onClick={onRun} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white">Run now</button>
      </div>
    </div>
  );
};

export default TrustJobStatusCard;
