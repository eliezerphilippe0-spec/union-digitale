import { useAdminFetch } from '../hooks/useAdminFetch';

export const useAdminRiskApi = () => {
  const { adminFetch } = useAdminFetch();

  const getFlaggedStores = (params = {}) => {
    const query = new URLSearchParams();
    if (params.level) query.set('level', params.level);
    if (typeof params.frozen === 'boolean') query.set('frozen', String(params.frozen));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    return adminFetch(`/api/admin/risk/stores?${query.toString()}`);
  };

  const getRiskEvents = (storeId, params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    return adminFetch(`/api/admin/stores/${storeId}/risk-events?${query.toString()}`);
  };

  const setRiskLevel = (storeId, payload) => adminFetch(`/api/admin/stores/${storeId}/risk-level`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const freezeStore = (storeId, payload) => adminFetch(`/api/admin/stores/${storeId}/freeze`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const unfreezeStore = (storeId, payload) => adminFetch(`/api/admin/stores/${storeId}/unfreeze`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const riskEvaluate = (storeId, payload) => adminFetch(`/api/admin/stores/${storeId}/risk-evaluate`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });

  const getDailyEvalStatus = () => adminFetch('/api/admin/risk/jobs/daily-eval/status');

  const runDailyEval = (dryRun = true) => adminFetch(`/api/admin/risk/jobs/daily-eval/run?DRY_RUN=${dryRun}`, {
    method: 'POST',
    body: JSON.stringify({ DRY_RUN: dryRun }),
  });

  const getRiskSummary = (window = '24h') => adminFetch(`/api/admin/risk/summary?window=${window}`);

  return {
    getFlaggedStores,
    getRiskEvents,
    setRiskLevel,
    freezeStore,
    unfreezeStore,
    riskEvaluate,
    getDailyEvalStatus,
    runDailyEval,
    getRiskSummary,
  };
};
