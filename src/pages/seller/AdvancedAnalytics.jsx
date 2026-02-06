/**
 * Advanced Analytics Dashboard for Sellers
 * Inspired by: Shopify Analytics, Google Analytics, Stripe Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Eye,
    Calendar, Download, Filter, RefreshCw, ArrowUpRight, ArrowDownRight,
    PieChart, BarChart3, LineChart, Target, Zap, Clock, MapPin
} from 'lucide-react';
import {
    LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell
} from 'recharts';

// Mock data generators
const generateSalesData = (days = 30) => {
    const data = [];
    const baseValue = 50000;
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            sales: Math.floor(baseValue + Math.random() * 30000 - 10000),
            orders: Math.floor(20 + Math.random() * 30),
            visitors: Math.floor(200 + Math.random() * 300),
        });
    }
    return data;
};

const generateCategoryData = () => [
    { name: 'Électronique', value: 45, color: '#6366f1' },
    { name: 'Mode', value: 25, color: '#f59e0b' },
    { name: 'Maison', value: 15, color: '#10b981' },
    { name: 'Beauté', value: 10, color: '#ec4899' },
    { name: 'Autres', value: 5, color: '#6b7280' },
];

const generateHourlyData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}h`,
        orders: Math.floor(Math.random() * 15 + (i >= 10 && i <= 20 ? 10 : 2)),
    }));
};

const generateTopProducts = () => [
    { id: 1, name: 'iPhone 15 Pro', sales: 45, revenue: 5625000, trend: 12 },
    { id: 2, name: 'AirPods Pro', sales: 89, revenue: 2225000, trend: 8 },
    { id: 3, name: 'MacBook Air M3', sales: 12, revenue: 1800000, trend: -3 },
    { id: 4, name: 'Samsung Galaxy S24', sales: 34, revenue: 1360000, trend: 15 },
    { id: 5, name: 'Nike Air Max', sales: 67, revenue: 1005000, trend: 5 },
];

const generateGeoData = () => [
    { region: 'Port-au-Prince', orders: 245, percentage: 45 },
    { region: 'Pétion-Ville', orders: 123, percentage: 23 },
    { region: 'Cap-Haïtien', orders: 67, percentage: 12 },
    { region: 'Delmas', orders: 56, percentage: 10 },
    { region: 'Autres', orders: 54, percentage: 10 },
];

// Stat Card Component
const StatCard = ({ title, value, change, changeType, icon: Icon, prefix = '', suffix = '' }) => {
    const isPositive = changeType === 'positive' || change > 0;
    
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isPositive ? 'bg-green-100' : 'bg-red-100'
                }`}>
                    <Icon className={`w-6 h-6 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
            </div>
            {change !== undefined && (
                <div className={`flex items-center gap-1 mt-3 text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span className="font-medium">{Math.abs(change)}%</span>
                    <span className="text-gray-500">vs période précédente</span>
                </div>
            )}
        </div>
    );
};

// Main Analytics Dashboard
const AdvancedAnalytics = () => {
    const [dateRange, setDateRange] = useState('30d');
    const [salesData, setSalesData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [geoData, setGeoData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load mock data
    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            setSalesData(generateSalesData(days));
            setCategoryData(generateCategoryData());
            setHourlyData(generateHourlyData());
            setTopProducts(generateTopProducts());
            setGeoData(generateGeoData());
            setIsLoading(false);
        }, 500);
    }, [dateRange]);

    // Calculate totals
    const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
    const totalVisitors = salesData.reduce((sum, d) => sum + d.visitors, 0);
    const conversionRate = totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(2) : 0;
    const avgOrderValue = totalOrders > 0 ? Math.floor(totalSales / totalOrders) : 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics Avancés</h1>
                        <p className="text-gray-500">Tableau de bord de performance</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Date Range Selector */}
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
                            {['7d', '30d', '90d'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        dateRange === range
                                            ? 'bg-gold-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
                                </button>
                            ))}
                        </div>
                        
                        <button className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                            <Download className="w-5 h-5 text-gray-600" />
                        </button>
                        
                        <button className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                            <RefreshCw className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard
                        title="Chiffre d'affaires"
                        value={totalSales}
                        suffix=" G"
                        change={12.5}
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Commandes"
                        value={totalOrders}
                        change={8.2}
                        icon={ShoppingBag}
                    />
                    <StatCard
                        title="Visiteurs"
                        value={totalVisitors}
                        change={15.3}
                        icon={Eye}
                    />
                    <StatCard
                        title="Taux de conversion"
                        value={conversionRate}
                        suffix="%"
                        change={-2.1}
                        changeType="negative"
                        icon={Target}
                    />
                    <StatCard
                        title="Panier moyen"
                        value={avgOrderValue}
                        suffix=" G"
                        change={5.7}
                        icon={Zap}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Sales Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <LineChart className="w-5 h-5 text-gold-500" />
                                Évolution des ventes
                            </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip 
                                    formatter={(value) => [`${value.toLocaleString()} G`, 'Ventes']}
                                    contentStyle={{ borderRadius: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#D4AF37"
                                    strokeWidth={2}
                                    fill="url(#salesGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <PieChart className="w-5 h-5 text-gold-500" />
                            Ventes par catégorie
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <RechartsPie>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${value}%`}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPie>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-4">
                            {categoryData.map((cat, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <span className="text-gray-600">{cat.name}</span>
                                    </div>
                                    <span className="font-medium">{cat.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Hourly Orders */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-gold-500" />
                            Commandes par heure
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="orders" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            💡 Pic d'activité entre 14h et 18h
                        </p>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-gold-500" />
                            Distribution géographique
                        </h3>
                        <div className="space-y-3">
                            {geoData.map((region, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-700">{region.region}</span>
                                        <span className="font-medium">{region.orders} commandes</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full"
                                            style={{ width: `${region.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products Table */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-gold-500" />
                        Produits les plus vendus
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">#</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Produit</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ventes</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenus</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tendance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, index) => (
                                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-gray-900">{product.name}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm">{product.sales}</td>
                                        <td className="py-3 px-4 text-right text-sm font-medium">
                                            {product.revenue.toLocaleString()} G
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                                                product.trend > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {product.trend > 0 ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : (
                                                    <TrendingDown className="w-4 h-4" />
                                                )}
                                                {Math.abs(product.trend)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                        <h4 className="font-bold mb-2">🚀 Opportunité</h4>
                        <p className="text-sm opacity-90">
                            Vos ventes augmentent de 15% le week-end. Considérez des promotions spéciales vendredis!
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                        <h4 className="font-bold mb-2">💡 Conseil</h4>
                        <p className="text-sm opacity-90">
                            62% de vos clients reviennent dans les 30 jours. Programme de fidélité recommandé!
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                        <h4 className="font-bold mb-2">⚠️ Attention</h4>
                        <p className="text-sm opacity-90">
                            3 produits ont un stock faible. Réapprovisionnement suggéré cette semaine.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
