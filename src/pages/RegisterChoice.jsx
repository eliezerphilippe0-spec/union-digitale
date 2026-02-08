import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';

const RegisterChoice = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const buyerBenefits = [
        { icon: '🚚', text: 'Livraison rapide partout en Haïti' },
        { icon: '💳', text: 'Paiement sécurisé (MonCash, Natcash)' },
        { icon: '🛡️', text: 'Protection acheteur garantie' },
        { icon: '⭐', text: 'Avis clients vérifiés' }
    ];

    const sellerBenefits = [
        { icon: '💰', text: 'Commissions compétitives (5-15%)' },
        { icon: '🚀', text: 'Millions d\'acheteurs potentiels' },
        { icon: '📦', text: 'Outils de gestion gratuits' },
        { icon: '📊', text: 'Analytics en temps réel' }
    ];

    return (
        <>
            <SEO
                title="Inscription - Union Digitale"
                description="Rejoignez Union Digitale en tant qu'acheteur ou vendeur"
            />

            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
                            Rejoignez Union Digitale
                        </h1>
                        <p className="text-xl text-neutral-600">
                            Choisissez votre type de compte pour commencer
                        </p>
                    </div>

                    {/* Choice Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        {/* Buyer Card */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white">
                                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 mx-auto">
                                    <ShoppingBag className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-center mb-2">
                                    Je suis Acheteur
                                </h2>
                                <p className="text-center text-primary-100">
                                    Découvrez des milliers de produits
                                </p>
                            </div>

                            <div className="p-8">
                                <div className="space-y-4 mb-8">
                                    {buyerBenefits.map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="text-2xl">{benefit.icon}</span>
                                            <p className="text-neutral-700 flex-1">{benefit.text}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/register/buyer')}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                                >
                                    Créer un compte acheteur
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-center text-sm text-neutral-500 mt-4">
                                    Inscription en 2 minutes ⚡
                                </p>
                            </div>
                        </div>

                        {/* Seller Card */}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-accent-500">
                            <div className="bg-gradient-to-br from-accent-600 to-accent-800 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-yellow-400 text-accent-900 px-4 py-1 text-sm font-bold rounded-bl-lg">
                                    POPULAIRE
                                </div>
                                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 mx-auto">
                                    <Store className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-center mb-2">
                                    Je suis Vendeur
                                </h2>
                                <p className="text-center text-accent-100">
                                    Développez votre business en ligne
                                </p>
                            </div>

                            <div className="p-8">
                                <div className="space-y-4 mb-8">
                                    {sellerBenefits.map((benefit, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="text-2xl">{benefit.icon}</span>
                                            <p className="text-neutral-700 flex-1">{benefit.text}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/seller/welcome')}
                                    className="w-full bg-accent-600 hover:bg-accent-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                                >
                                    Devenir vendeur
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <p className="text-center text-sm text-neutral-500 mt-4">
                                    En savoir plus sur le programme vendeur
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Already have account */}
                    <div className="text-center">
                        <p className="text-neutral-600">
                            Vous avez déjà un compte ?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-primary-600 hover:text-primary-700 font-semibold"
                            >
                                Connectez-vous
                            </button>
                        </p>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary-900">10,000+</div>
                            <div className="text-sm text-neutral-600">Produits</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-900">5,000+</div>
                            <div className="text-sm text-neutral-600">Vendeurs</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-900">50,000+</div>
                            <div className="text-sm text-neutral-600">Acheteurs</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary-900">4.8/5</div>
                            <div className="text-sm text-neutral-600">Satisfaction</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterChoice;
