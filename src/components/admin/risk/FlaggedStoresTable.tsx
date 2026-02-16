import React from 'react';
import RiskLevelBadge from './RiskLevelBadge';
import SeverityBadge from './SeverityBadge';

const FlaggedStoresTable = ({ items, loading, onSelect, onFreeze, onUnfreeze, onSetLevel }: any) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left px-4 py-3">Store</th>
            <th className="text-left px-4 py-3">Risk</th>
            <th className="text-left px-4 py-3">Frozen</th>
            <th className="text-left px-4 py-3">Last Eval</th>
            <th className="text-left px-4 py-3">Last Event</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && items.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>Chargement…</td>
            </tr>
          )}
          {items.map((store: any) => (
            <tr key={store.storeId} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{store.name}</div>
                <div className="text-xs text-gray-500">{store.storeId}</div>
              </td>
              <td className="px-4 py-3"><RiskLevelBadge level={store.riskLevel} /></td>
              <td className="px-4 py-3">{store.payoutsFrozen ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{store.lastRiskEvaluated || '-'}</td>
              <td className="px-4 py-3 text-xs">
                {store.lastEvent ? (
                  <div className="flex items-center gap-2">
                    <span>{store.lastEvent.type}</span>
                    <SeverityBadge severity={store.lastEvent.severity} />
                  </div>
                ) : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button className="px-2 py-1 text-xs border rounded" onClick={() => onSelect(store)}>View</button>
                  <button className="px-2 py-1 text-xs border rounded" onClick={() => onSetLevel(store)}>Set</button>
                  {store.payoutsFrozen ? (
                    <button className="px-2 py-1 text-xs border rounded" onClick={() => onUnfreeze(store)}>Unfreeze</button>
                  ) : (
                    <button className="px-2 py-1 text-xs border rounded" onClick={() => onFreeze(store)}>Freeze</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Aucun store</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FlaggedStoresTable;
