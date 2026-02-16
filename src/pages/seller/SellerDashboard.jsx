import { useState, useEffect } from 'react';
import {
    DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, ArrowUpRight,
    Star, Bell, Clock, Wallet, CreditCard, Eye, AlertTriangle, CheckCircle2,
    Truck, RefreshCw, ChevronRight, Award, Target, Gift, Zap, BarChart3,
    Calendar, Download, Settings, HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { appApiClient } from '../../services/apiClient';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

const SellerDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [commissionSummary, setCommissionSummary] = useState({ totalCommission: 0, totalOrders: 0 });
    const [commissionLoading, setCommissionLoading] = useState(false);

    // Données vendeur
    const [vendorData, setVendorData] = useState({
        name: 'TechHub Haiti',
        level: 'Gold',
        levelProgress: 78,
        nextLevel: 'Platinum',
        rating: 4.8,
        reviewCount: 342,
        memberSince: t('seller_dashboard_member_since_value')
    });

    // Stats principales
    const [stats, setStats] = useState({
        totalRevenue: 2450000,
        pendingBalance: 185000,
        availableBalance: 890000,
        nextPayout: t('seller_dashboard_next_payout_value'),
        totalOrders: 485,
        pendingOrders: 12,
        shippedOrders: 8,
        deliveredOrders: 465,
        activeProducts: 124,
        lowStockProducts: 5,
        outOfStock: 2,
        conversionRate: 3.8,
        views: 12450,
        avgOrderValue: 5050
    });

    // Graphique revenus
    const revenueData = [
        { name: t('seller_dashboard_week_1'), revenue: 450000, orders: 85 },
        { name: t('seller_dashboard_week_2'), revenue: 520000, orders: 98 },
        { name: t('seller_dashboard_week_3'), revenue: 480000, orders: 91 },
        { name: t('seller_dashboard_week_4'), revenue: 610000, orders: 115 },
    ];

    // Top produits
    const topProducts = [
        { id: 1, name: 'iPhone 15 Pro Max', sales: 45, revenue: 585000, stock: 12, trend: 'up' },
        { id: 2, name: 'MacBook Air M2', sales: 28, revenue: 392000, stock: 8, trend: 'up' },
        { id: 3, name: 'AirPods Pro 2', sales: 62, revenue: 248000, stock: 25, trend: 'down' },
        { id: 4, name: 'Apple Watch Series 9', sales: 34, revenue: 204000, stock: 15, trend: 'up' },
    ];

    // Commandes récentes
    const recentOrders = [
        { id: '#UD-9842', product: 'iPhone 15 Pro', customer: 'Jean B.', amount: 125000, status: 'pending', time: t('seller_dashboard_time_30m') },
        { id: '#UD-9841', product: 'MacBook Air M2', customer: 'Marie C.', amount: 185000, status: 'shipped', time: t('seller_dashboard_time_2h') },
        { id: '#UD-9840', product: 'AirPods Pro', customer: 'Pierre L.', amount: 35000, status: 'delivered', time: t('seller_dashboard_time_5h') },
    ];

    // Notifications
    const notifications = [
        { id: 1, type: 'order', title: t('seller_dashboard_notif_new_order'), message: t('seller_dashboard_notif_new_order_msg'), time: t('seller_dashboard_time_30m'), unread: true },
        { id: 2, type: 'stock', title: t('seller_dashboard_notif_low_stock'), message: t('seller_dashboard_notif_low_stock_msg'), time: t('seller_dashboard_time_2h'), unread: true },
        { id: 3, type: 'payout', title: t('seller_dashboard_notif_payout_done'), message: t('seller_dashboard_notif_payout_done_msg'), time: t('seller_dashboard_time_yesterday'), unread: false },
    ];

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    useEffect(() => {
        const fetchCommissions = async () => {
            try {
                setCommissionLoading(true);
                const res = await appApiClient.get('/stores/me/commissions/summary');
                setCommissionSummary(res.data || { totalCommission: 0, totalOrders: 0 });
            } catch (error) {
                console.error('Commission summary error:', error);
            } finally {
                setCommissionLoading(false);
            }
        };

        fetchCommissions();
    }, []);

    const formatCurrency = (value) => `${value.toLocaleString()} G`;

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-700',
            shipped: 'bg-blue-100 text-blue-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return colors[status] || colors.pending;
    };

    const getNotificationIcon = (type) => {
        const icons = {
            order: <ShoppingCart size={16} className="text-blue-500" />,
            stock: <AlertTriangle size={16} className="text-amber-500" />,
            payout: <Wallet size={16} className="text-emerald-500" />,
        };
        return icons[type] || icons.order;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">{t('seller_dashboard_loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Vendeur */}
            <header className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {vendorData.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-900">{vendorData.name}</h1>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                                        <Award size={12} />
                                        {vendorData.level}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-semibold text-gray-700">{vendorData.rating}</span>
                                        <span className="text-xs text-gray-400">({vendorData.reviewCount} {t('reviews')})</span>
                                    </div>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{t('seller_dashboard_member_since')} {vendorData.memberSince}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                            >
                                <option value="7">{t('seller_dashboard_period_7')}</option>
                                <option value="30">{t('seller_dashboard_period_30')}</option>
                                <option value="90">{t('seller_dashboard_period_90')}</option>
                            </select>
                            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell size={20} className="text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Settings size={20} className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Progress vers niveau suivant */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Target size={16} className="text-indigo-600" />
                                <span className="text-sm font-semibold text-indigo-900">{t('seller_dashboard_progress_to')} {vendorData.nextLevel}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-600">{vendorData.levelProgress}%</span>
                        </div>
                        <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${vendorData.levelProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2">{t('seller_dashboard_sales_to_reach_prefix')} 550,000 G {t('seller_dashboard_sales_to_reach_suffix')} {vendorData.nextLevel}!</p>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-6 space-y-6">
                
                {/* 🚨 ACTION CARDS - P2 FIX: Tâches prioritaires en premier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Commandes à traiter */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 md:p-5 text-white relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Package size={20} />
                                    <span className="font-medium">{t('seller_dashboard_orders_to_process')}</span>
                                </div>
                                <div className="text-4xl font-black">{stats.pendingOrders}</div>
                                <p className="text-orange-100 text-sm mt-1">{t('seller_dashboard_ship_today')}</p>
                            </div>
                            <ChevronRight size={24} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Stock bas */}
                    <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-4 md:p-5 text-white relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={20} />
                                    <span className="font-medium">{t('seller_dashboard_low_stock')}</span>
                                </div>
                                <div className="text-4xl font-black">{stats.lowStockProducts}</div>
                                <p className="text-red-100 text-sm mt-1">{t('seller_dashboard_products_to_restock')}</p>
                            </div>
                            <ChevronRight size={24} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Retrait disponible */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 md:p-5 text-white relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} />
                                    <span className="font-medium">{t('seller_dashboard_available_to_withdraw')}</span>
                                </div>
                                <div className="text-3xl font-black">{formatCurrency(stats.availableBalance)}</div>
                                <p className="text-emerald-100 text-sm mt-1">{t('seller_dashboard_withdraw_moncash')}</p>
                            </div>
                            <ChevronRight size={24} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>

                {/* KPIs Principaux - Finance */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenus Totaux */}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <DollarSign size={18} />
                                </div>
                                <span className="text-sm text-emerald-100">{t('seller_dashboard_total_revenue')}</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</div>
                            <div className="flex items-center gap-1 text-emerald-200 text-xs">
                                <ArrowUpRight size={12} />
                                {t('seller_dashboard_growth_this_month')}
                            </div>
                        </div>
                    </div>

                    {/* Solde Disponible */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Wallet size={18} className="text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-500">{t('seller_dashboard_available_balance')}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.availableBalance)}</div>
                        <button className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                            {t('seller_dashboard_withdraw_now')} <ArrowRight size={12} />
                        </button>
                    </div>

                    {/* En Attente */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <span className="text-sm text-gray-500">{t('seller_dashboard_pending')}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.pendingBalance)}</div>
                        <p className="text-xs text-gray-400">{t('seller_dashboard_released_after_delivery')}</p>
                    </div>

                    {/* Prochain Paiement */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Calendar size={18} className="text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-500">{t('seller_dashboard_next_payout')}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stats.nextPayout}</div>
                        <p className="text-xs text-gray-400">{t('seller_dashboard_via_moncash')}</p>
                    </div>
                </div>

                {/* Commissions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Wallet size={18} className="text-amber-600" />
                        </div>
                        <a href="/api/stores/me/commissions/export" className="text-xs text-amber-700 font-semibold hover:underline">Export CSV</a>
                    </div>
                    <div className="text-sm text-gray-500">Commissions</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                        {commissionLoading ? '...' : `${commissionSummary.totalCommission.toLocaleString()} G`}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {commissionLoading ? '' : `${commissionSummary.totalOrders.toLocaleString()} commandes`}
                    </div>
                </div>

                {/* KPIs Commandes & Produits */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart size={16} className="text-blue-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_orders')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.totalOrders}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">{stats.pendingOrders} {t('seller_dashboard_pending_label')}</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck size={16} className="text-indigo-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_shipped')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.shippedOrders}</div>
                        <span className="text-xs text-gray-400">{t('seller_dashboard_in_transit')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_delivered')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.deliveredOrders}</div>
                        <span className="text-xs text-emerald-600">{t('seller_dashboard_success_rate')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Package size={16} className="text-purple-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_active_products')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.activeProducts}</div>
                        <span className="text-xs text-amber-600">{stats.lowStockProducts} {t('seller_dashboard_low_stock_label')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={16} className="text-cyan-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_views')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.views.toLocaleString()}</div>
                        <span className="text-xs text-emerald-600">{t('seller_dashboard_vs_last_week')}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-rose-500" />
                            <span className="text-xs text-gray-500">{t('seller_dashboard_conversion_rate')}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.conversionRate}%</div>
                        <span className="text-xs text-gray-400">{t('seller_dashboard_avg_basket')} {formatCurrency(stats.avgOrderValue)}</span>
                    </div>
                </div>

                {/* Graphique & Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Graphique Revenus */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900">{t('seller_dashboard_revenue_evolution')}</h3>
                                <p className="text-sm text-gray-500">{t('seller_dashboard_last_4_weeks')}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    {t('seller_dashboard_legend_revenue')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    {t('seller_dashboard_legend_orders')}
                                </span>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        formatter={(value) => [formatCurrency(value), t('seller_dashboard_legend_revenue')]}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell size={18} className="text-gray-600" />
                                <h3 className="font-bold text-gray-900">{t('seller_dashboard_notifications')}</h3>
                                <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                            </div>
                            <button className="text-indigo-600 text-xs font-medium hover:underline">{t('seller_dashboard_view_all')}</button>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                            {notifications.map((notif) => (
                                <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notif.unread ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 text-sm">{notif.title}</span>
                                                {notif.unread && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                            <span className="text-[10px] text-gray-400">{notif.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Produits & Commandes Récentes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Produits */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Star size={18} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('seller_dashboard_top_products')}</h3>
                                    <p className="text-xs text-gray-500">{t('seller_dashboard_top_products_subtitle')}</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                {t('seller_dashboard_manage')} <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {topProducts.map((product, index) => (
                                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 text-sm truncate">{product.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-500">{product.sales} {t('seller_dashboard_sales')}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className={`text-xs ${product.stock < 10 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                {product.stock} {t('seller_dashboard_in_stock')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-sm">{formatCurrency(product.revenue)}</div>
                                        <div className={`flex items-center gap-0.5 justify-end text-xs ${product.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {product.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {product.trend === 'up' ? '+12%' : '-5%'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commandes Récentes */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <ShoppingCart size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('seller_dashboard_recent_orders')}</h3>
                                    <p className="text-xs text-gray-500">{t('seller_dashboard_to_process')}</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                {t('seller_dashboard_view_all')} <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-xs text-gray-500">{order.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status === 'pending' ? t('seller_dashboard_status_pending') :
                                             order.status === 'shipped' ? t('seller_dashboard_status_shipped') : t('seller_dashboard_status_delivered')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{order.product}</div>
                                            <div className="text-xs text-gray-500">{order.customer}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 text-sm">{formatCurrency(order.amount)}</div>
                                            <div className="text-xs text-gray-400">{order.time}</div>
                                        </div>
                                    </div>
                                    {order.status === 'pending' && (
                                        <button className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                                            {t('seller_dashboard_process_order')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Conseils & Actions rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                        <div className="relative z-10">
                            <Zap size={24} className="text-amber-300 mb-3" />
                            <h3 className="font-bold text-lg mb-2">{t('seller_dashboard_boost_sales')}</h3>
                            <p className="text-indigo-200 text-sm mb-4">{t('seller_dashboard_boost_sales_desc')}</p>
                            <button className="px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors">
                                {t('seller_dashboard_create_promo')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t('seller_dashboard_stock_alerts')}</h3>
                                <p className="text-xs text-gray-500">{stats.lowStockProducts} {t('seller_dashboard_products_to_restock')}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                                <span className="text-sm text-gray-700">AirPods Pro 2</span>
                                <span className="text-xs font-bold text-amber-700">5 {t('seller_dashboard_remaining')}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                <span className="text-sm text-gray-700">iPhone 15 Case</span>
                                <span className="text-xs font-bold text-red-700">{t('seller_dashboard_out_of_stock')}</span>
                            </div>
                        </div>
                        <button className="mt-4 w-full py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            {t('seller_dashboard_manage_stock')}
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <HelpCircle size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t('seller_dashboard_need_help')}</h3>
                                <p className="text-xs text-gray-500">{t('seller_dashboard_support_available')}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                {t('seller_dashboard_seller_guide')}
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                {t('seller_dashboard_contact_support')}
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                {t('seller_dashboard_seller_faq')}
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
