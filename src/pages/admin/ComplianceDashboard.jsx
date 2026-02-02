import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Shield, ShieldAlert, FileText, User, Clock, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { complianceService } from '../../services/complianceService';

const ComplianceDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testText, setTestText] = useState('');
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        // Listen to compliance audit logs
        const q = query(
            collection(db, 'compliance_events'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(fetchedEvents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleTestCheck = async () => {
        if (!testText) return;
        const result = await complianceService.checkContent({
            title: testText,
            description: "Test description"
        }, currentUser);
        setTestResult(result);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="text-secondary" /> {t('compliance_title')}
                </h1>
                <div className="bg-white px-4 py-2 rounded border border-gray-200 text-sm font-semibold text-gray-500">
                    {t('compliance_mode_label')}: <span className="text-green-600">{t('compliance_mode_strict')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Simulator Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5 text-gray-500" /> {t('simulator_title')}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('product_title_label')}</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-secondary focus:border-transparent outline-none"
                                    placeholder={t('product_title_placeholder')}
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleTestCheck}
                                className="w-full bg-gray-900 text-white py-2 rounded font-bold hover:bg-gray-800 transition"
                            >
                                {t('check_compliance_btn')}
                            </button>

                            {testResult && (
                                <div className={`p-4 rounded mt-4 border ${testResult.allowed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    <div className="font-bold flex items-center gap-2">
                                        {testResult.allowed ? '✅ Approuvé' : '🚫 REJETÉ'}
                                    </div>
                                    {!testResult.allowed && (
                                        <div className="mt-2 text-sm">
                                            <p className="font-semibold">{testResult.reason}</p>
                                            <ul className="list-disc pl-5 mt-1">
                                                {testResult.violations.map((v, i) => (
                                                    <li key={i}>
                                                        Terme: <strong>{v.term}</strong> ({v.category})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg shadow-sm mt-6 border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-2">{t('active_rules_title')}</h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• {t('rule_firearms')}</li>
                            <li>• {t('rule_drugs')}</li>
                            <li>• {t('rule_fake_docs')}</li>
                            <li>• {t('rule_hate_speech')}</li>
                        </ul>
                    </div>
                </div>

                {/* Violation Feed Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" /> {t('violation_feed_title')}
                            </h2>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{t('recent_count').replace('{count}', events.length)}</span>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">{t('loading_logs')}</div>
                            ) : events.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Shield className="w-12 h-12 text-green-200 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">{t('no_violations')}</p>
                                    <p className="text-gray-400 text-sm">{t('system_monitoring')}</p>
                                </div>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${event.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {event.severity}
                                                </span>
                                                <span className="font-mono text-sm text-gray-500">{event.auditId || event.id.slice(0, 8)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {event.timestamp?.toDate ? event.timestamp.toDate().toLocaleString() : 'Récemment'}
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <h3 className="font-bold text-gray-900">{event.contentSummary?.title || t('untitled_label')}</h3>
                                            <div className="text-sm text-red-600 mt-1">
                                                {t('detected_label')} {event.violations?.map(v => v.term).join(', ')}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                {event.userEmail}
                                            </div>
                                            <div className="font-mono">
                                                {t('category_label')} {event.violations?.[0]?.category}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDashboard;
