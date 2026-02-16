import React from 'react';

const chips = ['ALL', 'ELITE', 'TRUSTED', 'STANDARD', 'WATCH', 'RESTRICTED'];

const TrustFilters = ({ active, onChange, payoutDelayOnly, onTogglePayoutDelay, query, onQueryChange }: any) => (
  <div className="flex flex-wrap items-center gap-3">
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
    <div className="flex-1 min-w-[220px]">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search store..."
        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700"
      />
    </div>
  </div>
);

export default TrustFilters;
