import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, User, Banknote, Crown, ShieldCheck, BadgeCheck, Radar, Wrench } from 'lucide-react';
import { useAdminFetch } from '../hooks/useAdminFetch';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const { adminFetch } = useAdminFetch();
    const [insightsActive, setInsightsActive] = useState(false);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const load = async () => {
            try {
                const summary = await adminFetch('/api/admin/trust/insights/summary?window=24h');
                const hasData = (summary?.navClicks || summary?.pageViews || summary?.timelineExpands || summary?.uniqueSellers) > 0;
                setInsightsActive(!!hasData);
            } catch (e) {
                setInsightsActive(false);
            }
        };
        load();
    }, [adminFetch]);

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Union<span className="text-secondary">Admin</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Tableau de bord
                    </Link>
                    <Link
                        to="/admin/products"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/products') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Package className="w-5 h-5" />
                        Produits
                    </Link>
                    <Link
                        to="/admin/orders"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/orders') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Commandes
                    </Link>
                    <Link
                        to="/admin/users"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <User className="w-5 h-5" />
                        Utilisateurs
                    </Link>
                    <Link
                        to="/admin/payouts"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/payouts') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Banknote className="w-5 h-5" />
                        Paiements
                    </Link>
                    <Link
                        to="/admin/trust"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/trust') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <BadgeCheck className="w-5 h-5" />
                        Trust
                    </Link>
                    <Link
                        to="/admin/trust-insights"
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/trust-insights') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Radar className="w-5 h-5" />
                            Trust Insights
                        </div>
                        {insightsActive && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </Link>
                    <Link
                        to="/admin/risk-monitoring"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/risk-monitoring') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <ShieldCheck className="w-5 h-5" />
                        Risk
                    </Link>
                    <Link
                        to="/admin/skills"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/skills') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Wrench className="w-5 h-5" />
                        Skills
                    </Link>
                    <Link
                        to="/admin/subscription"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/subscription') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Crown className="w-5 h-5" />
                        Abonnement
                    </Link>
                    <div className="pt-8 mt-8 border-t border-gray-800">
                        <Link
                            to="/admin/settings"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings') ? 'bg-secondary text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <Settings className="w-5 h-5" />
                            Paramètres
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors">
                        <LogOut className="w-5 h-5" />
                        Retour au site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isActive('/admin') && 'Tableau de bord'}
                        {isActive('/admin/products') && 'Gestion des Produits'}
                        {isActive('/admin/orders') && 'Suivi des Commandes'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                            A
                        </div>
                        <span className="text-sm font-medium">Admin</span>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
