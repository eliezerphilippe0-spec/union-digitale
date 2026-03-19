import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../../utils/analytics';
import { useReferralTracking } from '../../hooks/useReferralTracking';

const RouteTracker = () => {
    const location = useLocation();

    // Track referrals on every route change (Priority 5)
    useReferralTracking();

    useEffect(() => {
        logPageView(location.pathname);
    }, [location]);

    return null;
};

export default RouteTracker;
