import { useState, useEffect } from 'react';
import {
    DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, ArrowUpRight,
    Star, Bell, Clock, Wallet, CreditCard, Eye, AlertTriangle, CheckCircle2,
    Truck, RefreshCw, ChevronRight, Award, Target, Gift, Zap, BarChart3,
    Calendar, Download, Settings, HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

const SellerDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    // Données vendeur
    const [vendorData, setVendorData] = useState({
        name: 'TechHub Haiti',
        level: 'Gold',
        levelProgress: 78,
        nextLevel: 'Platinum',
        rating: 4.8,
        reviewCount: 342,
        memberSince: 'Janvier 2024'
    });

    // Stats principales
    const [stats, setStats] = useState({
        totalRevenue: 2450000,
        pendingBalance: 185000,
        availableBalance: 890000,
        nextPayout: '15 Jan 2025',
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
        { name: 'Sem 1', revenue: 450000, orders: 85 },
        { name: 'Sem 2', revenue: 520000, orders: 98 },
        { name: 'Sem 3', revenue: 480000, orders: 91 },
        { name: 'Sem 4', revenue: 610000, orders: 115 },
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
        { id: '#UD-9842', product: 'iPhone 15 Pro', customer: 'Jean B.', amount: 125000, status: 'pending', time: 'Il y a 30min' },
        { id: '#UD-9841', product: 'MacBook Air M2', customer: 'Marie C.', amount: 185000, status: 'shipped', time: 'Il y a 2h' },
        { id: '#UD-9840', product: 'AirPods Pro', customer: 'Pierre L.', amount: 35000, status: 'delivered', time: 'Il y a 5h' },
    ];

    // Notifications
    const notifications = [
        { id: 1, type: 'order', title: 'Nouvelle commande!', message: 'iPhone 15 Pro - 125,000 G', time: 'Il y a 30min', unread: true },
        { id: 2, type: 'stock', title: 'Stock bas', message: 'AirPods Pro - 5 unités restantes', time: 'Il y a 2h', unread: true },
        { id: 3, type: 'payout', title: 'Paiement effectué', message: '450,000 G envoyé sur MonCash', time: 'Hier', unread: false },
    ];

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
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
                    <p className="text-gray-600 font-medium">Chargement de votre espace...</p>
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
                                        <span className="text-xs text-gray-400">({vendorData.reviewCount} avis)</span>
                                    </div>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">Membre depuis {vendorData.memberSince}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                            >
                                <option value="7">7 derniers jours</option>
                                <option value="30">30 derniers jours</option>
                                <option value="90">90 derniers jours</option>
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
                                <span className="text-sm font-semibold text-indigo-900">Progression vers {vendorData.nextLevel}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-600">{vendorData.levelProgress}%</span>
                        </div>
                        <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${vendorData.levelProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2">Encore 550,000 G de ventes pour atteindre le niveau {vendorData.nextLevel}!</p>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
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
                                <span className="text-sm text-emerald-100">Revenus Totaux</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</div>
                            <div className="flex items-center gap-1 text-emerald-200 text-xs">
                                <ArrowUpRight size={12} />
                                +18.5% ce mois
                            </div>
                        </div>
                    </div>

                    {/* Solde Disponible */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Wallet size={18} className="text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-500">Solde Disponible</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.availableBalance)}</div>
                        <button className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                            Retirer maintenant <ArrowRight size={12} />
                        </button>
                    </div>

                    {/* En Attente */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <span className="text-sm text-gray-500">En Attente</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.pendingBalance)}</div>
                        <p className="text-xs text-gray-400">Libéré après livraison</p>
                    </div>

                    {/* Prochain Paiement */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Calendar size={18} className="text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-500">Prochain Paiement</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stats.nextPayout}</div>
                        <p className="text-xs text-gray-400">Via MonCash</p>
                    </div>
                </div>

                {/* KPIs Commandes & Produits */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart size={16} className="text-blue-500" />
                            <span className="text-xs text-gray-500">Commandes</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.totalOrders}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">{stats.pendingOrders} en attente</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Truck size={16} className="text-indigo-500" />
                            <span className="text-xs text-gray-500">Expédiées</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.shippedOrders}</div>
                        <span className="text-xs text-gray-400">En transit</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-xs text-gray-500">Livrées</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.deliveredOrders}</div>
                        <span className="text-xs text-emerald-600">95.8% succès</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Package size={16} className="text-purple-500" />
                            <span className="text-xs text-gray-500">Produits Actifs</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.activeProducts}</div>
                        <span className="text-xs text-amber-600">{stats.lowStockProducts} stock bas</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={16} className="text-cyan-500" />
                            <span className="text-xs text-gray-500">Vues</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.views.toLocaleString()}</div>
                        <span className="text-xs text-emerald-600">+12% vs semaine der.</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-rose-500" />
                            <span className="text-xs text-gray-500">Taux Conv.</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{stats.conversionRate}%</div>
                        <span className="text-xs text-gray-400">Panier moy: {formatCurrency(stats.avgOrderValue)}</span>
                    </div>
                </div>

                {/* Graphique & Notifications */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Graphique Revenus */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900">Évolution des Revenus</h3>
                                <p className="text-sm text-gray-500">4 dernières semaines</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    Revenus
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    Commandes
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
                                        formatter={(value) => [formatCurrency(value), 'Revenus']}
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
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                            </div>
                            <button className="text-indigo-600 text-xs font-medium hover:underline">Tout voir</button>
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
                                    <h3 className="font-bold text-gray-900">Top Produits</h3>
                                    <p className="text-xs text-gray-500">Par ventes ce mois</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                Gérer <ChevronRight size={14} />
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
                                            <span className="text-xs text-gray-500">{product.sales} ventes</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className={`text-xs ${product.stock < 10 ? 'text-amber-600' : 'text-gray-400'}`}>
                                                {product.stock} en stock
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
                                    <h3 className="font-bold text-gray-900">Commandes Récentes</h3>
                                    <p className="text-xs text-gray-500">À traiter</p>
                                </div>
                            </div>
                            <button className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                Tout voir <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-xs text-gray-500">{order.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status === 'pending' ? 'EN ATTENTE' :
                                             order.status === 'shipped' ? 'EXPÉDIÉE' : 'LIVRÉE'}
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
                                            Traiter la commande
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
                            <h3 className="font-bold text-lg mb-2">Boostez vos ventes!</h3>
                            <p className="text-indigo-200 text-sm mb-4">Activez les promotions sur vos 3 meilleurs produits pour augmenter vos conversions de 25%.</p>
                            <button className="px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors">
                                Créer une promo
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Alertes Stock</h3>
                                <p className="text-xs text-gray-500">{stats.lowStockProducts} produits à réapprovisionner</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                                <span className="text-sm text-gray-700">AirPods Pro 2</span>
                                <span className="text-xs font-bold text-amber-700">5 restants</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                <span className="text-sm text-gray-700">iPhone 15 Case</span>
                                <span className="text-xs font-bold text-red-700">Rupture!</span>
                            </div>
                        </div>
                        <button className="mt-4 w-full py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            Gérer le stock
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <HelpCircle size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Besoin d'aide?</h3>
                                <p className="text-xs text-gray-500">Support vendeur disponible</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                Guide du vendeur
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                Contacter le support
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                            <button className="w-full py-2 px-3 text-left bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                FAQ Vendeurs
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
