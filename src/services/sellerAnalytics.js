import { appApiClient } from './apiClient';

const SESSION_KEY = 'seller_trust_session_id';

const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const trackSellerEvent = async (eventName, metadata = {}) => {
  const payload = {
    eventName,
    eventVersion: 'v1',
    metadata: {
      ...metadata,
      sessionId: getSessionId(),
      ts: new Date().toISOString(),
    },
  };
  try {
    await appApiClient.post('/seller/analytics/event', payload);
  } catch (error) {
    // silent fail
  }
};
