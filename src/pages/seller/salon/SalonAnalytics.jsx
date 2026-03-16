import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Star, ArrowUpRight, ArrowDownRight, Scissors, DollarSign } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getVendorStats } from '../../../services/vendorService';
import { getSalonServices } from '../../../services/salonService';

const SalonAnalytics = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        try {
            setLoading(true);
            // In a real app, we'd have a specific getSalonAnalytics service
            // For now, we reuse vendor stats
            const statsData = await getVendorStats(currentUser.uid);
            setStats(statsData);

            const servicesData = await getSalonServices(currentUser.uid);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const kpis = [
        { label: 'Revenus Mensuels', value: '25,400 HTG', trend: '+12%', color: 'indigo', icon: DollarSign },
        { label: 'Rendez-vous', value: '48', trend: '+5%', color: 'emerald', icon: Users },
        { label: 'Taux d\'occupation', value: '82%', trend: '-2%', color: 'purple', icon: TrendingUp },
        { label: 'Note Moyenne', value: stats?.rating?.toFixed(1) || '4.9', trend: 'Stable', color: 'amber', icon: Star }
    ];

    if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest">Calcul de vos performances...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-indigo-950 text-white pt-16 pb-24 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Performances Salon</h1>
                        <p className="opacity-60 font-medium">Analyse détaillée de votre activité</p>
                    </div>
                    <BarChart3 size={48} className="text-indigo-400 opacity-50" />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-12">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 group hover:scale-105 transition-all">
                            <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 flex items-center justify-center text-${kpi.color}-600 mb-6 group-hover:bg-${kpi.color}-600 group-hover:text-white transition-all`}>
                                <kpi.icon size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{kpi.value}</h3>
                                <span className={`text-xs font-black flex items-center gap-1 ${kpi.trend.startsWith('+') ? 'text-emerald-500' : kpi.trend === 'Stable' ? 'text-slate-400' : 'text-red-500'}`}>
                                    {kpi.trend.startsWith('+') ? <ArrowUpRight size={14} /> : kpi.trend.startsWith('-') ? <ArrowDownRight size={14} /> : null}
                                    {kpi.trend}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top Services */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-widest">Services les plus demandés</h3>
                            <div className="space-y-6">
                                {services.slice(0, 4).map((service, i) => (
                                    <div key={i} className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300">
                                            0{i + 1}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-slate-800 uppercase tracking-tight">{service.title}</h4>
                                                <span className="text-xs font-black text-indigo-600">{20 - i * 4} RDV</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${100 - i * 15}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions / Activity */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-widest">Avis récents</h3>
                            <div className="space-y-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#fbbf24" stroke="#fbbf24" />)}
                                        </div>
                                        <p className="text-xs text-slate-500 italic">"Très satisfait du service, salon très propre et professionnel."</p>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">- Jean D.</p>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-8 text-indigo-600 font-bold text-sm hover:underline underline-offset-4 uppercase tracking-widest">Voir tous les avis</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalonAnalytics;
