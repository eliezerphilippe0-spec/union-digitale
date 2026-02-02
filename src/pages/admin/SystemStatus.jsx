import React, { useState, useEffect } from 'react';
import { monitoringService } from '../../services/monitoringService';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, Server, Wifi, AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const SystemStatus = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth(); // Ensure admin access (assumed protected by layout)
    const [stats, setStats] = useState({
        status: 'healthy',
        metrics: { apiCalls: 0, errors: 0, avgLatency: 0 },
        uptime: 0
    });
    const [recentLogs, setRecentLogs] = useState([]);
    const [services, setServices] = useState([
        { name: 'Firebase Database', status: 'online', lat: '45ms' },
        { name: 'GoApi (MonCash)', status: 'online', lat: '120ms' },
        { name: 'Stripe Gateway', status: 'online', lat: '98ms' },
        { name: 'CDN (Images)', status: 'online', lat: '20ms' },
    ]);

    useEffect(() => {
        // Poll internal monitoring service for realtime local stats
        const interval = setInterval(() => {
            setStats(monitoringService.getSystemHealth());
        }, 2000);

        // Listen to recent critical logs from Firestore
        const logsQuery = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(10));
        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            // Flatten logs because each doc might be a batch
            const fetchedLogs = [];
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.errors) {
                    data.errors.forEach(err => fetchedLogs.push({ ...err, id: doc.id + Math.random() }));
                }
            });
            setRecentLogs(fetchedLogs.slice(0, 10)); // Keep top 10 recent
        });

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, []);

    const simulateCrash = () => {
        monitoringService.logError(new Error("Test Critical Crash triggered by Admin"), "dashboard", "critical");
        alert("Simulated Critical Error - Check Console and Alerts");
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            online: 'bg-green-100 text-green-800',
            degraded: 'bg-yellow-100 text-yellow-800',
            offline: 'bg-red-100 text-red-800'
        };
        const Icons = {
            online: CheckCircle,
            degraded: AlertTriangle,
            offline: XCircle
        };
        const Icon = Icons[status] || Activity;

        return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                <Icon className="w-3 h-3" /> {t(`status_${status}`) || status}
            </span>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Activity className="text-secondary" /> {t('system_health_title')}
                </h1>
                <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">
                        <RefreshCw className="w-4 h-4" /> {t('refresh_btn')}
                    </button>
                    <button onClick={simulateCrash} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold">
                        <AlertTriangle className="w-4 h-4" /> {t('test_crash_btn')}
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-1">{t('system_status_label')}</div>
                    <div className="text-2xl font-bold capitalize">{stats.status}</div>
                    <div className="text-xs text-gray-400 mt-2">{t('running_for').replace('{time}', Math.floor(stats.uptime))}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-1">{t('api_error_rate')}</div>
                    <div className="text-2xl font-bold">
                        {(stats.metrics.apiCalls > 0
                            ? (stats.metrics.errors / stats.metrics.apiCalls * 100).toFixed(2)
                            : 0)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{t('error_count_details').replace('{errors}', stats.metrics.errors).replace('{ops}', stats.metrics.apiCalls)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-1">{t('avg_latency')}</div>
                    <div className="text-2xl font-bold">{stats.metrics.avgLatency.toFixed(0)} ms</div>
                    <div className="text-xs text-gray-400 mt-2">{t('network_perf_label')}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-1">{t('storage_usage')}</div>
                    <div className="text-2xl font-bold">45%</div>
                    <div className="text-xs text-gray-400 mt-2">{t('storage_details').replace('{used}', '450GB').replace('{total}', '1TB')}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Service Health Grid */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Server className="w-5 h-5 text-gray-500" /> {t('external_services')}
                        </h2>
                    </div>
                    <table className="w-full text-left">
                        <tbody className="divide-y">
                            {services.map((svc, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">{svc.name}</td>
                                    <td className="p-4 text-gray-500 font-mono text-sm">{svc.lat}</td>
                                    <td className="p-4 text-right"><StatusBadge status={svc.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recent Logs */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-gray-500" /> {t('recent_alerts')}
                        </h2>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">{t('no_recent_alerts')}</div>
                        ) : (
                            <ul className="divide-y">
                                {recentLogs.map((log, i) => (
                                    <li key={i} className="p-4 hover:bg-gray-50 text-sm border-l-2 border-transparent hover:border-red-500 transition-colors">
                                        <div className="flex justify-between mb-1">
                                            <span className={`font-bold ${log.level === 'critical' ? 'text-red-600' : 'text-orange-600'} uppercase text-xs`}>
                                                {log.level}
                                            </span>
                                            <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-gray-800 font-mono mb-1">{log.message}</p>
                                        <p className="text-gray-500 text-xs">{log.context} - {log.userAgent}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStatus;
