import { useEffect, useState } from 'react';
import { appApiClient } from '../services/apiClient';

export const useSellerTrust = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await appApiClient.get('/seller/trust');
        if (active) setData(res);
      } catch (err: any) {
        if (active) setError(err?.message || 'Erreur');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
};
