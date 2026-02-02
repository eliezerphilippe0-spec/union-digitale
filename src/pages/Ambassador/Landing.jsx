import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Rocket, DollarSign, Users, Award, CheckCircle } from 'lucide-react';

const AmbassadorLanding = () => {
    const { t } = useLanguage();

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="bg-blue-800 text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">{t('ambassador_official_program')}</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                        {t('ambassador_hero_title_1')} <span className="text-yellow-400">Union Digitale</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white mb-10 max-w-2xl mx-auto">
                        {t('ambassador_hero_desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/ambassador/join" className="bg-yellow-400 text-blue-900 font-bold py-4 px-8 rounded-full text-lg hover:bg-yellow-300 transition-all transform hover:-translate-y-1 shadow-lg">
                            {t('ambassador_join_btn')}
                        </Link>
                        <Link to="/login" className="bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white/10 transition-all">
                            {t('ambassador_login_btn')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats / Social Proof */}
            <div className="bg-white py-10 border-b border-gray-100">
                <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
                    <div>
                        <div className="text-3xl font-bold text-gray-900">20%</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wide">{t('ambassador_stat_digital')}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">10%</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wide">{t('ambassador_stat_physical')}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">{t('ambassador_stat_levels')}</div>
                        <div className="text-sm text-gray-500 uppercase tracking-wide">{t('ambassador_stat_career')}</div>
                    </div>
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="py-20 container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('ambassador_why_title')}</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">{t('ambassador_why_desc')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('ambassador_benefit_1_title')}</h3>
                        <p className="text-gray-600">{t('ambassador_benefit_1_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                            <Rocket className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('ambassador_benefit_2_title')}</h3>
                        <p className="text-gray-600">{t('ambassador_benefit_2_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
                            <Award className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('ambassador_benefit_3_title')}</h3>
                        <p className="text-gray-600">{t('ambassador_benefit_3_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Levels Section - Modern Gradient */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">{t('ambassador_levels_title')}</h2>
                        <p className="text-gray-200">{t('ambassador_levels_desc')}</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {['Starter', 'Pro', 'Elite', 'Legend'].map((level, idx) => (
                            <div key={level} className={`p-6 rounded-xl border backdrop-blur-sm transition-all hover:scale-105 ${idx === 3 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-600 bg-white/5'}`}>
                                <h3 className={`text-xl font-bold mb-2 ${idx === 3 ? 'text-yellow-400' : 'text-white'}`}>{level}</h3>
                                <div className="text-sm text-white/80 mb-4 font-medium">
                                    {idx === 0 ? t('level_starter_desc') : idx === 1 ? '> 10k G / mois' : idx === 2 ? '> 50k G / mois' : '> 100k G / mois'}
                                </div>
                                <ul className="space-y-2 text-sm text-white">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('level_benefit_commission')}</li>
                                    {idx > 0 && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('level_benefit_bonus')}</li>}
                                    {idx > 1 && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('level_benefit_support')}</li>}
                                    {idx > 2 && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('level_benefit_mastermind')}</li>}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="py-20 text-center px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('ambassador_cta_title')}</h2>
                <Link to="/ambassador/join" className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-blue-700 transition-all shadow-xl">
                    {t('ambassador_cta_btn')}
                </Link>
            </div>
        </div>
    );
};

export default AmbassadorLanding;
