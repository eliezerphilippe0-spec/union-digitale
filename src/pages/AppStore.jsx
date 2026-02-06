/**
 * App Store / Extensions Marketplace
 * Inspired by: Shopify App Store, WordPress Plugins, Salesforce AppExchange
 */

import React, { useState } from 'react';
import {
    Search, Star, Download, Check, ExternalLink, Filter, Grid, List,
    Zap, TrendingUp, Shield, Clock, Users, ChevronRight, Sparkles
} from 'lucide-react';

// Mock apps data
const APPS = [
    {
        id: 'app_1',
        name: 'WhatsApp Business',
        description: 'Connectez votre boutique à WhatsApp pour le support client et les notifications de commandes.',
        longDescription: 'Intégration complète avec WhatsApp Business API. Envoyez des confirmations de commandes, mises à jour de livraison, et offrez un support client instantané.',
        icon: '💬',
        category: 'communication',
        rating: 4.9,
        reviews: 2341,
        installs: '50K+',
        price: 'Gratuit',
        isPremium: false,
        developer: 'Union Digitale',
        isVerified: true,
        isInstalled: true,
        features: ['Notifications automatiques', 'Chatbot intégré', 'Catalogue produits', 'Paiements in-chat'],
        screenshots: ['📱', '💬', '🛒'],
    },
    {
        id: 'app_2',
        name: 'Analytics Pro',
        description: 'Tableaux de bord avancés avec prévisions IA et analyses de cohortes.',
        longDescription: 'Obtenez des insights profonds sur vos ventes avec des rapports personnalisés, prévisions basées sur l\'IA, et analyses de comportement client.',
        icon: '📊',
        category: 'analytics',
        rating: 4.8,
        reviews: 892,
        installs: '25K+',
        price: '2,500 G/mois',
        isPremium: true,
        developer: 'DataViz Labs',
        isVerified: true,
        isInstalled: false,
        features: ['Prévisions IA', 'Rapports personnalisés', 'Export Excel/PDF', 'Alertes automatiques'],
        screenshots: ['📈', '📊', '🎯'],
    },
    {
        id: 'app_3',
        name: 'Email Marketing',
        description: 'Créez des campagnes email automatisées pour fidéliser vos clients.',
        longDescription: 'Solution complète d\'email marketing avec templates prêts à l\'emploi, automatisation des séquences, et analyses de performance.',
        icon: '📧',
        category: 'marketing',
        rating: 4.7,
        reviews: 1567,
        installs: '35K+',
        price: '1,500 G/mois',
        isPremium: true,
        developer: 'MailFlow',
        isVerified: true,
        isInstalled: false,
        features: ['Templates drag & drop', 'Automatisation', 'Segmentation', 'A/B Testing'],
        screenshots: ['📧', '✉️', '📬'],
    },
    {
        id: 'app_4',
        name: 'Inventory Sync',
        description: 'Synchronisez votre inventaire en temps réel avec plusieurs canaux de vente.',
        longDescription: 'Gérez votre stock sur Union Digitale, votre boutique physique, et d\'autres marketplaces depuis un seul endroit.',
        icon: '📦',
        category: 'inventory',
        rating: 4.6,
        reviews: 445,
        installs: '10K+',
        price: '2,000 G/mois',
        isPremium: true,
        developer: 'StockMaster',
        isVerified: true,
        isInstalled: false,
        features: ['Sync multi-canal', 'Alertes stock bas', 'Prévisions de demande', 'Rapports'],
        screenshots: ['📦', '🔄', '📋'],
    },
    {
        id: 'app_5',
        name: 'Reviews & Ratings',
        description: 'Collectez et affichez les avis clients avec photos et vidéos.',
        longDescription: 'Augmentez la confiance des acheteurs avec des avis vérifiés, photos de clients, et widgets de notation.',
        icon: '⭐',
        category: 'social-proof',
        rating: 4.9,
        reviews: 3210,
        installs: '75K+',
        price: 'Gratuit',
        isPremium: false,
        developer: 'Union Digitale',
        isVerified: true,
        isInstalled: true,
        features: ['Avis avec photos', 'Email de demande', 'Widget personnalisable', 'Modération'],
        screenshots: ['⭐', '📸', '💬'],
    },
    {
        id: 'app_6',
        name: 'Loyalty Program',
        description: 'Programme de fidélité gamifié avec points, badges et récompenses.',
        longDescription: 'Fidélisez vos clients avec un système de points, niveaux VIP, badges et récompenses personnalisables.',
        icon: '🏆',
        category: 'loyalty',
        rating: 4.8,
        reviews: 1823,
        installs: '40K+',
        price: '3,000 G/mois',
        isPremium: true,
        developer: 'Union Digitale',
        isVerified: true,
        isInstalled: false,
        features: ['Points & récompenses', 'Niveaux VIP', 'Badges gamifiés', 'Parrainage'],
        screenshots: ['🏆', '💎', '🎁'],
    },
    {
        id: 'app_7',
        name: 'Live Shopping',
        description: 'Vendez en direct avec streaming vidéo et chat en temps réel.',
        longDescription: 'Organisez des sessions de vente en direct, interagissez avec vos clients en temps réel, et boostez vos conversions.',
        icon: '🎥',
        category: 'sales',
        rating: 4.7,
        reviews: 678,
        installs: '15K+',
        price: '5,000 G/mois',
        isPremium: true,
        developer: 'StreamSell',
        isVerified: true,
        isInstalled: false,
        features: ['Streaming HD', 'Chat en direct', 'Achat en 1 clic', 'Replays'],
        screenshots: ['🎥', '📺', '🛒'],
    },
    {
        id: 'app_8',
        name: 'SEO Optimizer',
        description: 'Optimisez vos fiches produits pour Google et les moteurs de recherche.',
        longDescription: 'Améliorez votre visibilité avec des recommandations SEO automatiques, meta tags optimisés, et sitemap automatique.',
        icon: '🔍',
        category: 'marketing',
        rating: 4.5,
        reviews: 934,
        installs: '20K+',
        price: '1,000 G/mois',
        isPremium: true,
        developer: 'SEO Pro',
        isVerified: false,
        isInstalled: false,
        features: ['Audit SEO', 'Meta tags auto', 'Sitemap', 'Structured data'],
        screenshots: ['🔍', '📈', '🎯'],
    },
];

const CATEGORIES = [
    { id: 'all', name: 'Tous', icon: '📱' },
    { id: 'marketing', name: 'Marketing', icon: '📣' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'sales', name: 'Ventes', icon: '💰' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'inventory', name: 'Inventaire', icon: '📦' },
    { id: 'loyalty', name: 'Fidélité', icon: '🏆' },
    { id: 'social-proof', name: 'Avis', icon: '⭐' },
];

// App Card Component
const AppCard = ({ app, onInstall, onView }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                {app.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{app.name}</h3>
                    {app.isVerified && (
                        <span className="text-blue-500" title="Vérifié">✓</span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{app.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-gray-700">{app.rating}</span>
                        <span className="text-gray-400">({app.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Download className="w-4 h-4" />
                        {app.installs}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className={`text-sm font-medium ${app.isPremium ? 'text-gold-600' : 'text-green-600'}`}>
                {app.price}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => onView(app)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Détails
                </button>
                {app.isInstalled ? (
                    <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg flex items-center gap-1">
                        <Check className="w-4 h-4" /> Installé
                    </span>
                ) : (
                    <button
                        onClick={() => onInstall(app)}
                        className="px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors"
                    >
                        Installer
                    </button>
                )}
            </div>
        </div>
    </div>
);

// App Detail Modal
const AppDetailModal = ({ app, onClose, onInstall }) => {
    if (!app) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-4xl">
                            {app.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-900">{app.name}</h2>
                                {app.isVerified && <span className="text-blue-500 text-xl">✓</span>}
                            </div>
                            <p className="text-gray-500">{app.developer}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="font-bold text-gray-900">{app.rating}</span>
                                    <span className="text-gray-400">({app.reviews} avis)</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">{app.installs} installations</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Screenshots */}
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                        {app.screenshots.map((screenshot, index) => (
                            <div key={index} className="w-32 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-5xl flex-shrink-0">
                                {screenshot}
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{app.longDescription}</p>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3">Fonctionnalités</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {app.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-gray-600">
                                    <Check className="w-5 h-5 text-green-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Prix</p>
                                <p className={`text-2xl font-bold ${app.isPremium ? 'text-gold-600' : 'text-green-600'}`}>
                                    {app.price}
                                </p>
                            </div>
                            {app.isInstalled ? (
                                <span className="px-6 py-3 text-green-600 bg-green-100 rounded-xl flex items-center gap-2 font-bold">
                                    <Check className="w-5 h-5" /> Installé
                                </span>
                            ) : (
                                <button
                                    onClick={() => onInstall(app)}
                                    className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    Installer maintenant
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Store Component
const AppStore = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'free' | 'premium' | 'installed'

    const filteredApps = APPS.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
        const matchesFilter = filter === 'all' ||
            (filter === 'free' && !app.isPremium) ||
            (filter === 'premium' && app.isPremium) ||
            (filter === 'installed' && app.isInstalled);
        return matchesSearch && matchesCategory && matchesFilter;
    });

    const handleInstall = (app) => {
        // In production, this would trigger the installation flow
        alert(`Installation de "${app.name}" en cours...`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            App Store Union Digitale
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">
                            Découvrez des applications pour booster votre boutique
                        </p>
                        
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher des applications..."
                                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                                selectedCategory === cat.id
                                    ? 'bg-gold-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: 'Tous' },
                            { id: 'free', label: 'Gratuit' },
                            { id: 'premium', label: 'Premium' },
                            { id: 'installed', label: 'Installés' },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    filter === f.id
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-sm text-gray-500">{filteredApps.length} applications</span>
                </div>

                {/* Featured Apps */}
                {filter === 'all' && selectedCategory === 'all' && !searchQuery && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold-500" />
                            Applications recommandées
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {APPS.filter(a => a.isVerified && a.rating >= 4.8).slice(0, 3).map(app => (
                                <AppCard
                                    key={app.id}
                                    app={app}
                                    onInstall={handleInstall}
                                    onView={setSelectedApp}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Apps */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {filter === 'installed' ? 'Mes applications' : 'Toutes les applications'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredApps.map(app => (
                            <AppCard
                                key={app.id}
                                app={app}
                                onInstall={handleInstall}
                                onView={setSelectedApp}
                            />
                        ))}
                    </div>
                </div>

                {filteredApps.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune application trouvée</p>
                    </div>
                )}
            </div>

            {/* App Detail Modal */}
            <AppDetailModal
                app={selectedApp}
                onClose={() => setSelectedApp(null)}
                onInstall={handleInstall}
            />
        </div>
    );
};

export default AppStore;
