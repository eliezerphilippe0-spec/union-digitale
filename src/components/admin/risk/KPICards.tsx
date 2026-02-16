import React from 'react';

const KPICard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white rounded-lg border p-4 shadow-sm">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
  </div>
);

const KPICards = ({ kpis }: { kpis: Array<{ label: string; value: string | number }> }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    {kpis.map((kpi) => (
      <KPICard key={kpi.label} label={kpi.label} value={kpi.value} />
    ))}
  </div>
);

export default KPICards;
