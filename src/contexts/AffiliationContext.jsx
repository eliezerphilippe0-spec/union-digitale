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
                timestamp: new Date().toISOString()
            };

            // Save to session storage
            sessionStorage.setItem('union_digitale_referral', JSON.stringify(data));
            setReferralData(data);
            logger.info("Referral tracked:", data);

        } else {
            // Load from session storage if exists
            const saved = sessionStorage.getItem('union_digitale_referral');
            if (saved) {
                setReferralData(JSON.parse(saved));
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
