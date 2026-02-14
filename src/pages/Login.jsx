import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import { Mail, Lock, AlertCircle, Phone, ArrowRight, Check } from 'lucide-react';

const Login = () => {
    const [method, setMethod] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('+509');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle, loginWithPhone, setupRecaptcha } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect path from query params (default to /)
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect') || '/';

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate(redirectPath);
        } catch (err) {
            setError('Échec de la connexion. Vérifiez vos identifiants.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (phoneNumber.length < 8) {
            setError("Numéro de téléphone invalide.");
            return;
        }
        try {
            setError('');
            setLoading(true);
            const appVerifier = setupRecaptcha('recaptcha-container');
            const confirmation = await loginWithPhone(phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            alert("Code SMS envoyé !");
        } catch (err) {
            setError("Erreur lors de l'envoi du SMS. Vérifiez le format (+509...)");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await confirmationResult.confirm(otp);
            navigate(redirectPath);
        } catch (err) {
            setError("Code incorrect.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate(redirectPath);
        } catch (err) {
            setError('Échec de la connexion Google.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <SEO title="Connexion" description="Accédez à votre compte Union Digitale." />
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {otpSent ? t('login_verification') : t('login_title')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {t('login_subtitle')}
                    </p>
                </div>

                {/* Method Toggle */}
                {!otpSent && (
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'email' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMethod('email')}
                        >
                            {t('email_label')}
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMethod('phone')}
                        >
                            {t('phone_label')}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* Email Form */}
                {method === 'email' && (
                    <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="relative">
                                <Mail className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm"
                                    placeholder={t('email_label') || "Adresse Email"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                            >
                                {loading ? t('loading') : t('login_title')}
                            </button>
                        </div>
                    </form>
                )}

                {/* Phone Form */}
                {method === 'phone' && (
                    <div className="mt-8 space-y-6">
                        {!otpSent ? (
                            <form onSubmit={handleSendOtp}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_number_label')}</label>
                                    <div className="relative">
                                        <Phone className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            required
                                            className="appearance-none block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                            placeholder="+509 3700 0000"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">{t('sms_code_sent')}</p>
                                </div>
                                <div id="recaptcha-container"></div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
                                >
                                    {loading ? t('sending') : <span className="flex items-center gap-2">{t('send_code_btn')} <ArrowRight className="w-4 h-4" /></span>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('verification_code_label')}</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 text-gray-400 font-mono text-sm">#</div>
                                        <input
                                            type="text"
                                            required
                                            className="appearance-none block w-full px-8 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm tracking-widest text-center text-lg letter-spacing-2"
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                                >
                                    {loading ? t('verifying') : <span className="flex items-center gap-2">{t('verify_confirm_btn')} <Check className="w-4 h-4" /></span>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                >
                                    {t('change_number')}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">{t('or_continue_with')}</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Google
                        </button>
                    </div>
                </div>

                {!otpSent && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            {t('no_account')} <Link to="/register" className="font-medium text-secondary hover:text-secondary-hover">{t('sign_up_link')}</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
