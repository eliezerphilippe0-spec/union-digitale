import React, { useEffect, useState } from 'react';
import TrustKPICards from '../../components/admin/trust/TrustKPICards';
import TrustFilters from '../../components/admin/trust/TrustFilters';
import TrustTable from '../../components/admin/trust/TrustTable';
import StoreTrustDrawer from '../../components/admin/trust/StoreTrustDrawer';
import TrustJobStatusCard from '../../components/admin/trust/TrustJobStatusCard';
import { useAdminTrustApi } from '../../api/adminTrust';

const TrustMonitoring = () => {
  const api = useAdminTrustApi();
  const [summary, setSummary] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [filter, setFilter] = useState('ALL');
  const [payoutDelayOnly, setPayoutDelayOnly] = useState(false);

  const [topItems, setTopItems] = useState<any[]>([]);
  const [topCursor, setTopCursor] = useState<string | null>(null);
  const [topNext, setTopNext] = useState<string | null>(null);
  const [topLoading, setTopLoading] = useState(false);

  const [riskItems, setRiskItems] = useState<any[]>([]);
  const [riskCursor, setRiskCursor] = useState<string | null>(null);
  const [riskNext, setRiskNext] = useState<string | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const [selected, setSelected] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const loadSummary = async () => {
    const response = await api.getSummary();
    setSummary(response);
  };

  const loadJobStatus = async () => {
    const response = await api.getDailyStatus();
    setJobStatus(response.status);
  };

  const enrichReasons = (store: any) => {
    const summary = store.trustReasonSummary || {};
    const keys = Object.keys(summary);
    return { ...store, topReasons: keys.slice(0, 3) };
  };

  const loadTop = async (reset = false, cursorArg: string | null = null) => {
    setTopLoading(true);
    const tiers = filter === 'ALL'
      ? 'ELITE,TRUSTED'
      : ['ELITE', 'TRUSTED', 'STANDARD'].includes(filter) ? filter : 'ELITE,TRUSTED';

    const response = await api.getStores({
      tier: tiers,
      limit: 20,
      cursor: reset ? null : (cursorArg ?? topCursor),
      sort: 'score',
      direction: 'desc',
      payoutDelayNot72: payoutDelayOnly,
    });

    const items = (response.items || []).map(enrichReasons);
    setTopItems(reset ? items : [...topItems, ...items]);
    setTopNext(response.nextCursor || null);
    setTopLoading(false);
  };

  const loadRisk = async (reset = false, cursorArg: string | null = null) => {
    setRiskLoading(true);
    const tiers = filter === 'ALL'
      ? 'WATCH,RESTRICTED'
      : ['WATCH', 'RESTRICTED'].includes(filter) ? filter : 'WATCH,RESTRICTED';

    const response = await api.getStores({
      tier: tiers,
      limit: 20,
      cursor: reset ? null : (cursorArg ?? riskCursor),
      sort: 'score',
      direction: 'asc',
      payoutDelayNot72: payoutDelayOnly,
    });

    const items = (response.items || []).map(enrichReasons);
    setRiskItems(reset ? items : [...riskItems, ...items]);
    setRiskNext(response.nextCursor || null);
    setRiskLoading(false);
  };

  const loadDrawer = async (storeId: string) => {
    const store = await api.getStoreTrust(storeId);
    const evts = await api.getTrustEvents(storeId, { limit: 50 });
    setSelected(store);
    setEvents(evts.items || []);
  };

  const handleRecompute = async (dryRun: boolean) => {
    if (!selected?.id) return;
    await api.recomputeStore(selected.id, dryRun);
    await loadSummary();
    await loadJobStatus();
    await loadDrawer(selected.id);
  };

  useEffect(() => {
    loadSummary();
    loadJobStatus();
  }, []);

  useEffect(() => {
    setTopCursor(null);
    setRiskCursor(null);
    loadTop(true);
    loadRisk(true);
  }, [filter, payoutDelayOnly]);

  return (
    <div className="space-y-6">
      <TrustKPICards summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrustFilters
            active={filter}
            onChange={setFilter}
            payoutDelayOnly={payoutDelayOnly}
            onTogglePayoutDelay={() => setPayoutDelayOnly(!payoutDelayOnly)}
          />
        </div>
        <TrustJobStatusCard
          status={jobStatus}
          onRun={async () => {
            await api.runDaily(false);
            await loadJobStatus();
            await loadSummary();
          }}
          onDryRun={async () => {
            await api.runDaily(true);
            await loadJobStatus();
          }}
        />
      </div>

      <TrustTable
        title="Top Trusted / Elite"
        items={topItems}
        onSelect={(store: any) => loadDrawer(store.id)}
        onLoadMore={() => {
          if (!topNext) return;
          setTopCursor(topNext);
          loadTop(false, topNext);
        }}
        hasMore={!!topNext}
        loading={topLoading}
      />

      <TrustTable
        title="At Risk (Watch / Restricted)"
        items={riskItems}
        onSelect={(store: any) => loadDrawer(store.id)}
        onLoadMore={() => {
          if (!riskNext) return;
          setRiskCursor(riskNext);
          loadRisk(false, riskNext);
        }}
        hasMore={!!riskNext}
        loading={riskLoading}
        showReasons
      />

      <StoreTrustDrawer
        open={!!selected}
        store={selected}
        events={events}
        onClose={() => setSelected(null)}
        onRecompute={handleRecompute}
      />
    </div>
  );
};

export default TrustMonitoring;
