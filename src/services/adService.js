/**
 * Ad Service - Internal Marketplace Advertising
 * Allows vendors to boost products for a fee.
 */
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';

export const AD_RATES = {
    BOOST_DAILY: 50,  // 50 HTG/day
    BOOST_WEEKLY: 300, // 300 HTG/week
    FEATURED_SLOT: 500 // 500 HTG/day on homepage
};

/**
 * Boost a product
 */
export const boostProduct = async (productId, durationDays = 1) => {
    try {
        const productRef = doc(db, 'products', productId);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        await updateDoc(productRef, {
            isSponsored: true,
            sponsoredUntil: expiryDate.toISOString(),
            updatedAt: serverTimestamp()
        });

        // Log ad revenue
        await addDoc(collection(db, 'ad_revenue'), {
            productId,
            durationDays,
            amount: AD_RATES.BOOST_DAILY * durationDays,
            createdAt: serverTimestamp()
        });

        return { success: true, expiryDate };
    } catch (error) {
        console.error('Error boosting product:', error);
        throw error;
    }
};

export default {
    boostProduct,
    AD_RATES
};
