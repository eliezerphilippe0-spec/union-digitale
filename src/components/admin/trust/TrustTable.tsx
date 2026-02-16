import React from 'react';
import TrustTierBadge from './TrustTierBadge';

const TrustTable = ({ title, items, onSelect, onLoadMore, hasMore, loading, showReasons = false }: any) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      <div className="font-semibold text-slate-900 dark:text-slate-100">{title}</div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className="text-left px-4 py-2">Store</th>
            <th className="text-left px-4 py-2">Score</th>
            <th className="text-left px-4 py-2">Tier</th>
            <th className="text-left px-4 py-2">Boost</th>
            <th className="text-left px-4 py-2">Payout delay</th>
            {showReasons && <th className="text-left px-4 py-2">Top penalties</th>}
            <th className="text-right px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((store: any) => (
            <tr key={store.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2">
                <div className="font-medium text-slate-900 dark:text-slate-100">{store.name || store.id}</div>
                <div className="text-xs text-slate-500">{store.id}</div>
              </td>
              <td className="px-4 py-2">{store.trustScore ?? '-'}</td>
              <td className="px-4 py-2"><TrustTierBadge tier={store.trustTier} /></td>
              <td className="px-4 py-2">{store.listingBoostFactor ?? '-'}</td>
              <td className="px-4 py-2">{store.payoutDelayHours ?? '-'}</td>
              {showReasons && (
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(store.topReasons || []).map((reason: string) => (
                      <span key={reason} className="px-2 py-0.5 text-xs bg-rose-50 text-rose-700 rounded-full border border-rose-100">{reason}</span>
                    ))}
                  </div>
                </td>
              )}
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onSelect(store)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-4 py-3 flex justify-end">
      <button
        disabled={!hasMore || loading}
        onClick={onLoadMore}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : hasMore ? 'Load more' : 'No more'}
      </button>
    </div>
  </div>
);

export default TrustTable;
