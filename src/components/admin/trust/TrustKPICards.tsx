import React from 'react';

const Card = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
    <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value ?? '-'}</div>
  </div>
);

const TrustKPICards = ({ summary }: { summary: any }) => {
  const counts = summary?.counts || {};
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      <Card label="Elite" value={counts.elite ?? 0} />
      <Card label="Trusted" value={counts.trusted ?? 0} />
      <Card label="Standard" value={counts.standard ?? 0} />
      <Card label="Watch" value={counts.watch ?? 0} />
      <Card label="Restricted" value={counts.restricted ?? 0} />
      <Card label="Avg score" value={summary?.avgTrustScore ?? 0} />
      <Card label="Changed 24h" value={summary?.changedTiers24h ?? 0} />
    </div>
  );
};

export default TrustKPICards;
