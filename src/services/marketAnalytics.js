import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const shouldLog = (key) => {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch (e) {
    return false;
  }
};

export const logVerifiedSellerBadgeImpression = async ({ storeId, location, productId }) => {
  if (!storeId || !location) return;
  const key = `vs_badge_${location}_${storeId}`;
  if (!shouldLog(key)) return;

  try {
    const payload = {
      eventName: 'verified_seller_badge_impression',
      storeId,
      location,
      createdAt: serverTimestamp(),
    };
    if (productId) payload.productId = productId;
    await addDoc(collection(db, 'analytics_events'), payload);
  } catch (e) {
    // silent
  }
};
