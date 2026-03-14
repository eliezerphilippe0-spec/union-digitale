import React, { useEffect } from 'react';
import { useAmbassador } from '../../contexts/AmbassadorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Link as LinkIcon, DollarSign, Users, Award, BookOpen, Copy } from 'lucide-react';

const AmbassadorDashboard = () => {
    const { ambassadorData, loading, requestPayout } = useAmbassador();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handlePayout = async () => {
        if (!confirm("Confirmer la demande de paiement de " + ambassadorData.totalEarnings + " G ?")) return;
        try {
            await requestPayout();
            alert("Demande envoyée avec succès !");
        } catch (e) {
            alert(e.message);
        }
    };

    useEffect(() => {
        if (!loading) {
            if (!currentUser) {
                navigate('/login?redirect=/ambassador/dashboard');
            } else if (!ambassadorData) {
                navigate('/ambassador/onboarding');
            }
        }
    }, [currentUser, ambassadorData, loading, navigate]);

    if (loading || !currentUser || !ambassadorData) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    const copyLink = () => {
        navigator.clipboard.writeText(`https://uniondigitale.ht?ref=${ambassadorData.code}`);
        alert(t('link_copied'));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar (Mobile hidden for simplicity in this snippet, normally responsive) */}
            <div className="flex">
                <aside className="w-64 bg-white h-screen border-r border-gray-200 hidden md:flex flex-col fixed">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-xl text-blue-900">{t('ambassador_title')}</h2>
                        <span className="text-xs text-gray-500">{t('partner_space')}</span>
                    </div>
                    <nav className="p-4 space-y-2 flex-1">
                        <Link to="/ambassador/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium border border-primary-100">
                            <LayoutDashboard className="w-5 h-5" /> {t('overview')}
                        </Link>
                        <Link to="/ambassador/resources" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                            <BookOpen className="w-5 h-5" /> {t('resources_scripts')}
                        </Link>
                        <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 rounded-lg font-medium cursor-not-allowed transition-colors">
                            <DollarSign className="w-5 h-5" /> {t('payments_soon')}
                        </div>
                    </nav>
                    <div className="p-4 border-t border-gray-100">
                        <div className="bg-gray-900 border border-gray-800 text-white p-4 rounded-lg">
                            <div className="text-xs text-gray-200 mb-1">{t('current_level')}</div>
                            <div className="font-bold text-lg flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-400" /> {ambassadorData.level}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 p-8">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('welcome_ambassador')} {ambassadorData.code} 👋</h1>
                            <p className="text-gray-500">{t('performance_month')}</p>
                        </div>
                        <button
                            onClick={handlePayout}
                            disabled={ambassadorData.totalEarnings < 2500}
                            className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('request_payout')}
                        </button>
                    </header>

                    {/* Stats Cards - Flat Design */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Earnings */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{t('total_earnings')}</div>
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center border border-green-100">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">{ambassadorData.totalEarnings.toLocaleString()} G</div>
                            <div className="text-sm font-medium text-green-600 mt-2 flex items-center gap-1">
                                +{ambassadorData.currentMonthEarnings.toLocaleString()} G ce mois-ci
                            </div>
                        </div>

                        {/* Referrals */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{t('sales_referrals')}</div>
                                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center border border-primary-100">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">{ambassadorData.referralsCount}</div>
                            <div className="text-sm text-gray-500 mt-2">{t('customers_acquired')}</div>
                        </div>

                        {/* Conversion Rate */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{t('conversion_rate')}</div>
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center border border-purple-100">
                                    <Award className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-gray-900">4.5%</div>
                            <div className="text-sm text-gray-500 mt-2">{t('estimated_avg')}</div>
                        </div>
                    </div>

                    {/* Link Generator - Refined */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 max-w-2xl">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-gray-500" /> {t('unique_link')}
                        </h3>
                        <div className="flex bg-gray-50 border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
                            <input
                                type="text"
                                readOnly
                                value={`https://uniondigitale.ht?ref=${ambassadorData.code}`}
                                className="flex-1 bg-transparent px-4 py-3 text-gray-700 font-mono text-sm outline-none"
                            />
                            <button
                                onClick={copyLink}
                                className="bg-gray-900 text-white px-6 font-bold hover:bg-gray-800 flex items-center gap-2 transition-colors border-l border-gray-700"
                            >
                                <Copy className="w-4 h-4" /> {t('copy')}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            {t('share_link_desc')}
                        </p>
                    </div>

                    {/* Recent Activity Placeholder */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-bold text-gray-900">{t('recent_activity')}</h3>
                        </div>
                        <div className="p-8 text-center text-gray-500">
                            {t('no_activity')}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AmbassadorDashboard;
