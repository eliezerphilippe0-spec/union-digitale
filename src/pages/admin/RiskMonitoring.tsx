import React, { useEffect, useMemo, useState } from 'react';
import KPICards from '../../components/admin/risk/KPICards';
import FlaggedStoresTable from '../../components/admin/risk/FlaggedStoresTable';
import StoreRiskDrawer from '../../components/admin/risk/StoreRiskDrawer';
import ManualRiskDialog from '../../components/admin/risk/ManualRiskDialog';
import FreezeUnfreezeDialog from '../../components/admin/risk/FreezeUnfreezeDialog';
import JobStatusCard from '../../components/admin/risk/JobStatusCard';
import { useAdminRiskApi } from '../../api/adminRisk';

const RiskMonitoring = () => {
  const api = useAdminRiskApi();
  const [stores, setStores] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState({ level: 'HIGH,FROZEN', frozen: true, search: '' });
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [showSetLevel, setShowSetLevel] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showUnfreeze, setShowUnfreeze] = useState(false);

  const loadStores = async (reset = false) => {
    setLoading(true);
    const response = await api.getFlaggedStores({
      level: filters.level,
      frozen: filters.frozen,
      limit: 50,
      cursor: reset ? null : cursor,
    });
    const items = response.items || [];
    const filtered = filters.search
      ? items.filter((s: any) => s.name?.toLowerCase().includes(filters.search.toLowerCase()) || s.storeId?.includes(filters.search))
      : items;
    setStores(reset ? filtered : filtered);
    setNextCursor(response.nextCursor || null);
    setLoading(false);
  };

  const loadEvents = async (storeId: string) => {
    const response = await api.getRiskEvents(storeId, { limit: 100 });
    setEvents(response.items || response || []);
  };

  const loadJobStatus = async () => {
    const response = await api.getDailyEvalStatus();
    setJobStatus(response.status);
  };

  useEffect(() => {
    loadStores(true);
    loadJobStatus();
  }, [filters.level, filters.frozen]);

  const kpis = useMemo(() => {
    const high = stores.filter(s => s.riskLevel === 'HIGH').length;
    const frozen = stores.filter(s => s.riskLevel === 'FROZEN').length;
    const payoutsFrozen = stores.filter(s => s.payoutsFrozen).length;
    const lastReport = jobStatus?.lastReport || {};
    return [
      { label: 'HIGH', value: high },
      { label: 'FROZEN', value: frozen },
      { label: 'payoutsFrozen', value: payoutsFrozen },
      { label: 'Changed (last)', value: lastReport.changed ?? '-' },
      { label: 'Errors (last)', value: lastReport.errors ?? '-' },
    ];
  }, [stores, jobStatus]);

  const handleSelect = async (store: any) => {
    setSelected(store);
    await loadEvents(store.storeId);
  };

  const runDaily = async (dryRun: boolean) => {
    await api.runDailyEval(dryRun);
    await loadJobStatus();
  };

  const applySetLevel = async (payload: any) => {
    await api.setRiskLevel(selected.storeId, payload);
    setShowSetLevel(false);
    await loadStores(true);
  };

  const applyFreeze = async (payload: any) => {
    await api.freezeStore(selected.storeId, payload);
    setShowFreeze(false);
    await loadStores(true);
  };

  const applyUnfreeze = async (payload: any) => {
    await api.unfreezeStore(selected.storeId, payload);
    setShowUnfreeze(false);
    await loadStores(true);
  };

  const evaluateStore = async (store: any, dryRun: boolean) => {
    await api.riskEvaluate(store.storeId, { dryRun });
    await loadStores(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Risk & Monitoring</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs border rounded" onClick={() => runDaily(true)}>Run Daily (Dry)</button>
          <button className="px-3 py-1.5 text-xs rounded bg-black text-white" onClick={() => runDaily(false)}>Run Now</button>
        </div>
      </div>

      <div className="mb-6">
        <KPICards kpis={kpis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Search store" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="border rounded px-3 py-2 text-sm" value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
              <option value="HIGH,FROZEN">HIGH+FROZEN</option>
              <option value="HIGH">HIGH</option>
              <option value="FROZEN">FROZEN</option>
              <option value="WATCH,HIGH,FROZEN">WATCH+</option>
            </select>
            <select className="border rounded px-3 py-2 text-sm" value={filters.frozen ? 'true' : 'false'} onChange={(e) => setFilters({ ...filters, frozen: e.target.value === 'true' })}>
              <option value="true">Frozen only</option>
              <option value="false">All</option>
            </select>
          </div>
          <FlaggedStoresTable
            items={stores}
            onSelect={handleSelect}
            onSetLevel={(s: any) => { setSelected(s); setShowSetLevel(true); }}
            onFreeze={(s: any) => { setSelected(s); setShowFreeze(true); }}
            onUnfreeze={(s: any) => { setSelected(s); setShowUnfreeze(true); }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-3 py-1.5 text-xs border rounded" onClick={() => loadStores(true)} disabled={loading}>Refresh</button>
            {nextCursor && <button className="px-3 py-1.5 text-xs border rounded" onClick={() => { setCursor(nextCursor); loadStores(); }}>Next</button>}
          </div>
        </div>
        <JobStatusCard status={jobStatus} onRun={() => runDaily(false)} onDryRun={() => runDaily(true)} loading={false} />
      </div>

      <StoreRiskDrawer
        store={selected}
        events={events}
        onClose={() => setSelected(null)}
        onEvaluate={evaluateStore}
        onSetLevel={() => setShowSetLevel(true)}
        onFreeze={() => setShowFreeze(true)}
        onUnfreeze={() => setShowUnfreeze(true)}
      />

      <ManualRiskDialog store={showSetLevel ? selected : null} onClose={() => setShowSetLevel(false)} onSubmit={applySetLevel} />
      <FreezeUnfreezeDialog store={showFreeze ? selected : null} mode="freeze" onClose={() => setShowFreeze(false)} onSubmit={applyFreeze} />
      <FreezeUnfreezeDialog store={showUnfreeze ? selected : null} mode="unfreeze" onClose={() => setShowUnfreeze(false)} onSubmit={applyUnfreeze} />
    </div>
  );
};

export default RiskMonitoring;
