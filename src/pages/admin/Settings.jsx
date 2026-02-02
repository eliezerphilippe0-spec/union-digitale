import React, { useState } from 'react';
import { Save, AlertTriangle, Moon, Sun, Percent, Power } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { deployPoliciesToFirestore } from '../../services/policyService';

const AdminSettings = () => {
    const { t } = useLanguage();
    // Mock Settings State (In real app, fetch from 'platform_settings' collection)
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const [settings, setSettings] = useState({
        commissionRate: 10,
        maintenanceMode: false,
        enableAI: true,
        allowNewRegistrations: true,
        supportPhone: '+509 3700-0000'
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        alert(t('settings_saved_success'));
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('platform_settings_title')}</h1>

            {statusMessage && (
                <div className={`p-4 mb-6 rounded-md ${statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="grid gap-6">
                {/* General Config */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Percent className="w-5 h-5 text-secondary" /> {t('finance_commission_title')}
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('commission_rate_label')}</label>
                            <p className="text-xs text-gray-500">{t('commission_rate_desc')}</p>
                        </div>
                        <input
                            type="number"
                            className="w-24 border p-2 rounded text-right font-bold"
                            value={settings.commissionRate}
                            onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* System Controls */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" /> {t('danger_zone_title')}
                    </h2>

                    <div className="flex items-center justify-between py-4 border-b border-gray-50">
                        <div>
                            <div className="font-bold text-gray-800">{t('maintenance_mode_label')}</div>
                            <p className="text-xs text-gray-500">{t('maintenance_mode_desc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <div>
                            <div className="font-bold text-gray-800">{t('seller_registration_label')}</div>
                            <p className="text-xs text-gray-500">{t('seller_registration_desc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.allowNewRegistrations}
                                onChange={(e) => handleChange('allowNewRegistrations', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

                {/* Legal & Compliance Deployment */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-800">
                        {t('legal_policies_title')}
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-gray-800">{t('deploy_policies_label')}</div>
                            <p className="text-xs text-gray-500">{t('deploy_policies_desc')}</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!window.confirm(t('deploy_confirm'))) return;
                                setStatusMessage(null);
                                try {
                                    setLoading(true);
                                    await deployPoliciesToFirestore();
                                    setStatusMessage({ type: 'success', text: t('deploy_success') });
                                } catch (e) {
                                    console.error(e);
                                    setStatusMessage({ type: 'error', text: t('deploy_error').replace('{error}', e.message) });
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
                        >
                            {t('deploy_now_btn')}
                        </button>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {loading ? t('saving_btn') : t('save_changes_btn')}
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </div >
        </div >
    );
};

export default AdminSettings;
