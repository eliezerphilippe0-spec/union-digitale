import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Store, BarChart3, CreditCard, ArrowRight, Zap, ArrowLeft, HeartHandshake } from 'lucide-react';
import SEO from '../components/common/SEO';
import Button from '../components/ui/Button';

const SellerOnboarding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isNewSeller = location.state?.newSeller;

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Form States (Simulated for the wizard flow)
    const [storeName, setStoreName] = useState('');
    const [storeDesc, setStoreDesc] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleFinish = () => {
        // Here we would typically save the onboarding data to Firebase
        navigate('/seller/dashboard');
    };

    return (
        <>
            <SEO
                title="Configuration Boutique - Zabely"
                description="Configurez votre espace vendeur sur Zabely"
            />

            <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center">
                <div className="max-w-3xl w-full">
                    
                    {/* Progress Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">Configuration de votre boutique</h1>
                            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                Étape {currentStep} sur {totalSteps}
                            </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Step Containers */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 min-h-[400px] flex flex-col relative">
                        
                        {/* STEP 1: Store Identity */}
                        {currentStep === 1 && (
                            <div className="flex-1 animate-fade-in">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Identité de la boutique</h2>
                                        <p className="text-gray-500">Comment vos clients vous reconnaîtront-ils ?</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-5 mt-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
                                        <input 
                                            type="text" 
                                            className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            placeholder="Ex: Creole Tech Store"
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description courte (Slogan)</label>
                                        <input 
                                            type="text" 
                                            className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            placeholder="Ex: Le spécialiste des gadgets en Haïti"
                                            value={storeDesc}
                                            onChange={(e) => setStoreDesc(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Payment Configuration */}
                        {currentStep === 2 && (
                            <div className="flex-1 animate-fade-in">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Méthodes de Paiement</h2>
                                        <p className="text-gray-500">Comment souhaitez-vous recevoir vos fonds ?</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    {/* MonCash Option */}
                                    <div 
                                        onClick={() => setPaymentMethod('moncash')}
                                        className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'moncash' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="font-bold text-lg mb-1">MonCash</div>
                                        <p className="text-sm text-gray-600">Recevez vos paiements directement sur votre compte MonCash.</p>
                                        <div className="mt-4">
                                             <input type="text" placeholder="Numéro MonCash" className="w-full text-sm rounded border-gray-300 border p-2 bg-white" onClick={(e) => e.stopPropagation()}/>
                                        </div>
                                    </div>

                                    {/* NatCash Option */}
                                    <div 
                                        onClick={() => setPaymentMethod('natcash')}
                                        className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${paymentMethod === 'natcash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="font-bold text-lg mb-1">NatCash</div>
                                        <p className="text-sm text-gray-600">Recevez vos paiements sur le réseau Natcom NatCash.</p>
                                        <div className="mt-4">
                                            <input type="text" placeholder="Numéro NatCash" className="w-full text-sm rounded border-gray-300 border p-2 bg-white" onClick={(e) => e.stopPropagation()}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Almost Done */}
                        {currentStep === 3 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in py-8">
                                <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-6">
                                    <HeartHandshake className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Tout est prêt, {storeName || 'Partenaire'} !</h2>
                                <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
                                    Votre boutique est maintenant configurée de base. Il ne vous reste plus qu'à ajouter votre premier produit pour commencer à vendre.
                                </p>
                                
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 max-w-lg text-left">
                                    <Zap className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-yellow-800">Conseil de pro</h4>
                                        <p className="text-sm text-yellow-700 mt-1">Les boutiques avec au moins 3 produits détaillés génèrent leurs premières ventes 2x plus vite.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="mt-auto pt-8 flex items-center justify-between border-t border-gray-100">
                            <button 
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ArrowLeft className="w-4 h-4" /> Précédent
                            </button>

                            {currentStep < totalSteps ? (
                                <button 
                                    onClick={nextStep}
                                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFinish}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition-all shadow-sm"
                                >
                                    Accéder au Dashboard <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                    </div>
                    
                    {/* Skip link */}
                    <div className="text-center mt-6">
                        <Link to="/seller/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
                            Passer la configuration pour le moment
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
};

export default SellerOnboarding;
