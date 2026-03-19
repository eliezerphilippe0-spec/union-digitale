import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to capture ?ref=AMBASSADOR_ID from the URL and store it in localStorage
 * This powers the Ambassador/Affiliate priority.
 */
export const useReferralTracking = () => {
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const refId = searchParams.get('ref') || searchParams.get('ambassador');

        if (refId) {
            // Save the referral data with an expiration timestamp (e.g., 30 days cookie equivalent)
            const referralData = {
                ambassadorId: refId,
                timestamp: Date.now(),
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
            };
            
            localStorage.setItem('ud_referral', JSON.stringify(referralData));
            console.log('Referral active tracked for:', refId);
        }
    }, [location]);
};

/**
 * Helper to get the current unexpired referral data to attach to an order
 */
export const getActiveReferral = () => {
    try {
        const stored = localStorage.getItem('ud_referral');
        if (!stored) return null;

        const referralData = JSON.parse(stored);
        
        // Check expiration
        if (Date.now() > referralData.expiresAt) {
            localStorage.removeItem('ud_referral');
            return null;
        }

        return referralData;
    } catch (e) {
        return null;
    }
};

/**
 * Helper to clear the referral after a successful purchase
 * Optional: Some marketplaces allow lifetime cookie, here we clear per order or keep it.
 * We'll keep it active for the 30 days even if they buy multiple times to maximize ambassador earnings.
 */
export const clearReferral = () => {
    localStorage.removeItem('ud_referral');
};
