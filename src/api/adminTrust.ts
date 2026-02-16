import { useAdminFetch } from '../hooks/useAdminFetch';

export const useAdminTrustApi = () => {
  const { adminFetch } = useAdminFetch();

  const getSummary = async () => adminFetch('/api/admin/trust/summary');

  const getStores = async (params: any = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.set(key, String(value));
    });
    return adminFetch(`/api/admin/trust/stores?${qs.toString()}`);
  };

  const getStoreTrust = async (storeId: string) => adminFetch(`/api/admin/stores/${storeId}/trust`);

  const getTrustEvents = async (storeId: string, params: any = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      qs.set(key, String(value));
    });
    return adminFetch(`/api/admin/stores/${storeId}/trust/events?${qs.toString()}`);
  };

  const recomputeStore = async (storeId: string, dryRun = false) => {
    const qs = new URLSearchParams();
    if (dryRun) qs.set('DRY_RUN', 'true');
    return adminFetch(`/api/admin/stores/${storeId}/trust/recompute?${qs.toString()}`, { method: 'POST' });
  };

  const getDailyStatus = async () => adminFetch('/api/admin/trust/jobs/daily-recompute/status');

  const runDaily = async (dryRun = false) => {
    const qs = new URLSearchParams();
    if (dryRun) qs.set('DRY_RUN', 'true');
    return adminFetch(`/api/admin/trust/jobs/daily-recompute/run?${qs.toString()}`, { method: 'POST' });
  };

  return { getSummary, getStores, getStoreTrust, getTrustEvents, recomputeStore, getDailyStatus, runDaily };
};
