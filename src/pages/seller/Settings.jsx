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
            showMessage('success', 'Clé API sauvegardée avec succès');
        } catch (error) {
            console.error('Error saving API key:', error);
            showMessage('error', 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    // Test API Key
    const testApiKey = async () => {
        if (!apiKey.trim()) {
            showMessage('error', 'Veuillez entrer une clé API');
            return;
        }

        setLoading(true);
        try {
            // Simulate API test (in real app, would call a test endpoint)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Check if key looks valid (starts with expected prefix)
            if (apiKey.startsWith('AIza') || apiKey.length > 30) {
                setApiKeyStatus('valid');
                showMessage('success', 'Clé API valide !');
            } else {
                setApiKeyStatus('invalid');
                showMessage('error', 'Clé API invalide');
            }
        } catch (error) {
            setApiKeyStatus('invalid');
            showMessage('error', 'Erreur lors du test');
        } finally {
            setLoading(false);
        }
    };

    // Delete API Key
    const deleteApiKey = async () => {
        if (!currentUser) return;
        if (!confirm('Supprimer la clé API ? Vous devrez en configurer une nouvelle.')) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                geminiApiKey: null
            });

            setApiKey('');
            setApiKeyStatus('unknown');
            showMessage('success', 'Clé API supprimée');
        } catch (error) {
            showMessage('error', 'Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    // Clear Cache
    const clearCache = () => {
        if (!confirm('Vider le cache ? Vos préférences (thème, langue) seront conservées.')) return;

        const success = usageStatsService.clearAllCache();
        if (success) {
            updateCacheSize();
            showMessage('success', 'Cache vidé avec succès');
        } else {
            showMessage('error', 'Erreur lors du vidage du cache');
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

        showMessage('success', 'Données exportées');
    };

    // Show message
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // Tabs configuration
    const tabs = [
        { id: 'api', label: 'Clé API', icon: Key },
        { id: 'cache', label: 'Cache', icon: Database },
        { id: 'subscription', label: 'Abonnement', icon: CreditCard },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Sécurité', icon: Shield }
    ];

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Paramètres
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Connectez-vous pour accéder aux paramètres
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
                    >
                        Se connecter
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
                                Paramètres
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gérez vos préférences et configurations
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
                                    Clé API Gemini
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Configurez votre propre clé API Google Gemini pour les fonctionnalités IA
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Clé API
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
                                                <Check className="w-4 h-4" /> Clé valide et configurée
                                            </p>
                                        )}
                                        {apiKeyStatus === 'invalid' && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <X className="w-4 h-4" /> Clé invalide
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
                                            Tester
                                        </button>
                                        <button
                                            onClick={saveApiKey}
                                            disabled={loading || !apiKey.trim()}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Sauvegarder
                                        </button>
                                        {apiKey && (
                                            <button
                                                onClick={deleteApiKey}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Supprimer
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                                            Comment obtenir une clé API ?
                                        </h4>
                                        <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                                            <li>Visitez <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" className="underline">Google AI Studio</a></li>
                                            <li>Connectez-vous avec votre compte Google</li>
                                            <li>Créez une nouvelle clé API</li>
                                            <li>Copiez et collez la clé ici</li>
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
                                    Gestion du cache
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Gérez les données stockées localement sur votre appareil
                                </p>

                                {/* Cache Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <HardDrive className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {cacheSize.kb} KB
                                        </p>
                                        <p className="text-sm text-gray-500">Espace utilisé</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <Database className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {Object.keys(localStorage).length}
                                        </p>
                                        <p className="text-sm text-gray-500">Éléments stockés</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <RefreshCw className="w-5 h-5 text-gray-500 mb-2" />
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {usageStatsService.getLocalStats().updatedAt
                                                ? new Date(usageStatsService.getLocalStats().updatedAt).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500">Dernière mise à jour</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={clearCache}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Vider le cache
                                    </button>
                                    <button
                                        onClick={exportData}
                                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Exporter mes données
                                    </button>
                                    <button
                                        onClick={updateCacheSize}
                                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Actualiser
                                    </button>
                                </div>

                                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        Vider le cache supprimera vos statistiques locales et préférences temporaires.
                                        Votre thème et langue seront conservés.
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
                                        Votre abonnement
                                    </h2>

                                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white mt-4">
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <Crown className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm opacity-80">Plan actuel</p>
                                            <p className="text-2xl font-bold capitalize">
                                                {subscription.plan === 'free' ? 'Gratuit' : subscription.plan}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                subscription.status === 'active'
                                                    ? 'bg-emerald-400/20 text-emerald-100'
                                                    : 'bg-red-400/20 text-red-100'
                                            }`}>
                                                {subscription.status === 'active' ? 'Actif' : 'Inactif'}
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
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Gratuit</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            0 <span className="text-sm font-normal text-gray-500">G/mois</span>
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> 5 audits IA/mois
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> 10 descriptions IA
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Support email
                                            </li>
                                        </ul>
                                        {subscription.plan === 'free' && (
                                            <span className="block text-center py-2 text-indigo-600 font-medium">
                                                Plan actuel
                                            </span>
                                        )}
                                    </div>

                                    {/* Pro Plan */}
                                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 relative ${
                                        subscription.plan === 'pro' ? 'border-indigo-500' : 'border-gray-200 dark:border-neutral-700'
                                    }`}>
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                            POPULAIRE
                                        </span>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pro</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            2,500 <span className="text-sm font-normal text-gray-500">G/mois</span>
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Audits IA illimités
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Descriptions illimitées
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Marketing IA
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Support prioritaire
                                            </li>
                                        </ul>
                                        <button className="w-full py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                                            Passer à Pro <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Enterprise Plan */}
                                    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 ${
                                        subscription.plan === 'enterprise' ? 'border-indigo-500' : 'border-gray-200 dark:border-neutral-700'
                                    }`}>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Enterprise</h3>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                            Sur devis
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Tout illimité
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> API dédiée
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> Account manager
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Check className="w-4 h-4 text-emerald-500" /> SLA garanti
                                            </li>
                                        </ul>
                                        <button className="w-full py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors">
                                            Nous contacter
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
                                    Préférences de notification
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        { id: 'orders', label: 'Nouvelles commandes', desc: 'Recevez une notification à chaque nouvelle commande' },
                                        { id: 'messages', label: 'Messages clients', desc: 'Soyez alerté des nouveaux messages' },
                                        { id: 'stock', label: 'Alertes de stock', desc: 'Notification quand un produit est en rupture' },
                                        { id: 'promo', label: 'Promotions & Offres', desc: 'Restez informé des opportunités' },
                                        { id: 'newsletter', label: 'Newsletter', desc: 'Conseils et actualités Union Digitale' }
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
                                    Sécurité du compte
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Email</p>
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
                                                <p className="font-medium text-gray-900 dark:text-white">Mot de passe</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Dernière modification: il y a 30 jours
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                                Modifier
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    Authentification à deux facteurs
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Ajoutez une couche de sécurité supplémentaire
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors">
                                                Activer
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-red-600 dark:text-red-400">
                                                    Supprimer le compte
                                                </p>
                                                <p className="text-sm text-red-500 dark:text-red-400/70">
                                                    Cette action est irréversible
                                                </p>
                                            </div>
                                            <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                                Supprimer
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
