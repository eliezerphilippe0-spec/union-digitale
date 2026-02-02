import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAmbassador } from '../../contexts/AmbassadorContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Check, ArrowRight, Loader } from 'lucide-react';

const AmbassadorOnboarding = () => {
    const { registerAmbassador, ambassadorData, loading: ambassadorLoading } = useAmbassador();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!ambassadorLoading) {
            if (!currentUser) {
                navigate('/login?redirect=/ambassador/onboarding');
            } else if (ambassadorData) {
                navigate('/ambassador/dashboard'); // Already registered
            }
        }
    }, [currentUser, ambassadorData, ambassadorLoading, navigate]);

    if (ambassadorLoading || !currentUser) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        try {
            await registerAmbassador(code);
            setStep(3); // Success step
        } catch (err) {
            setError(err.message || t('registration_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white">{t('ambassador_onboarding_title')}</h1>
                    <p className="text-blue-100 text-sm">{t('step_label')} {step} {t('of_label')} 3</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('ambassador_charter')}</h2>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 h-64 overflow-y-auto border border-gray-200">
                                <p className="font-bold mb-2">{t('charter_ethical_title')}</p>
                                <p className="mb-4">{t('charter_ethical_desc')}</p>
                                <p className="font-bold mb-2">{t('charter_brand_title')}</p>
                                <p className="mb-4">{t('charter_brand_desc')}</p>
                                <p className="font-bold mb-2">{t('charter_spam_title')}</p>
                                <p className="mb-4">{t('charter_spam_desc')}</p>
                                <p className="font-bold mb-2">{t('charter_commission_title')}</p>
                                <p>{t('charter_commission_desc')}</p>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {t('accept_charter')} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('choose_code_title')}</h2>
                            <p className="text-gray-600 text-sm">{t('choose_code_desc')}</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('desired_code_label')}</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder={t('code_placeholder')}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold tracking-widest uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                    maxLength={10}
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('code_constraints')}</p>
                            </div>

                            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

                            <button
                                onClick={handleRegister}
                                disabled={loading || code.length < 3}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader className="animate-spin w-5 h-5" /> : t('validate_registration')}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('congratulations')}</h2>
                            <p className="text-gray-600">{t('official_ambassador_msg')} <strong>{code}</strong> {t('is_active')}</p>

                            <button
                                onClick={() => navigate('/ambassador/dashboard')}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('access_dashboard')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AmbassadorOnboarding;
