import React, { useState } from 'react';
import { Check, Truck, Zap, Star, CheckCircle, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';

const UnionPlus = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!currentUser) {
            alert(t('subscribe_alert_login'));
            return;
        }

        setLoading(true);
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                isUnionPlus: true,
                unionPlusSubscriptionDate: new Date().toISOString(),
                unionPlusExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            });

            alert(t('subscribe_success'));
            // window.location.reload(); // No longer needed with real-time AuthContext
        } catch (error) {
            console.error("Error subscribing to Union Plus:", error);
            alert(t('subscribe_error'));
        } finally {
            setLoading(false);
        }
    };

    if (currentUser?.isUnionPlus) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-2xl mx-auto">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-green-800 mb-2">{t('union_plus_member_title')}</h1>
                    <p className="text-green-600 mb-6">{t('union_plus_member_desc')}</p>
                    <div className="text-sm text-gray-500">
                        {t('member_since')} {new Date(currentUser.unionPlusSubscriptionDate).toLocaleDateString()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Hero Section - Modern Gradient Design */}
            <div className="bg-gradient-to-br from-[#0A1D37] via-[#1a3a5c] to-[#0A1D37] text-white py-20 text-center px-4 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-[#FFC400]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFC400]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 italic">Union <span className="text-[#FFC400]">Plus</span></h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-white font-medium">{t('union_plus_hero_desc')}</p>
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="bg-[#FFC400] text-[#0A1D37] font-bold py-4 px-10 rounded-full text-lg hover:bg-[#ffcf33] transition-all shadow-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? t('processing') : t('start_trial_btn')}
                    </button>
                    <p className="mt-6 text-base text-white/90 font-medium">{t('trial_terms')}</p>
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="container mx-auto px-4 py-12 -mt-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Benefit 1 */}
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Truck className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('free_delivery_title')}</h3>
                        <p className="text-gray-600">{t('free_delivery_desc')}</p>
                    </div>

                    {/* Benefit 2 */}
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('exclusive_offers_title')}</h3>
                        <p className="text-gray-600">{t('exclusive_offers_desc')}</p>
                    </div>

                    {/* Benefit 3 */}
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Gift className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('digital_content_title')}</h3>
                        <p className="text-gray-600">{t('digital_content_desc')}</p>
                    </div>
                </div>

                {/* Exclusive Deals Preview */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-[#FFC400] fill-current" />
                        {t('examples_offers')}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative opacity-75">
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                                    <span className="bg-[#FFC400] text-primary text-xs font-bold px-2 py-1 rounded shadow-sm">{t('union_prestige_reserved')}</span>
                                </div>
                                <div className="h-32 bg-gray-200 flex items-center justify-center text-4xl">🎁</div>
                                <div className="p-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ / More Info */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <h2 className="text-2xl font-bold mb-6 text-center">{t('faq_title')}</h2>
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold mb-2">{t('faq_trial_q')}</h4>
                        <p className="text-gray-600">{t('faq_trial_a')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h4 className="font-bold mb-2">{t('faq_eligible_q')}</h4>
                        <p className="text-gray-600">{t('faq_eligible_a')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnionPlus;
