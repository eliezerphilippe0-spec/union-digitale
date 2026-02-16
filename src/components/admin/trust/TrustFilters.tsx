import React from 'react';

const chips = ['ALL', 'ELITE', 'TRUSTED', 'STANDARD', 'WATCH', 'RESTRICTED'];

const TrustFilters = ({ active, onChange, payoutDelayOnly, onTogglePayoutDelay }: any) => (
  <div className="flex flex-wrap items-center gap-2">
    {chips.map((chip) => (
      <button
        key={chip}
        onClick={() => onChange(chip)}
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${active === chip
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700'
          }`}
      >
        {chip}
      </button>
    ))}
    <button
      onClick={onTogglePayoutDelay}
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${payoutDelayOnly
        ? 'bg-amber-500 text-white border-amber-500'
        : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700'
        }`}
    >
      PayoutDelay != 72h
    </button>
  </div>
);

export default TrustFilters;
