import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [showSetLevel, setShowSetLevel] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showUnfreeze, setShowUnfreeze] = useState(false);
  const [lastDecision, setLastDecision] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    level: searchParams.get('level') || 'HIGH,FROZEN',
    frozen: (searchParams.get('frozen') || '1') === '1',
    search: searchParams.get('q') || '',
    reason: searchParams.get('reason') || '',
  });

  const loadStores = async (reset = false) => {
    setLoading(true);
    const response = await api.getFlaggedStores({
      level: filters.level,
      frozen: filters.frozen,
      limit: 50,
      cursor: reset ? null : cursor,
    });
    const items = response.items || [];
    const filtered = items.filter((s: any) => {
      const matchSearch = filters.search
        ? s.name?.toLowerCase().includes(filters.search.toLowerCase()) || s.storeId?.includes(filters.search)
        : true;
      const matchReason = filters.reason
        ? s.lastEvent?.type === filters.reason
        : true;
      return matchSearch && matchReason;
    });
    setStores(reset ? filtered : [...stores, ...filtered]);
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

  const loadSummary = async () => {
    const response = await api.getRiskSummary('24h');
    setSummary(response);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('level', filters.level);
    params.set('frozen', filters.frozen ? '1' : '0');
    if (filters.search) params.set('q', filters.search);
    if (filters.reason) params.set('reason', filters.reason);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStores([]);
      setCursor(null);
      loadStores(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters.level, filters.frozen, filters.search]);

  useEffect(() => {
    loadJobStatus();
    loadSummary();
  }, []);

  const kpis = useMemo(() => {
    const counts = summary?.counts || {};
    const lastReport = summary?.jobs?.dailyEval?.lastReport || jobStatus?.lastReport || {};
    return [
      { label: 'HIGH', value: counts.high ?? '-' },
      { label: 'FROZEN', value: counts.frozen ?? '-' },
      { label: 'payoutsFrozen', value: counts.payoutsFrozen ?? '-' },
      { label: 'Changed (last)', value: lastReport.changed ?? '-' },
      { label: 'Errors (last)', value: lastReport.errors ?? '-' },
    ];
  }, [summary, jobStatus]);

  const handleSelect = async (store: any) => {
    setSelected(store);
    await loadEvents(store.storeId);
  };

  const runDaily = async (dryRun: boolean) => {
    await api.runDailyEval(dryRun);
    await loadJobStatus();
    await loadSummary();
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
    const res = await api.riskEvaluate(store.storeId, { dryRun });
    if (dryRun) {
      setLastDecision(res?.decision || null);
    } else {
      await loadStores(true);
      setLastDecision(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">🛡️ Risk & Monitoring</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs border rounded" onClick={() => runDaily(true)}>Run Daily (Dry)</button>
          <button className="px-3 py-1.5 text-xs rounded bg-black text-white" onClick={() => runDaily(false)}>Run Now</button>
        </div>
      </div>

      <div className="mb-6">
        <KPICards kpis={kpis} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: `All (${summary?.counts?.flaggedTotal ?? '-'})` },
          { key: 'WATCH', label: `WATCH (${summary?.counts?.watch ?? '-'})` },
          { key: 'HIGH', label: `HIGH (${summary?.counts?.high ?? '-'})` },
          { key: 'FROZEN', label: `FROZEN (${summary?.counts?.frozen ?? '-'})` },
          { key: 'PAYOUTS', label: `Payouts Frozen (${summary?.counts?.payoutsFrozen ?? '-'})` },
        ].map((chip) => {
          const isActive = chip.key === 'ALL'
            ? !filters.level
            : chip.key === 'PAYOUTS'
              ? filters.frozen && filters.level === 'HIGH,FROZEN'
              : filters.level === chip.key;

          const classes = isActive
            ? 'bg-black text-white'
            : 'bg-white border text-gray-700 hover:bg-gray-50';

          return (
            <button
              key={chip.key}
              className={`px-3 py-1.5 text-xs rounded-full ${classes}`}
              onClick={() => {
                if (chip.key === 'ALL') {
                  setFilters({ ...filters, level: '', frozen: false });
                  setCursor(null);
                } else if (chip.key === 'PAYOUTS') {
                  setFilters({ ...filters, level: 'HIGH,FROZEN', frozen: true });
                  setCursor(null);
                } else {
                  setFilters({ ...filters, level: chip.key, frozen: false });
                  setCursor(null);
                }
              }}
            >
              {chip.label}
            </button>
          );
        })}
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
            loading={loading}
            onSelect={handleSelect}
            onSetLevel={(s: any) => { setSelected(s); setShowSetLevel(true); }}
            onFreeze={(s: any) => { setSelected(s); setShowFreeze(true); }}
            onUnfreeze={(s: any) => { setSelected(s); setShowUnfreeze(true); }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-3 py-1.5 text-xs border rounded" onClick={() => loadStores(true)} disabled={loading}>Refresh</button>
            {nextCursor && <button className="px-3 py-1.5 text-xs border rounded" onClick={() => { setCursor(nextCursor); loadStores(); }}>Load more</button>}
          </div>
        </div>
        <div className="space-y-4">
          <JobStatusCard status={jobStatus} onRun={() => runDaily(false)} onDryRun={() => runDaily(true)} loading={false} />
          {summary?.signals24h && (
            <div className="bg-white border rounded-lg p-4 shadow-sm text-xs">
              <div className="text-sm font-semibold mb-2">Top reasons (24h)</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(summary.signals24h).map(([key, val]: any) => (
                  <button
                    key={key}
                    className="flex justify-between hover:bg-gray-50 rounded px-2 py-1"
                    onClick={() => setFilters({ ...filters, reason: key })}
                  >
                    <span>{key}</span>
                    <span className="font-semibold">{val}</span>
                  </button>
                ))}
              </div>
              {filters.reason && (
                <div className="mt-2">
                  <button className="text-xs text-blue-600" onClick={() => setFilters({ ...filters, reason: '' })}>Clear reason filter</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <StoreRiskDrawer
        store={selected}
        events={events}
        decision={lastDecision}
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
