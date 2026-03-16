import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAppSettings } from '../services/configService';
import Maintenance from '../pages/Maintenance';

const MaintenanceGuard = ({ children }) => {
    const { currentUser } = useAuth();
    const [config, setConfig] = useState({ maintenanceMode: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to real-time maintenance updates
        const unsubscribe = subscribeToAppSettings((newConfig) => {
            console.log('🛠 Maintenance Mode:', newConfig.maintenanceMode);
            setConfig(newConfig);
            setLoading(false);
        });

        // Safety timeout to prevent infinite blank screen if Firebase hangs
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ MaintenanceGuard: Loading timeout, proceeding anyway.');
                setLoading(false);
            }
        }, 3000);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [loading]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'admin' || currentUser?.customClaims?.role === 'admin';

    // If maintenance is ON and user is NOT an admin, show Maintenance page
    if (config.maintenanceMode && !isAdmin) {
        return <Maintenance />;
    }

    return children || <Outlet />;
};

export default MaintenanceGuard;
