import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { CreditCard, CheckCircle, Smartphone, Globe, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const Subscription = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [vendorData, setVendorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const functions = getFunctions();

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(doc(db, 'vendors', currentUser.uid), (doc) => {
            if (doc.exists()) {
                setVendorData(doc.data());
            } else {
                setVendorData(null); // No subscription yet
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleSubscribe = async () => {
        setProcessing(true);
        try {
            const createSession = httpsCallable(functions, 'createVendorSubscriptionSession');
            const result = await createSession({
                vendorId: currentUser.uid,
                email: currentUser.email
            });

            // Redirect to Stripe
            window.location.href = result.data.url;
        } catch (error) {
            console.error("Subscription Error:", error);
            alert(t('subscription_error_alert').replace('{error}', error.message));
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    const isPremium = vendorData?.premiumAccess;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('my_subscription_title')}</h1>
            <p className="text-gray-500 mb-8">{t('manage_subscription_desc')}</p>


            {isPremium ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-fadeIn">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-green-800 mb-2">{t('active_subscription_title')}</h2>
                    <p className="text-green-700 mb-6">{t('active_subscription_desc')}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
                        <div className="bg-white p-4 rounded shadow-sm">
                            <p className="text-sm text-gray-500">{t('sub_status_label')}</p>
                            <p className="font-bold text-gray-900 capitalize">{vendorData.subscriptionStatus}</p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-sm">
                            <p className="text-sm text-gray-500">{t('sub_renewal_label')}</p>
                            <p className="font-bold text-gray-900">
                                {vendorData.subscriptionPeriodEnd?.toDate().toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded shadow-sm">
                            <p className="text-sm text-gray-500">{t('sub_plan_label')}</p>
                            <p className="font-bold text-gray-900">{t('union_pro_plan')}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button disabled className="text-gray-400 text-sm cursor-not-allowed">
                            {t('manage_portal_btn')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('upgrade_title')}</h2>
                        <ul className="space-y-4">
                            {[
                                t('feature_commission'),
                                t('feature_badge'),
                                t('feature_priority'),
                                t('feature_support'),
                                t('feature_analytics')
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-secondary" />
                                    <span className="text-gray-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white border-2 border-secondary rounded-2xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                            {t('recommended_badge')}
                        </div>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{t('union_pro_plan')}</h3>
                            <div className="mt-4 flex items-baseline justify-center">
                                <span className="text-5xl font-extrabold text-gray-900">$29</span>
                                <span className="text-xl font-medium text-gray-500">{t('price_per_month')}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">{t('billing_info')}</p>
                        </div>

                        <button
                            onClick={handleSubscribe}
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-secondary-hover transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-wait"
                        >
                            {processing ? t('redirecting_btn') : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    {t('subscribe_now_btn')}
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">
                            {t('secure_payment_footer')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscription;
