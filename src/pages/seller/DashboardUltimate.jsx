import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, Home, MessageSquare, Users, Bot, Settings,
    Zap, Send, Mic, Menu, X, CreditCard, Globe, ShoppingBag,
    MoreHorizontal, Play, CheckCircle2, TrendingUp, DollarSign,
    Bell, Search, FileText, PieChart, ArrowUpRight, ArrowDownRight,
    Plus, Download, Package, Truck, Tag, Filter, Megaphone,
    Sparkles, AlertTriangle, ChevronRight, Wallet, LogOut, Share2, Smartphone, Briefcase, Target, RefreshCw, ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { usageStatsService } from '../../services/usageStatsService';
import { useSellerTrust } from '../../hooks/useSellerTrust';

// Utility for formatting currency
// const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(amount).replace('HTG', 'G');
// };

const inventoryData = [
    { id: 1, name: 'Tenis Nike Air', sku: 'NK-001', stock: 12, price: 7500, status: 'low' },
    { id: 2, name: 'T-Shirt Blanc', sku: 'TS-002', stock: 45, price: 1500, status: 'ok' },
    { id: 3, name: 'Jean Slim', sku: 'JN-003', stock: 0, price: 3000, status: 'out' },
];

// --- UI COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, className, statusColor }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'} ${className}`} />
            <span className="font-medium text-sm text-left">{label}</span>
        </div>
        {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                {badge}
            </span>
        )}
        {statusColor && (
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        )}
    </button>
);

const AudioPlayerMock = () => (
    <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 w-48 border border-slate-200">
        <button className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 hover:bg-indigo-700 transition-colors">
            <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
        </button>
        <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-1 bg-slate-300 rounded-full overflow-hidden w-full">
                <div className="w-1/3 h-full bg-indigo-500"></div>
            </div>
        </div>
        <span className="text-[10px] font-medium text-slate-500 tabular-nums">0:14</span>
    </div>
);

// --- MODULE: DASHBOARD ---

const DashboardHome = ({ t }) => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadedStats = usageStatsService.getAllStats();
        setStats(loadedStats);
    }, []);

    const chartData = [
        { name: t('day_mon'), sales: 4000, msg: 240 },
        { name: t('day_tue'), sales: 3000, msg: 139 },
        { name: t('day_wed'), sales: 9800, msg: 980 },
        { name: t('day_thu'), sales: 6500, msg: 390 },
        { name: t('day_fri'), sales: 12000, msg: 480 },
        { name: t('day_sat'), sales: 15000, msg: 600 },
        { name: t('day_sun'), sales: 8000, msg: 200 },
    ];

    const displayStats = [
        {
            title: t('ai_usage'),
            value: stats?.totalAIUsage || 0,
            trend: '+' + (stats?.aiAuditsPerformed || 0) + ' ' + t('audits_label'),
            icon: Sparkles,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: t('descriptions_generated'),
            value: stats?.aiDescriptionsGenerated || 0,
            trend: t('generated'),
            icon: FileText,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        },
        {
            title: t('products_created'),
            value: stats?.productsCreated || 0,
            trend: (stats?.productsPublished || 0) + ' ' + t('published'),
            icon: Package,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: t('smart_audits'),
            value: stats?.aiAuditsPerformed || 0,
            trend: t('completed'),
            icon: Target,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link
                    to="/seller/smart-audit"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
                >
                    <Sparkles className="w-4 h-4" />
                    {t('smart_audit_ai')}
                </Link>
                <Link
                    to="/seller/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    {t('settings')}
                </Link>
                <Link
                    to="/seller/products/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('new_product')}
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayStats.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">{t('sales_performance')}</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Usage Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">{t('usage_stats_title')}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            {t('usage_stats_desc')} {t('last_update')} {stats?.updatedAt ? new Date(stats.updatedAt).toLocaleString() : t('not_available')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODULE: FINANCE (PAYME STYLE) ---

// --- MODULE: FINANCE (PAYME STYLE) ---

const FinanceModule = ({ t, invoices }) => {
    const [subTab, setSubTab] = useState('overview');

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-slate-200 pb-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('finance_title')}</h2>
                    <p className="text-slate-500 text-sm">{t('finance_subtitle')}</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['overview', 'inventory', 'invoices'].map((tab) => (
                        <button key={tab} onClick={() => setSubTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {tab === 'overview' ? t('overview') : tab === 'inventory' ? t('inventory') : t('invoices')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {subTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                                <p className="text-slate-400 text-sm font-medium mb-1">{t('net_profit')}</p>
                                <h3 className="text-4xl font-black mb-4">109,000 G</h3>
                                <div className="flex gap-4 mt-8">
                                    <div><p className="text-xs text-slate-400">{t('income')}</p><p className="text-lg font-bold text-emerald-400 flex items-center"><ArrowUpRight className="w-4 h-4" /> 154k</p></div>
                                    <div className="w-px bg-slate-700 h-10"></div>
                                    <div><p className="text-xs text-slate-400">{t('expenses')}</p><p className="text-lg font-bold text-red-400 flex items-center"><ArrowDownRight className="w-4 h-4" /> 45k</p></div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-800">{t('latest_expenses')}</h4>
                                    <button className="text-indigo-600 text-sm font-bold">{t('see_all')}</button>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { cat: t('expense_stock'), name: t('expense_supplier_a'), amount: '-25,000 G', color: 'bg-blue-100 text-blue-700' },
                                        { cat: t('expense_transport'), name: t('expense_delivery_bike'), amount: '-1,500 G', color: 'bg-orange-100 text-orange-700' },
                                    ].map((exp, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${exp.color}`}>{exp.cat}</span>
                                                <span className="text-sm font-medium text-slate-700">{exp.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-900">{exp.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {subTab === 'inventory' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr><th className="px-6 py-4 font-bold">{t('product')}</th><th className="px-6 py-4 font-bold">{t('stock')}</th><th className="px-6 py-4 font-bold text-right">{t('status')}</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventoryData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4"><div className="font-bold text-slate-900 text-sm">{item.name}</div><div className="text-xs text-slate-500">{item.sku}</div></td>
                                        <td className="px-6 py-4 text-sm font-medium">{item.stock}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : item.status === 'low' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status === 'ok' ? t('in_stock') : item.status === 'low' ? t('low_stock') : t('out_of_stock')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {subTab === 'invoices' && (
                    <div className="space-y-4 animate-in fade-in">
                        {(!invoices || invoices.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                                <p className="font-bold text-slate-600">{t('no_invoices')}</p>
                                <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"><Plus className="w-4 h-4" /> {t('create_invoice')}</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invoices.map((inv) => (
                                    <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{inv.client}</h4>
                                                <p className="text-xs text-slate-500">#{inv.number} • {inv.items}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900">{inv.amount}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{t('status_paid')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODULE: MARKETING (KANPAY) ---

const MarketingModule = ({ t }) => {
    const [msg, setMsg] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const functions = getFunctions();
    const generateAIContent = httpsCallable(functions, 'generateAIContent');

    const generateAI = async () => {
        setIsGenerating(true);
        try {
            const result = await generateAIContent({
                type: 'marketing',
                promptData: {
                    productName: "Tenis Nike (Example)",
                    platform: "Whatsapp"
                }
            });
            // Mock fallback if API key missing in dev
            const fallback = t('marketing_ai_fallback');
            setMsg(result.data?.text || fallback);
        } catch (error) {
            console.error("AI Error", error);
            setMsg(t('generation_error'));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black">{t('marketing_title')}</h2>
                    <p className="opacity-80 text-sm">{t('marketing_subtitle')}</p>
                </div>
                <Megaphone className="w-12 h-12 opacity-20" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-700 uppercase">{t('campaign_message')}</label>
                    <button onClick={generateAI} disabled={isGenerating} className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50">
                        <Sparkles className="w-3 h-3" /> {isGenerating ? t('generating') : t('generate_ai')}
                    </button>
                </div>
                <textarea
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder={t('marketing_placeholder')}
                ></textarea>
                <div className="mt-4 flex justify-end">
                    <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-600 transition-colors shadow-lg">
                        {t('send_to_clients')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODULE: WHATSAPP VIRAL (NEW) ---
const WhatsAppModule = ({ t }) => {
    const [productLink, setProductLink] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [loading, setLoading] = useState(false);
    const functions = getFunctions();
    const generateAIContent = httpsCallable(functions, 'generateAIContent');

    // eslint-disable-next-line no-unused-vars
    const generateLink = async () => {
        if (!productLink) return;
        setLoading(true);
        const baseUrl = "https://wa.me/?text=";

        try {
            // REAL AI GENERATION
            const result = await generateAIContent({
                type: 'marketing',
                promptData: {
                    productName: productLink, // heuristic: using link/name input as context
                    platform: "Whatsapp_Viral" // Custom prompt type we could handle backend side or just use generic 'marketing' with instructions
                }
            });
            const aiText = result.data?.text || (t('whatsapp_ai_fallback_prefix') + productLink + t('whatsapp_ai_fallback_suffix'));
            const promoText = encodeURIComponent(aiText);
            setGeneratedLink(`${baseUrl}${promoText}`);
        } catch (e) {
            // Fallback
            const promoText = encodeURIComponent(t('whatsapp_fallback_prefix') + productLink + t('whatsapp_fallback_suffix'));
            setGeneratedLink(`${baseUrl}${promoText}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="bg-[#25D366] rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                <div className="z-10">
                    <h2 className="text-2xl font-black flex items-center gap-2"><Share2 className="w-6 h-6" /> {t('whatsapp_autopilot')}</h2>
                    <p className="opacity-90 text-sm">{t('whatsapp_subtitle')}</p>
                </div>
                <Smartphone className="w-24 h-24 absolute -right-4 -bottom-4 opacity-20 rotate-12" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-sm font-bold text-slate-700 block mb-2">{t('product_link_label')}</label>
                <div className="flex gap-2">
                    <input
                        value={productLink}
                        onChange={e => setProductLink(e.target.value)}
                        placeholder={t('whatsapp_link_placeholder')}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#25D366] outline-none"
                    />
                    <button onClick={generateLink} disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-[#25D366] transition-colors flex items-center gap-2">
                        {loading && <RefreshCw className="w-3 h-3 animate-spin" />} {t('generate_btn')}
                    </button>
                </div>

                {generatedLink && (
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">{t('viral_link_ready')}</p>
                        <div className="bg-white p-3 rounded-lg border border-emerald-200 text-sm text-slate-600 break-all font-mono select-all">
                            {generatedLink}
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button onClick={() => window.open(generatedLink, '_blank')} className="flex-1 bg-[#25D366] text-white py-2 rounded-lg font-bold shadow-md hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" /> {t('share_whatsapp')}
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50">
                                {t('copy')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MODULE: CHAT (VWA + PAIEMENT GLOBAL) ---

const ChatModule = ({ t, setInvoices }) => {
    const [messages, setMessages] = useState(() => ([
        { id: 1, sender: 'user', type: 'audio', content: 'audio', transcription: t('chat_demo_user_transcription') },
        { id: 2, sender: 'ai', type: 'text', content: t('chat_demo_ai_message') },
    ]));
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', type: 'text', content: input }]);
        setInput('');
    };

    const handleAction = (type) => {
        let newMsg;
        if (type === 'moncash') {
            newMsg = { id: Date.now(), sender: 'ai', type: 'payment_htg', amount: '7,500 HTG', content: t('payment_moncash_message') };
        } else if (type === 'stripe') {
            newMsg = { id: Date.now(), sender: 'ai', type: 'payment_usd', amount: '$55.00 USD', content: t('payment_stripe_message') };
        }
        setMessages(prev => [...prev, newMsg]);
    };

    const handleVoiceInvoice = () => {
        const fakeTranscription = t('voice_invoice_transcription');
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', type: 'audio', content: 'audio', transcription: fakeTranscription }]);

        setTimeout(() => {
            const invoiceMessage = t('voice_invoice_success') + "\n\n👤 Jean Dupont \n👟 2x Tenis Nike Air \n📍 Delmas 33 \n\n💰 " + t('total') + ": 15,000 G";
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', type: 'text', content: invoiceMessage }]);

            // ACTUAL STATE UPDATE (Deep Integration)
            setInvoices(prev => [{
                id: Date.now(),
                number: 'INV-009',
                client: 'Jean Dupont',
                items: '2x Tenis Nike Air',
                amount: '15,000 G',
                status: 'paid'
            }, ...prev]);

        }, 1500);
    };

    return (
        <div className="flex h-full gap-6 w-full">
            {/* Chat List (Hidden on mobile usually, keeping simple here) */}
            <div className="hidden lg:flex flex-col w-80 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shrink-0">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50/50">{t('inbox')}</div>
                <div className="flex-1 overflow-y-auto">
                    <div className="bg-white p-8 text-center text-slate-400 text-sm">
                        {t('chat_list_demo')}
                    </div>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-white md:rounded-2xl overflow-hidden md:border border-slate-200 shadow-sm relative h-[calc(100vh-140px)]">
                <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">PP</div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm md:text-base">Pierre Paul</h3>
                            <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{t('online')} • {t('diaspora')}</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm ${msg.sender === 'user' ? 'bg-white text-slate-800 rounded-tl-none' : 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'}`}>
                                {msg.type === 'audio' && (
                                    <div className="mb-1">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider"><Mic className="w-3 h-3" /> {t('voice_note')}</div>
                                        <AudioPlayerMock />
                                        <div className="mt-3 pt-2 border-t border-slate-100"><p className="text-xs text-slate-600 italic"><span className="font-bold text-indigo-600 not-italic mr-1">{t('ai_label')}</span> "{msg.transcription}"</p></div>
                                    </div>
                                )}
                                {(msg.type === 'text' || msg.type.includes('payment')) && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                                {/* GLOBAL PAYMENT CARDS */}
                                {msg.type.includes('payment') && (
                                    <div className="mt-2 bg-white/60 p-3 rounded-xl border border-slate-200/50 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs ${msg.type === 'payment_htg' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                                {msg.type === 'payment_htg' ? 'MC' : <CreditCard className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 uppercase">{msg.type === 'payment_htg' ? 'MonCash' : t('card_stripe')}</p>
                                                <p className="text-lg font-black text-slate-900">{msg.amount}</p>
                                            </div>
                                        </div>
                                        <button className={`text-white text-xs font-bold px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity ${msg.type === 'payment_htg' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                            {t('pay_now')}
                                        </button>
                                    </div>
                                )}
                                <span className="text-[10px] block text-right mt-1 opacity-50">10:42</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-white border-t border-slate-200 p-3 shrink-0">
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                        <button onClick={() => handleAction('moncash')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors whitespace-nowrap"><Wallet className="w-3 h-3" /> {t('moncash_htg')}</button>
                        <button onClick={() => handleAction('stripe')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap"><CreditCard className="w-3 h-3" /> {t('stripe_usd')}</button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-colors whitespace-nowrap"><Globe className="w-3 h-3" /> {t('translate')}</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleVoiceInvoice} className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors" title={t('simulate_voice_order')}><Mic className="w-5 h-5" /></button>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t('chat_placeholder')} className="flex-1 bg-slate-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none" />
                        <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"><Send className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP SHELL ---

export default function DashboardUltimate() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]); // Shared State for Deep Integration

    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    const { data: trustData } = useSellerTrust();
    const functions = getFunctions();
    const db = getFirestore();
    const navigate = useNavigate();
    const trustStatusColor = trustData?.tier === 'ELITE' || trustData?.tier === 'TRUSTED'
        ? 'bg-emerald-400'
        : trustData?.tier === 'WATCH'
            ? 'bg-amber-400'
            : trustData?.tier === 'RESTRICTED'
                ? 'bg-rose-500'
                : trustData?.tier
                    ? 'bg-slate-400'
                    : null;

    useEffect(() => {
        if (!currentUser) {
            if (loading) setLoading(false);
            return;
        }

        // Listen to Vendor Status
        const unsubscribe = onSnapshot(doc(db, "vendors", currentUser.uid), (doc) => {
            if (doc.exists()) {
                setIsPremium(doc.data().premiumAccess === true);
            }
            setLoading(false);
        }, (error) => {
            console.error("Vendor snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, db]);

    const handleSubscribe = async () => {
        try {
            const createVendorSubscriptionSession = httpsCallable(functions, 'createVendorSubscriptionSession');
            const result = await createVendorSubscriptionSession({
                vendorId: currentUser.uid,
                email: currentUser.email
            });
            if (result.data.url) {
                window.location.href = result.data.url;
            }
        } catch (error) {
            console.error("Subscription Error", error);
            alert(t('subscription_creation_error'));
        }
    };

    // --- MODULE: SERVICES (NEW) ---
    const ServicesModule = ({ t, navigate }) => {
        // Mock Data
        const myServices = [
            // { id: 1, title: 'Coiffure à domicile', price: '1500 G', bookings: 12, status: 'active' } 
        ];

        return (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
                <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{t('my_services')}</h2>
                        <p className="text-slate-500 text-sm">{t('services_subtitle')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/seller/services/new')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" /> {t('add_service')}
                    </button>
                </div>

                {myServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{t('no_services_title')}</h3>
                        <p className="text-slate-500 max-w-md mb-6">{t('no_services_desc')}</p>
                        <button
                            onClick={() => navigate('/seller/services/new')}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-transform hover:scale-105 shadow-lg"
                        >
                            {t('create_first_service')}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* List would go here */}
                        <div className="p-4 text-center text-gray-500">{t('services_list_todo')}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        // Locked Feature Protection
        if (!isPremium && ['finance', 'marketing', 'whatsapp', 'chat'].includes(activeTab)) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-orange-200">
                        <Zap className="w-10 h-10 text-white fill-white" />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">{t('premium_required_title')}</h2>
                        <p className="text-slate-500">{t('premium_required_desc')}</p>
                    </div>
                    <button onClick={handleSubscribe} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
                        {t('upgrade_now')} <ArrowUpRight className="w-5 h-5" />
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard': return <DashboardHome t={t} />;
            case 'services': return <ServicesModule t={t} navigate={navigate} />;
            case 'finance': return <FinanceModule t={t} invoices={invoices} setInvoices={setInvoices} />;
            case 'marketing': return <MarketingModule t={t} />;
            case 'whatsapp': return <WhatsAppModule t={t} />;
            case 'chat': return <ChatModule t={t} setInvoices={setInvoices} />;
            case 'crm': return <div className="flex items-center justify-center h-full text-slate-400">{t('crm_placeholder')}</div>;
            default: return <DashboardHome t={t} />;
        }
    };

    const tabLabels = {
        dashboard: t('dashboard'),
        services: t('services'),
        finance: t('finance'),
        marketing: t('marketing'),
        whatsapp: t('whatsapp_viral'),
        chat: t('conversations'),
        crm: t('crm')
    };
    const activeTabLabel = tabLabels[activeTab] || activeTab;

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-indigo-100">

            {/* Mobile Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex flex-col justify-between shrink-0`}>
                <div>
                    <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Zap className="w-6 h-6 text-white" fill="currentColor" /></div>
                        <div><h1 className="font-black text-xl tracking-tight leading-none">KonvèsIA</h1><span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Ultimate</span></div>
                    </div>
                    <div className="p-4 space-y-2 mt-2">
                        <div className="text-xs font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">{t('management')}</div>
                        <SidebarItem icon={LayoutDashboard} label={t('dashboard')} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }} />
                        <SidebarItem icon={FileText} label={t('finance_payme')} active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setSidebarOpen(false); }} />
                        <SidebarItem icon={ShieldCheck} label="Confiance" active={false} onClick={() => { navigate('/seller/trust'); setSidebarOpen(false); }} statusColor={trustStatusColor} />
                        <SidebarItem icon={Megaphone} label={t('marketing_campaign')} active={activeTab === 'marketing'} onClick={() => { setActiveTab('marketing'); setSidebarOpen(false); }} badge={t('badge_new')} />
                        <div className="my-2 border-t border-gray-100"></div>
                        <SidebarItem icon={Home} label={t('real_estate')} active={false} onClick={() => navigate('/seller/real-estate/new')} badge={t('badge_new')} />
                        <SidebarItem icon={Briefcase} label={t('services')} active={activeTab === 'services'} onClick={() => { setActiveTab('services'); setSidebarOpen(false); }} />
                        <SidebarItem icon={Share2} label={t('whatsapp_viral')} active={activeTab === 'whatsapp'} onClick={() => { setActiveTab('whatsapp'); setSidebarOpen(false); }} className="text-emerald-500" />
                        <div className="text-xs font-bold text-slate-500 uppercase px-4 mt-6 mb-2 tracking-wider">{t('tools')}</div>
                        <SidebarItem icon={MessageSquare} label={t('conversations')} active={activeTab === 'chat'} onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }} />
                        <SidebarItem icon={Users} label={t('crm')} active={activeTab === 'crm'} onClick={() => { setActiveTab('crm'); setSidebarOpen(false); }} />
                    </div>
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                    <div className="mb-2 px-2 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{t('account')}</span>
                        <button className="text-slate-400 hover:text-white" onClick={() => navigate('/login')}><LogOut className="w-4 h-4" /></button>
                    </div>
                    <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-colors text-left">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {currentUser?.email?.substring(0, 2).toUpperCase() || t('me')}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{currentUser?.email || t('user')}</p>
                            {isPremium && <p className="text-xs text-yellow-400 font-bold truncate flex items-center gap-1"><Zap className="w-3 h-3" fill="currentColor" /> {t('pro_member')}</p>}
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full w-full bg-slate-50/50">
                <header className="h-16 bg-white border-b border-slate-200/60 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
                        <h2 className="text-lg font-bold text-slate-800 hidden md:block capitalize">{activeTabLabel}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Language Indicator - handled by global context, but can add specifics here if needed */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                            <Globe className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-700 uppercase">{language}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-6 overflow-hidden overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        renderContent()
                    )}
                </div>
            </main>
        </div>
    );
}
