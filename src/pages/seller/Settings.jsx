import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usageStatsService } from '../../services/usageStatsService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    Settings as SettingsIcon, Key, Database, CreditCard, Bell, Shield,
    Trash2, Download, RefreshCw, Check, X, Eye, EyeOff, Loader,
    AlertTriangle, CheckCircle, HardDrive, Zap, Crown, ChevronRight
} from 'lucide-react';

const Settings = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState('api');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState('unknown'); // unknown, valid, invalid

    // Cache State
    const [cacheSize, setCacheSize] = useState({ kb: '0', mb: '0' });

    // Subscription State
    const [subscription, setSubscription] = useState({
        plan: 'free',
        status: 'active',
        expiresAt: null,
        features: []
    });

    // Load settings
    useEffect(() => {
        loadSettings();
        updateCacheSize();
    }, [currentUser]);

    const loadSettings = async () => {
        if (!currentUser) return;

        try {
            // Load API key from user settings
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.geminiApiKey) {
                    setApiKey(data.geminiApiKey);
                    setApiKeyStatus('valid');
                }
                if (data.subscription) {
                    setSubscription(data.subscription);
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateCacheSize = () => {
        const size = usageStatsService.getCacheSize();
        setCacheSize(size);
    };

    // Save API Key
    const saveApiKey = async () => {
        if (!currentUser || !apiKey.trim()) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                geminiApiKey: apiKey.trim(),
                updatedAt: new Date().toISOString()
            });

            setApiKeyStatus('valid');
            showMessage('success', t('seller_settings_api_saved'));
        } catch (error) {
            console.error('Error saving API key:', error);
            showMessage('error', t('seller_settings_api_save_error'));
        } finally {
            setLoading(false);
        }
    };

    // Test API Key
    const testApiKey = async () => {
        if (!apiKey.trim()) {
            showMessage('error', t('seller_settings_api_enter_required'));
            return;
        }

        setLoading(true);
        try {
            // Simulate API test (in real app, would call a test endpoint)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check if key looks valid (starts with expected prefix)
            if (apiKey.startsWith('AIza') || apiKey.length > 30) {
                setApiKeyStatus('valid');
                showMessage('success', t('seller_settings_api_valid'));
            } else {
                setApiKeyStatus('invalid');
                showMessage('error', t('seller_settings_api_invalid'));
            }
        } catch (error) {
            setApiKeyStatus('invalid');
            showMessage('error', t('seller_settings_api_test_error'));
        } finally {
            setLoading(false);
        }
    };

    // Delete API Key
    const deleteApiKey = async () => {
        if (!currentUser) return;
        if (!confirm(t('seller_settings_api_delete_confirm'))) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                geminiApiKey: null
            });

            setApiKey('');
            setApiKeyStatus('unknown');
            showMessage('success', t('seller_settings_api_deleted'));
        } catch (error) {
            showMessage('error', t('seller_settings_api_delete_error'));
        } finally {
            setLoading(false);
        }
    };

    // Clear Cache
    const clearCache = () => {
        if (!confirm(t('seller_settings_cache_clear_confirm'))) return;

        const success = usageStatsService.clearAllCache();
        if (success) {
            updateCacheSize();
            showMessage('success', t('seller_settings_cache_cleared'));
        } else {
            showMessage('error', t('seller_settings_cache_clear_error'));
        }
    };

    // Export Data
    const exportData = () => {
        const stats = usageStatsService.getAllStats();
        const data = {
            exportedAt: new Date().toISOString(),
            userId: currentUser?.uid,
            stats,
            subscription
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `union-digitale-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showMessage('success', t('seller_settings_data_exported'));
    };

    // Show message
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // Tabs configuration
    const tabs = [
        { id: 'api', label: t('seller_settings_tab_api'), icon: Key },
        { id: 'cache', label: t('seller_settings_tab_cache'), icon: Database },
        { id: 'subscription', label: t('seller_settings_tab_subscription'), icon: CreditCard },
        { id: 'notifications', label: t('seller_settings_tab_notifications'), icon: Bell },
        { id: 'security', label: t('seller_settings_tab_security'), icon: Shield }
    ];

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('seller_settings_title')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('seller_settings_login_required')}
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
                    >
                        {t('login')}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-100 dark:bg-neutral-700 rounded-xl">
                            <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('seller_settings_title')}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('seller_settings_subtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="md:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700/50 border-l-4 border-transparent'
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {/* API Key Tab */}
                        {activeTab === 'api' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-indigo-500" />
                                    {t('seller_settings_api_title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    {t('seller_settings_api_desc')}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {t('seller_settings_api_label')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="AIzaSy..."
                                                className="w-full p-3 pr-24 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                                            >
                                                {showApiKey ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                                            </button>
                                        </div>
                                        {apiKeyStatus === 'valid' && (
                                            <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                                                <Check className="w-4 h-4" /> {t('seller_settings_api_status_valid')}
                                            </p>
                                        )}
                                        {apiKeyStatus === 'invalid' && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <X className="w-4 h-4" /> {t('seller_settings_api_status_invalid')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={testApiKey}
                                            disabled={loading || !apiKey.trim()}
                                            className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            {t('seller_settings_api_test_btn')}
                                        </button>
                                        <button
                                            onClick={saveApiKey}
                                            disabled={loading || !apiKey.trim()}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            {t('seller_settings_api_save_btn')}
                                        </button>
                                        {apiKey && (
                                            <button
                                                onClick={deleteApiKey}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {t('seller_settings_api_delete_btn')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                                            {t('seller_settings_api_help_title')}
                                        </h4>
                                        <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                                            <li>{t('seller_settings_api_help_step1')} <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" className="underline">Google AI Studio</a></li>
                                            <li>{t('seller_settings_api_help_step2')}</li>
                                            <li>{t('seller_settings_api_help_step3')}</li>
                                            <li>{t('seller_settings_api_help_step4')}</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cache Tab */}
                        {activeTab === 'cache' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-indigo-500" />
                                    {t('seller_settings_cache_title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    {t('seller_settings_cache_desc')}
                                </p>

                                {/* Cache Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <HardDrive className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {cacheSize.kb} KB
                                        </p>
                                        <p className="text-sm text-gray-500">{t('seller_settings_cache_space_used')}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <Database className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {Object.keys(localStorage).length}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('seller_settings_cache_items')}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {usageStatsService.getLocalStats().updatedAt
                                                ? new Date(usageStatsService.getLocalStats().updatedAt).toLocaleDateString()
                                                : t('seller_settings_na')}
                                        </p>
                                        <p className="text-sm text-gray-500">{t('seller_settings_last_updated')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={clearCache}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {t('seller_settings_cache_clear_btn')}
                                    </button>
                                    <button
                                        onClick={exportData}
                                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        {t('seller_settings_export_data_btn')}
                                    </button>
                                    <button
                                        onClick={updateCacheSize}
                                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        {t('seller_settings_refresh_btn')}
                                    </button>
                                </div>

                                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {t('seller_settings_cache_warning')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Subscription Tab */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-6">
                                {/* Current Plan */}
                                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-indigo-500" />
                                        {t('seller_settings_subscription_title')}
                                    </h2>

                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white mt-4">
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <Crown className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm opacity-80">{t('seller_settings_current_plan')}</p>
                                            <p className="text-2xl font-bold capitalize">
                                                {subscription.plan === 'free' ? t('seller_settings_plan_free') : subscription.plan}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                subscription.status === 'active'
                                                    ? 'bg-emerald-400/20 text-emerald-100'
                                                    : 'bg-red-400/20 text-red-100'
                                            }`}>
                                                {subscription.status === 'active' ? t('seller_settings_status_active') : t('seller_settings_status_inactive')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Plans */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Free Plan */}
                                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 ${
                                        subscription.plan === 'free' ? 'border-indigo-500' : 'border-gray-200 dark:border-neutral-700'
                                    }`}>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('seller_settings_plan_free')}</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            0 <span className="text-sm font-normal text-gray-500">{t('seller_settings_per_month')}</span>
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_free_feature_audits')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_free_feature_descriptions')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_free_feature_support')}
                                            </li>
                                        </ul>
                                        {subscription.plan === 'free' && (
                                            <span className="block text-center py-2 text-indigo-600 font-medium">
                                                {t('seller_settings_current_plan')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Pro Plan */}
                                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 relative ${
                                        subscription.plan === 'pro' ? 'border-indigo-500' : 'border-gray-200 dark:border-neutral-700'
                                    }`}>
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                            {t('seller_settings_popular_badge')}
                                        </span>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('seller_settings_plan_pro')}</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            2,500 <span className="text-sm font-normal text-gray-500">{t('seller_settings_per_month')}</span>
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_pro_feature_audits')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_pro_feature_descriptions')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_pro_feature_marketing')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_pro_feature_support')}
                                            </li>
                                        </ul>
                                        <button className="w-full py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                                            {t('seller_settings_upgrade_pro_btn')} <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Enterprise Plan */}
                                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 ${
                                        subscription.plan === 'enterprise' ? 'border-indigo-500' : 'border-gray-200 dark:border-neutral-700'
                                    }`}>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('seller_settings_plan_enterprise')}</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            {t('seller_settings_custom_quote')}
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_enterprise_feature_unlimited')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_enterprise_feature_api')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_enterprise_feature_manager')}
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> {t('seller_settings_enterprise_feature_sla')}
                                            </li>
                                        </ul>
                                        <button className="w-full py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors">
                                            {t('seller_settings_contact_btn')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-indigo-500" />
                                    {t('seller_settings_notifications_title')}
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        { id: 'orders', label: t('seller_settings_notify_orders_label'), desc: t('seller_settings_notify_orders_desc') },
                                        { id: 'messages', label: t('seller_settings_notify_messages_label'), desc: t('seller_settings_notify_messages_desc') },
                                        { id: 'stock', label: t('seller_settings_notify_stock_label'), desc: t('seller_settings_notify_stock_desc') },
                                        { id: 'promo', label: t('seller_settings_notify_promos_label'), desc: t('seller_settings_notify_promos_desc') },
                                        { id: 'newsletter', label: t('seller_settings_notify_newsletter_label'), desc: t('seller_settings_notify_newsletter_desc') }
                                    ].map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-indigo-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                    {t('seller_settings_security_title')}
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{t('seller_settings_security_email')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {currentUser?.email}
                                                </p>
                                            </div>
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{t('seller_settings_security_password')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('seller_settings_security_password_updated')}
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                                {t('seller_settings_security_edit_btn')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {t('seller_settings_security_2fa')}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('seller_settings_security_2fa_desc')}
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors">
                                                {t('seller_settings_security_enable_btn')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-red-600 dark:text-red-400">
                                                    {t('seller_settings_security_delete_title')}
                                                </p>
                                                <p className="text-sm text-red-500 dark:text-red-400/70">
                                                    {t('seller_settings_security_delete_desc')}
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                                {t('seller_settings_security_delete_btn')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
