import { useAdminFetch } from '../hooks/useAdminFetch';

export const useAdminTrustInsightsApi = () => {
  const { adminFetch } = useAdminFetch();

  const getSummary = async (window = '24h') => adminFetch(`/api/admin/trust/insights/summary?window=${window}`);
  const getEvents = async (limit = 100) => adminFetch(`/api/admin/trust/insights/events?limit=${limit}`);

  return { getSummary, getEvents };
};
