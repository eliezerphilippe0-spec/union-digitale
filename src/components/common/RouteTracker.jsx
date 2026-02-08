import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../../utils/analytics';

const RouteTracker = () => {
    const location = useLocation();

    useEffect(() => {
        logPageView(location.pathname);
    }, [location]);

    return null;
};

export default RouteTracker;
