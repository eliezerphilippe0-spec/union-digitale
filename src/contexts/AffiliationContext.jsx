import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logger from '../utils/logger';

const AffiliationContext = createContext();

export const useAffiliation = () => {
    return useContext(AffiliationContext);
};

export const AffiliationProvider = ({ children }) => {
    const [referralData, setReferralData] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // Check for query params
        const searchParams = new URLSearchParams(location.search);
        const ref = searchParams.get('ref');
        const campaign = searchParams.get('campaign');

        if (ref) {
            const data = {
                sellerId: ref,
                campaign: campaign || 'default',
                timestamp: new Date().getTime(), // Store as timestamp for calculation
                expiresAt: new Date().getTime() + (30 * 24 * 60 * 60 * 1000) // 30 days expiry
            };

            // Save to localStorage for long-term tracking (Standard Pro like Upromote)
            localStorage.setItem('union_digitale_referral', JSON.stringify(data));
            setReferralData(data);
            logger.info("Referral tracked (Persistent 30-day):", data);

        } else {
            // Load from localStorage if exists and not expired
            const saved = localStorage.getItem('union_digitale_referral');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (new Date().getTime() < parsed.expiresAt) {
                        setReferralData(parsed);
                    } else {
                        localStorage.removeItem('union_digitale_referral');
                        logger.info("Referral tracking expired.");
                    }
                } catch (e) {
                    localStorage.removeItem('union_digitale_referral');
                }
            }
        }
    }, [location]);

    const value = {
        referralData
    };

    return (
        <AffiliationContext.Provider value={value}>
            {children}
        </AffiliationContext.Provider>
    );
};
