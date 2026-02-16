import React from 'react';
import RiskLevelBadge from './RiskLevelBadge';
import EventTimeline from './EventTimeline';

const StoreRiskDrawer = ({ store, events, onClose, onEvaluate, onSetLevel, onFreeze, onUnfreeze }: any) => {
  if (!store) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="w-full max-w-lg bg-white h-full p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">{store.name}</div>
            <div className="text-xs text-gray-500">{store.storeId}</div>
          </div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <RiskLevelBadge level={store.riskLevel} />
          <span className="text-xs text-gray-500">Frozen: {store.payoutsFrozen ? 'Yes' : 'No'}</span>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1.5 text-xs border rounded" onClick={() => onEvaluate(store, true)}>Eval Dry Run</button>
          <button className="px-3 py-1.5 text-xs border rounded" onClick={() => onEvaluate(store, false)}>Eval Apply</button>
          <button className="px-3 py-1.5 text-xs border rounded" onClick={() => onSetLevel(store)}>Set Level</button>
          {store.payoutsFrozen ? (
            <button className="px-3 py-1.5 text-xs border rounded" onClick={() => onUnfreeze(store)}>Unfreeze</button>
          ) : (
            <button className="px-3 py-1.5 text-xs border rounded" onClick={() => onFreeze(store)}>Freeze</button>
          )}
        </div>

        <h3 className="text-sm font-semibold mb-2">Risk Timeline</h3>
        <EventTimeline events={events} />
      </div>
    </div>
  );
};

export default StoreRiskDrawer;
