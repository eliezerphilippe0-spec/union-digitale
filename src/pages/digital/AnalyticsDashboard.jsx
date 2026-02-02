import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Eye,
    Download, Calendar, Filter, RefreshCw, ArrowUpRight, ArrowDownRight,
    Package, Globe, Clock, Target, Zap, FileDown, ChevronDown
} from 'lucide-react';

// Color palette moderne
const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    gradient: ['#3B82F6', '#8B5CF6', '#EC4899']
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Composant KPI Card moderne avec animation
const KPICard = ({ title, value, change, changeType, icon: Icon, color, subtitle, loading }) => {
    const isPositive = changeType === 'positive';

    return (
        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            {/* Background gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 bg-${color}-500`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                            isPositive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                )}
                {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

// Composant pour les graphiques avec titre
const ChartCard = ({ title, subtitle, children, action }) => (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

// Tooltip personnalisé
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} {entry.name.includes('Revenu') ? 'G' : ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Données de démonstration pour les visiteurs non connectés
const DEMO_DATA = {
    totalRevenue: 847500,
    totalSales: 156,
    conversionRate: 4.8,
    averageOrderValue: 5433,
    topProducts: [
        { name: 'Formation Marketing Digital', image: null, sales: 45, revenue: 225000 },
        { name: 'Ebook - Guide SEO 2024', image: null, sales: 38, revenue: 152000 },
        { name: 'Template Business Pro', image: null, sales: 32, revenue: 128000 },
        { name: 'Cours Complet React', image: null, sales: 28, revenue: 196000 },
        { name: 'Pack Audio Podcast', image: null, sales: 13, revenue: 78000 }
    ],
    salesByDay: [
        { name: 'Lun', ventes: 18, revenus: 95000 },
        { name: 'Mar', ventes: 24, revenus: 125000 },
        { name: 'Mer', ventes: 21, revenus: 108000 },
        { name: 'Jeu', ventes: 32, revenus: 168000 },
        { name: 'Ven', ventes: 28, revenus: 145000 },
        { name: 'Sam', ventes: 19, revenus: 98000 },
        { name: 'Dim', ventes: 14, revenus: 72000 }
    ],
    salesByCategory: [
        { name: 'Cours', value: 421000 },
        { name: 'Ebook', value: 152000 },
        { name: 'Template', value: 128000 },
        { name: 'Audio', value: 78000 },
        { name: 'Autre', value: 68500 }
    ],
    recentOrders: [
        { id: 'demo001', digitalItems: [{ title: 'Formation Marketing Digital', image: null }], customerEmail: 'jean.pierre@email.com', createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 30) }, digitalTotal: 5000 },
        { id: 'demo002', digitalItems: [{ title: 'Ebook - Guide SEO 2024', image: null }], customerEmail: 'marie.claire@email.com', createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 120) }, digitalTotal: 4000 },
        { id: 'demo003', digitalItems: [{ title: 'Template Business Pro', image: null }], customerEmail: 'paul.durand@email.com', createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 180) }, digitalTotal: 4000 },
        { id: 'demo004', digitalItems: [{ title: 'Cours Complet React', image: null }], customerEmail: 'sophie.martin@email.com', createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 240) }, digitalTotal: 7000 },
        { id: 'demo005', digitalItems: [{ title: 'Pack Audio Podcast', image: null }], customerEmail: 'luc.bernard@email.com', createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 300) }, digitalTotal: 6000 }
    ]
};

const AnalyticsDashboard = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    // États - toujours déclarés de la même manière
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalRevenue: 0,
        totalSales: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        topProducts: [],
        salesByDay: [],
        salesByCategory: [],
        recentOrders: []
    });

    // Mode démo calculé après les hooks
    const isDemo = !currentUser;

    // Charger les données
    const fetchData = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

            // Récupérer les commandes de produits digitaux
            const ordersQuery = query(
                collection(db, 'orders'),
                where('status', '==', 'paid'),
                orderBy('createdAt', 'desc'),
                limit(500)
            );

            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersData = [];

            ordersSnapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                // Filtrer les commandes avec des produits digitaux
                const digitalItems = order.items?.filter(item => item.type === 'digital') || [];
                if (digitalItems.length > 0) {
                    ordersData.push({
                        ...order,
                        digitalItems,
                        digitalTotal: digitalItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
                    });
                }
            });

            // Récupérer les produits digitaux
            const productsQuery = query(
                collection(db, 'products'),
                where('type', '==', 'digital'),
                limit(100)
            );

            const productsSnapshot = await getDocs(productsQuery);
            const productsData = [];
            productsSnapshot.forEach(doc => {
                productsData.push({ id: doc.id, ...doc.data() });
            });

            // Calculer les analytics
            const totalRevenue = ordersData.reduce((sum, order) => sum + order.digitalTotal, 0);
            const totalSales = ordersData.length;
            const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

            // Calculer les ventes par jour
            const salesByDayMap = {};
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

            // Initialiser les 7 derniers jours
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayKey = days[date.getDay()];
                salesByDayMap[dayKey] = { name: dayKey, ventes: 0, revenus: 0 };
            }

            ordersData.forEach(order => {
                if (order.createdAt?.toDate) {
                    const date = order.createdAt.toDate();
                    const dayKey = days[date.getDay()];
                    if (salesByDayMap[dayKey]) {
                        salesByDayMap[dayKey].ventes += 1;
                        salesByDayMap[dayKey].revenus += order.digitalTotal;
                    }
                }
            });

            // Top produits
            const productSalesMap = {};
            ordersData.forEach(order => {
                order.digitalItems.forEach(item => {
                    const key = item.productId || item.id || item.title;
                    if (!productSalesMap[key]) {
                        productSalesMap[key] = {
                            name: item.title,
                            image: item.image,
                            sales: 0,
                            revenue: 0
                        };
                    }
                    productSalesMap[key].sales += item.quantity || 1;
                    productSalesMap[key].revenue += item.price * (item.quantity || 1);
                });
            });

            const topProducts = Object.values(productSalesMap)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // Ventes par catégorie (simulé basé sur les titres)
            const categoryMap = {
                'Ebook': 0,
                'Cours': 0,
                'Template': 0,
                'Audio': 0,
                'Autre': 0
            };

            ordersData.forEach(order => {
                order.digitalItems.forEach(item => {
                    const title = (item.title || '').toLowerCase();
                    if (title.includes('ebook') || title.includes('livre') || title.includes('pdf')) {
                        categoryMap['Ebook'] += item.price;
                    } else if (title.includes('cours') || title.includes('formation') || title.includes('training')) {
                        categoryMap['Cours'] += item.price;
                    } else if (title.includes('template') || title.includes('theme')) {
                        categoryMap['Template'] += item.price;
                    } else if (title.includes('audio') || title.includes('music') || title.includes('podcast')) {
                        categoryMap['Audio'] += item.price;
                    } else {
                        categoryMap['Autre'] += item.price;
                    }
                });
            });

            const salesByCategory = Object.entries(categoryMap)
                .filter(([_, value]) => value > 0)
                .map(([name, value]) => ({ name, value }));

            setOrders(ordersData);
            setProducts(productsData);
            setAnalytics({
                totalRevenue,
                totalSales,
                conversionRate: 4.5, // Estimation - nécessite Google Analytics pour le vrai taux
                averageOrderValue,
                topProducts,
                salesByDay: Object.values(salesByDayMap),
                salesByCategory: salesByCategory.length > 0 ? salesByCategory : [{ name: 'Aucune donnée', value: 1 }],
                recentOrders: ordersData.slice(0, 5)
            });

        } catch (error) {
            console.error('Erreur lors du chargement des analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            // Mode démo - charger les données fictives
            setOrders(DEMO_DATA.recentOrders);
            setAnalytics(DEMO_DATA);
            setLoading(false);
        } else {
            fetchData();
        }
    }, [currentUser, dateRange]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Export CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Produit', 'Quantité', 'Prix', 'Client'];
        const rows = orders.flatMap(order =>
            order.digitalItems.map(item => [
                order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
                item.title,
                item.quantity || 1,
                item.price,
                order.customerEmail || 'N/A'
            ])
        );

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-digital-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Métriques estimées (nécessiteraient Google Analytics pour les vraies données)
    const estimatedMetrics = {
        visits: Math.round(analytics.totalSales / 0.045), // Basé sur 4.5% conversion
        bounceRate: 65,
        avgSessionDuration: 127,
        countries: 12
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Bannière Mode Démo */}
                {isDemo && (
                    <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold">{t('demo_mode')}</p>
                                <p className="text-sm text-white/90">{t('demo_mode_desc')}</p>
                            </div>
                        </div>
                        <a
                            href="/login"
                            className="px-4 py-2 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors"
                        >
                            {t('login')}
                        </a>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            {t('analytics_title')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {isDemo ? t('demo_preview') : t('analytics_subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtre de date */}
                        <div className="relative">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="appearance-none bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                            >
                                <option value="7">{t('last_7_days')}</option>
                                <option value="30">{t('last_30_days')}</option>
                                <option value="90">{t('last_90_days')}</option>
                                <option value="365">{t('this_year')}</option>
                            </select>
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Bouton refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                            title={t('refresh')}
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            <FileDown className="w-4 h-4" />
                            {t('export_csv')}
                        </button>
                    </div>
                </div>

                {/* KPIs principaux */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title={t('total_revenue')}
                        value={`${analytics.totalRevenue.toLocaleString()} G`}
                        change={12}
                        changeType="positive"
                        icon={DollarSign}
                        color="blue"
                        subtitle={t('digital_products')}
                        loading={loading}
                    />
                    <KPICard
                        title={t('sales')}
                        value={analytics.totalSales.toString()}
                        change={8}
                        changeType="positive"
                        icon={ShoppingCart}
                        color="green"
                        subtitle={`${t('avg_cart')}: ${Math.round(analytics.averageOrderValue).toLocaleString()} G`}
                        loading={loading}
                    />
                    <KPICard
                        title={t('conversion_rate')}
                        value={`${analytics.conversionRate}%`}
                        change={2}
                        changeType="positive"
                        icon={Target}
                        color="purple"
                        subtitle={t('visits_to_purchases')}
                        loading={loading}
                    />
                    <KPICard
                        title={t('estimated_visits')}
                        value={estimatedMetrics.visits.toLocaleString()}
                        change={15}
                        changeType="positive"
                        icon={Eye}
                        color="amber"
                        subtitle={t('page_views')}
                        loading={loading}
                    />
                </div>

                {/* Métriques secondaires */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('bounce_rate')}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{estimatedMetrics.bounceRate}%</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('session_duration')}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{estimatedMetrics.avgSessionDuration}s</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('active_countries')}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{estimatedMetrics.countries}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('active_products')}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{products.length}</p>
                        </div>
                    </div>
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Graphique principal - Évolution des ventes */}
                    <ChartCard
                        title={t('sales_evolution')}
                        subtitle={t('last_7_days')}
                        action={
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                                    {t('revenue')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-green-500" />
                                    {t('sales')}
                                </span>
                            </div>
                        }
                    >
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.salesByDay}>
                                    <defs>
                                        <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenus"
                                        name="Revenus"
                                        stroke={COLORS.primary}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenu)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ventes"
                                        name="Ventes"
                                        stroke={COLORS.secondary}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorVentes)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Graphique Pie - Ventes par catégorie */}
                    <ChartCard title={t('sales_by_category')} subtitle={t('revenue_distribution')}>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.salesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {analytics.salesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Top Produits */}
                    <ChartCard title={t('top_products')} subtitle={t('by_revenue')}>
                        <div className="space-y-4">
                            {analytics.topProducts.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    {t('no_data_available')}
                                </p>
                            ) : (
                                analytics.topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.sales} {t('sales_count')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">{product.revenue.toLocaleString()} G</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ChartCard>
                </div>

                {/* Commandes récentes */}
                <ChartCard title={t('recent_orders')} subtitle={t('recent_transactions')}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-neutral-700">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('product')}</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('client')}</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('date')}</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                                {analytics.recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            {t('no_recent_orders')}
                                        </td>
                                    </tr>
                                ) : (
                                    analytics.recentOrders.map((order, index) => (
                                        <tr key={order.id || index} className="hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                                    #{order.id?.slice(-6) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {order.digitalItems[0]?.image ? (
                                                        <img
                                                            src={order.digitalItems[0].image}
                                                            alt=""
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {order.digitalItems[0]?.title || 'Produit digital'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                {order.customerEmail || order.userEmail || 'Client'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                                                {order.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                    {order.digitalTotal?.toLocaleString()} G
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>

                {/* Footer info */}
                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        {t('analytics_note')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
