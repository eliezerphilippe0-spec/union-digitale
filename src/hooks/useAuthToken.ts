import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthToken = () => {
  const { currentUser } = useAuth();

  const getToken = useCallback(async () => {
    if (!currentUser || !currentUser.getIdToken) return null;
    return currentUser.getIdToken();
  }, [currentUser]);

  return { getToken };
};
