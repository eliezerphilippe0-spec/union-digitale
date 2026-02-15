import { useState, useEffect } from 'react';
import {
    DollarSign, Users, ShoppingBag, TrendingUp, TrendingDown, RefreshCw,
    Package, Truck, AlertTriangle, Globe, ArrowUpRight, ArrowDownRight,
    Search, Bell, Download, Filter, ShoppingCart, MoreVertical, ChevronRight,
    Wallet, CreditCard, BarChart3, PieChart, Clock, CheckCircle2, XCircle,
    AlertCircle, Calendar, Activity, Zap, Target, Award, Star, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { appApiClient } from '../../services/apiClient';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [currency, setCurrency] = useState('HTG');
    const [commissionSummary, setCommissionSummary] = useState({ totalCommission: 0, totalOrders: 0, topStores: [] });
    const [commissionLoading, setCommissionLoading] = useState(false);

    // KPI States
    const [stats, setStats] = useState({
        gmv: 12450000,
        netRevenue: 1867500,
        avgCommission: 15,
        avgBasket: 4850,
        orders: 2567,
        cancelRate: 3.2,
        refundRate: 1.8,
        disputeRate: 0.5,
        activeVendors: 487,
        newVendors: 34,
        activeProducts: 8450,
        deliveryRate: 94.5
    });

    // Charts Data
    const gmvData = [
        { name: t('month_jan_short'), gmv: 8500000, orders: 1750 },
        { name: t('month_feb_short'), gmv: 9200000, orders: 1890 },
        { name: t('month_mar_short'), gmv: 10100000, orders: 2080 },
        { name: t('month_apr_short'), gmv: 9800000, orders: 2010 },
        { name: t('month_may_short'), gmv: 11200000, orders: 2300 },
        { name: t('month_jun_short'), gmv: 12450000, orders: 2567 },
    ];

    const categoryData = [
        { name: t('high_tech'), value: 35, color: '#6366f1' },
        { name: t('fashion'), value: 28, color: '#ec4899' },
        { name: t('home_kitchen'), value: 18, color: '#10b981' },
        { name: t('beauty'), value: 12, color: '#f59e0b' },
        { name: t('admin_category_other'), value: 7, color: '#6b7280' },
    ];

    const topVendors = [
        { id: 1, name: 'TechHub Haiti', revenue: 2450000, orders: 485, rating: 4.9, status: 'excellent' },
        { id: 2, name: 'Mode Lakay', revenue: 1890000, orders: 412, rating: 4.8, status: 'excellent' },
        { id: 3, name: 'Artisans du Nord', revenue: 1250000, orders: 298, rating: 4.7, status: 'good' },
        { id: 4, name: 'Beauty Paradise', revenue: 980000, orders: 256, rating: 4.6, status: 'good' },
        { id: 5, name: 'Électro Plus', revenue: 875000, orders: 198, rating: 4.5, status: 'warning' },
    ];

    const recentOrders = [
        { id: '#UD-9842', product: 'iPhone 15 Pro', customer: 'Jean Baptiste', destination: 'Port-au-Prince', status: 'delivered', amount: 125000, date: t('time_2h_ago') },
        { id: '#UD-9841', product: 'MacBook Air M2', customer: 'Marie Claire', destination: 'Miami, USA', status: 'shipped', amount: 185000, date: t('time_5h_ago') },
        { id: '#UD-9840', product: 'Nike Air Max', customer: 'Pierre Louis', destination: 'Montréal, CA', status: 'processing', amount: 15000, date: t('time_8h_ago') },
        { id: '#UD-9839', product: 'Samsung Galaxy S24', customer: 'Anne Joseph', destination: 'Cap-Haïtien', status: 'pending', amount: 98000, date: t('time_yesterday') },
    ];

    const deliveryZones = [
        { zone: t('zone_haiti'), orders: 1542, avgDelay: '2.1j', performance: 96 },
        { zone: t('zone_usa'), orders: 687, avgDelay: '4.5j', performance: 92 },
        { zone: t('zone_canada'), orders: 234, avgDelay: '5.2j', performance: 89 },
        { zone: t('zone_france'), orders: 104, avgDelay: '7.1j', performance: 85 },
    ];

    const heatmapData = [
        { hour: '00h', lun: 12, mar: 8, mer: 15, jeu: 10, ven: 18, sam: 45, dim: 38 },
        { hour: '06h', lun: 25, mar: 22, mer: 28, jeu: 24, ven: 30, sam: 35, dim: 28 },
        { hour: '12h', lun: 85, mar: 78, mer: 92, jeu: 88, ven: 105, sam: 120, dim: 95 },
        { hour: '18h', lun: 120, mar: 115, mer: 125, jeu: 118, ven: 145, sam: 98, dim: 75 },
        { hour: '21h', lun: 65, mar: 58, mer: 72, jeu: 68, ven: 85, sam: 55, dim: 42 },
    ];

    useEffect(() => {
        // Simuler le chargement des données
        setTimeout(() => setLoading(false), 1000);
    }, []);

    useEffect(() => {
        const fetchCommissions = async () => {
            try {
                setCommissionLoading(true);
                const res = await appApiClient.get('/stores/admin/commissions/summary');
                setCommissionSummary(res.data || { totalCommission: 0, totalOrders: 0, topStores: [] });
            } catch (error) {
                console.error('Commission summary error:', error);
            } finally {
                setCommissionLoading(false);
            }
        };

        fetchCommissions();
    }, []);

    const formatCurrency = (value) => {
        const symbols = { HTG: 'G', USD: '$', CAD: 'C$', EUR: '€' };
        const rates = { HTG: 1, USD: 0.0075, CAD: 0.01, EUR: 0.007 };
        const converted = value * rates[currency];
        return `${converted.toLocaleString()} ${symbols[currency]}`;
    };

    const getStatusColor = (status) => {
        const colors = {
            delivered: 'bg-emerald-100 text-emerald-700',
            shipped: 'bg-blue-100 text-blue-700',
            processing: 'bg-amber-100 text-amber-700',
            pending: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || colors.pending;
    };

    const getVendorStatusColor = (status) => {
        const colors = {
            excellent: 'text-emerald-600 bg-emerald-50',
            good: 'text-blue-600 bg-blue-50',
            warning: 'text-amber-600 bg-amber-50',
            risk: 'text-red-600 bg-red-50'
        };
        return colors[status] || colors.good;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">{t('admin_loading_dashboard')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">{t('admin_dashboard_title')}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{t('admin_dashboard_subtitle')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Filter */}
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="7">{t('admin_date_range_7')}</option>
                            <option value="30">{t('admin_date_range_30')}</option>
                            <option value="90">{t('admin_date_range_90')}</option>
                            <option value="365">{t('admin_date_range_year')}</option>
                        </select>

                        {/* Currency Selector */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            {['HTG', 'USD', 'CAD', 'EUR'].map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr)}
                                    className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        currency === curr ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>

                        {/* Export Button */}
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                            <Download size={16} />
                            {t('admin_export')}
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-6 space-y-6">
                {/* KPI Principal - GMV & Revenue */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* GMV Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Wallet size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-indigo-200">{t('admin_gmv_total')}</span>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                                    <ArrowUpRight size={12} />
                                    +18.5%
                                </span>
                            </div>
                            <div className="text-4xl font-bold mb-1">{formatCurrency(stats.gmv)}</div>
                            <p className="text-indigo-200 text-sm">{t('admin_gmv_volume')}</p>
                        </div>
                    </div>

                    {/* Net Revenue */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <DollarSign size={20} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} />
                                +22.3%
                            </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin_net_revenue')}</p>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.netRevenue)}</div>
                        <p className="text-xs text-gray-400 mt-1">{t('admin_avg_commission', { percent: stats.avgCommission })}</p>
                    </div>

                    {/* Orders */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <ShoppingCart size={20} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} />
                                +12.8%
                            </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin_orders')}</p>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{stats.orders.toLocaleString()}</div>
                        <p className="text-xs text-gray-400 mt-1">{t('admin_avg_basket', { amount: formatCurrency(stats.avgBasket) })}</p>
                    </div>

                    {/* Commissions */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                <Wallet size={20} />
                            </div>
                            <a
                                href="/api/stores/admin/commissions/export"
                                className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full hover:underline"
                            >
                                Export CSV
                            </a>
                        </div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Commissions</p>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {commissionLoading ? '...' : `${commissionSummary.totalCommission.toLocaleString()} G`}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {commissionLoading ? '' : `${commissionSummary.totalOrders.toLocaleString()} commandes`}
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(commissionSummary.topStores || []).slice(0, 4).map((entry) => (
                                <div key={entry.store.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {entry.store.name}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {entry.amount.toLocaleString()} G
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPIs Secondaires */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-indigo-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_active_vendors')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.activeVendors}</div>
                        <span className="text-xs text-emerald-600">{t('admin_new_vendors', { count: stats.newVendors })}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Package size={16} className="text-purple-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_products')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.activeProducts.toLocaleString()}</div>
                        <span className="text-xs text-gray-400">{t('admin_in_catalog')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck size={16} className="text-emerald-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_delivery_rate')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.deliveryRate}%</div>
                        <span className="text-xs text-emerald-600">{t('admin_excellent')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle size={16} className="text-amber-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_cancel_rate')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.cancelRate}%</div>
                        <span className="text-xs text-amber-600">{t('admin_watch')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw size={16} className="text-blue-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_refunds')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.refundRate}%</div>
                        <span className="text-xs text-emerald-600">{t('admin_normal')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-xs font-medium text-gray-500">{t('admin_disputes')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.disputeRate}%</div>
                        <span className="text-xs text-emerald-600">{t('admin_very_low')}</span>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* GMV Evolution Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900">{t('admin_gmv_evolution')}</h3>
                                <p className="text-sm text-gray-500">{t('admin_last_6_months')}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                    {t('admin_chart_gmv')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    {t('admin_chart_orders')}
                                </span>
                            </div>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gmvData}>
                                    <defs>
                                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        formatter={(value, name) => [name === 'gmv' ? formatCurrency(value) : value, name === 'gmv' ? t('admin_chart_gmv') : t('admin_chart_orders')]}
                                    />
                                    <Area type="monotone" dataKey="gmv" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorGmv)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-6">{t('admin_category_distribution')}</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value}%`} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {categoryData.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                        <span className="text-gray-600">{cat.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{cat.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Vendeurs & Commandes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Vendeurs */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Award size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('admin_top_vendors')}</h3>
                                    <p className="text-xs text-gray-500">{t('admin_by_revenue')}</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                {t('admin_view_all')} <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {topVendors.map((vendor, index) => (
                                <div key={vendor.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 text-sm truncate">{vendor.name}</div>
                                        <div className="text-xs text-gray-500">{t('admin_orders_count', { count: vendor.orders })}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-sm">{formatCurrency(vendor.revenue)}</div>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Star size={12} className="text-amber-400 fill-amber-400" />
                                            <span className="text-xs text-gray-500">{vendor.rating}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getVendorStatusColor(vendor.status)}`}>
                                        {t(`vendor_status_${vendor.status}`).toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commandes Récentes */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <ShoppingBag size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('admin_recent_orders')}</h3>
                                    <p className="text-xs text-gray-500">{t('admin_latest_transactions')}</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                {t('admin_view_all')} <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-xs text-gray-500">{order.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {t(`status_${order.status}`).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{order.product}</div>
                                            <div className="text-xs text-gray-500">{order.customer} • {order.destination}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 text-sm">{formatCurrency(order.amount)}</div>
                                            <div className="text-xs text-gray-400">{order.date}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Logistique & Zones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance par Zone */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <Globe size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t('admin_logistics_zone_performance')}</h3>
                                <p className="text-xs text-gray-500">{t('admin_avg_delay_success')}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3">{t('admin_zone')}</th>
                                        <th className="pb-3">{t('admin_orders')}</th>
                                        <th className="pb-3">{t('admin_avg_delay')}</th>
                                        <th className="pb-3">{t('admin_performance')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {deliveryZones.map((zone, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="py-3 font-semibold text-gray-900">{zone.zone}</td>
                                            <td className="py-3 text-gray-600">{zone.orders.toLocaleString()}</td>
                                            <td className="py-3 text-gray-600">{zone.avgDelay}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${zone.performance >= 90 ? 'bg-emerald-500' : zone.performance >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${zone.performance}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{zone.performance}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Insight Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full translate-y-12 -translate-x-12"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                                <Zap size={24} className="text-amber-300" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{t('admin_insight_title')}</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                                {t('admin_insight_text')}
                            </p>
                            <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                                <p className="text-xs text-indigo-200">
                                    <span className="font-bold text-white">{t('admin_recommendation')}</span> {t('admin_recommendation_text')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Finance Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <CreditCard size={20} className="text-emerald-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">{t('admin_commissions_collected')}</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(1450000)}</div>
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <ArrowUpRight size={12} />
                            {t('admin_vs_last_month')}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">{t('admin_payments_pending')}</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(385000)}</div>
                        <p className="text-xs text-gray-500">{t('admin_vendors_affected')}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Wallet size={20} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">{t('admin_vendor_balances')}</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(2850000)}</div>
                        <p className="text-xs text-gray-500">{t('admin_total_to_distribute')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
