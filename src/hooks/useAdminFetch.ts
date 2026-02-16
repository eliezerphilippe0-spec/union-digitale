import { useCallback } from 'react';
import { useAuthToken } from './useAuthToken';

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
};

export const useAdminFetch = () => {
  const { getToken } = useAuthToken();

  const adminFetch = useCallback(async (path, options = {}) => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      const error = new Error(errorText || 'Request failed');
      error.status = res.status;
      throw error;
    }

    return res.json();
  }, [getToken]);

  return { adminFetch };
};
