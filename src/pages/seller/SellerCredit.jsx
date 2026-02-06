/**
 * Seller Credit - Financing for Sellers
 * Inspired by: Shopify Capital, Amazon Lending, Mercado Crédito
 */

import React, { useState } from 'react';
import {
    DollarSign, TrendingUp, Clock, Shield, CheckCircle, AlertCircle,
    Calculator, ArrowRight, FileText, Calendar, PieChart, Zap,
    CreditCard, Percent, Lock, HelpCircle
} from 'lucide-react';

// Mock seller data
const SELLER_DATA = {
    name: 'TechStore Haiti',
    monthlyRevenue: 450000,
    averageOrderValue: 12500,
    accountAge: 8, // months
    rating: 4.8,
    fulfillmentRate: 98,
    returnRate: 2,
};

// Credit offers based on performance
const calculateCreditOffers = (seller) => {
    const baseAmount = seller.monthlyRevenue * 2;
    
    return [
        {
            id: 'offer_1',
            amount: Math.floor(baseAmount * 0.5),
            term: 3,
            fee: 5,
            dailyPayment: Math.floor((baseAmount * 0.5 * 1.05) / 90),
            totalRepayment: Math.floor(baseAmount * 0.5 * 1.05),
            recommended: false,
        },
        {
            id: 'offer_2',
            amount: Math.floor(baseAmount * 0.75),
            term: 6,
            fee: 8,
            dailyPayment: Math.floor((baseAmount * 0.75 * 1.08) / 180),
            totalRepayment: Math.floor(baseAmount * 0.75 * 1.08),
            recommended: true,
        },
        {
            id: 'offer_3',
            amount: baseAmount,
            term: 12,
            fee: 12,
            dailyPayment: Math.floor((baseAmount * 1.12) / 360),
            totalRepayment: Math.floor(baseAmount * 1.12),
            recommended: false,
        },
    ];
};

// Credit Offer Card
const CreditOfferCard = ({ offer, selected, onSelect }) => (
    <button
        onClick={() => onSelect(offer)}
        className={`relative w-full p-6 rounded-2xl border-2 text-left transition-all ${
            selected
                ? 'border-gold-500 bg-gold-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
    >
        {offer.recommended && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold-500 text-white text-xs font-bold rounded-full">
                Recommandé
            </span>
        )}
        
        <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Montant disponible</p>
            <p className="text-3xl font-bold text-gray-900">{offer.amount.toLocaleString()} G</p>
        </div>
        
        <div className="space-y-3">
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Durée</span>
                <span className="font-medium">{offer.term} mois</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frais fixes</span>
                <span className="font-medium">{offer.fee}%</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prélèvement quotidien</span>
                <span className="font-medium">{offer.dailyPayment.toLocaleString()} G</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                <span className="text-gray-500">Total à rembourser</span>
                <span className="font-bold text-gray-900">{offer.totalRepayment.toLocaleString()} G</span>
            </div>
        </div>

        {selected && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
            </div>
        )}
    </button>
);

// Main Seller Credit Page
const SellerCredit = () => {
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [step, setStep] = useState('offers'); // 'offers' | 'review' | 'success'
    const [isEligible] = useState(true);
    
    const offers = calculateCreditOffers(SELLER_DATA);

    const handleApply = () => {
        if (!selectedOffer) return;
        setStep('review');
    };

    const handleConfirm = () => {
        // In production, this would submit the application
        setStep('success');
    };

    // Not eligible view
    if (!isEligible) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pas encore éligible</h2>
                        <p className="text-gray-600 mb-6">
                            Pour accéder au crédit vendeur, vous devez avoir au moins 3 mois d'historique de ventes 
                            et maintenir un bon niveau de performance.
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 text-left">
                            <h3 className="font-semibold mb-3">Critères d'éligibilité:</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Minimum 3 mois d'activité
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Taux d'exécution {'>'} 95%
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Note vendeur {'>'} 4.0
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Pas d'incidents de paiement
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success view
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Demande Approuvée!</h2>
                        <p className="text-gray-600 mb-6">
                            Votre financement de <span className="font-bold text-gold-600">{selectedOffer.amount.toLocaleString()} G</span> a été approuvé. 
                            Les fonds seront disponibles dans votre portefeuille sous 24h.
                        </p>
                        <div className="bg-gold-50 rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-left">
                                    <p className="text-gray-500">Montant</p>
                                    <p className="font-bold text-lg">{selectedOffer.amount.toLocaleString()} G</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-500">Durée</p>
                                    <p className="font-bold text-lg">{selectedOffer.term} mois</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-500">Prélèvement quotidien</p>
                                    <p className="font-bold text-lg">{selectedOffer.dailyPayment.toLocaleString()} G</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-500">Premier prélèvement</p>
                                    <p className="font-bold text-lg">Dans 7 jours</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = '/seller/dashboard'}
                            className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-xl font-bold transition-colors"
                        >
                            Retour au tableau de bord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Review view
    if (step === 'review') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="bg-white rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmer votre demande</h2>
                        
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="font-semibold mb-4">Récapitulatif du financement</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Montant du financement</span>
                                    <span className="font-bold">{selectedOffer.amount.toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Frais de service ({selectedOffer.fee}%)</span>
                                    <span className="font-medium">{(selectedOffer.totalRepayment - selectedOffer.amount).toLocaleString()} G</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-gray-200">
                                    <span className="text-gray-900 font-semibold">Total à rembourser</span>
                                    <span className="font-bold text-lg">{selectedOffer.totalRepayment.toLocaleString()} G</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-900">Remboursement automatique</p>
                                    <p className="text-sm text-blue-700">
                                        {selectedOffer.dailyPayment.toLocaleString()} G seront prélevés quotidiennement sur vos ventes 
                                        pendant {selectedOffer.term} mois.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" className="mt-1 w-5 h-5 text-gold-500 rounded" required />
                                <span className="text-sm text-gray-600">
                                    J'accepte les <a href="#" className="text-gold-600 hover:underline">conditions générales</a> du programme de financement Union Digitale.
                                </span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" className="mt-1 w-5 h-5 text-gold-500 rounded" required />
                                <span className="text-sm text-gray-600">
                                    J'autorise le prélèvement automatique sur mes ventes pour le remboursement.
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('offers')}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Retour
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Confirmer la demande
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Offers view (default)
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 rounded-full mb-4">
                            <Zap className="w-4 h-4 text-gold-400" />
                            <span className="text-sm font-medium text-gold-400">Union Capital</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            Financez la croissance de votre boutique
                        </h1>
                        <p className="text-gray-300 text-lg">
                            Accédez à des fonds rapidement, sans paperasse. Remboursement flexible basé sur vos ventes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Eligibility Banner */}
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-900">Vous êtes éligible!</h3>
                                <p className="text-green-700 text-sm">
                                    Basé sur vos performances, vous pouvez obtenir jusqu'à {(SELLER_DATA.monthlyRevenue * 2).toLocaleString()} G
                                </p>
                            </div>
                        </div>

                        {/* Credit Offers */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Choisissez votre financement</h2>
                            <div className="grid md:grid-cols-3 gap-4">
                                {offers.map(offer => (
                                    <CreditOfferCard
                                        key={offer.id}
                                        offer={offer}
                                        selected={selectedOffer?.id === offer.id}
                                        onSelect={setSelectedOffer}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={handleApply}
                            disabled={!selectedOffer}
                            className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            Continuer avec {selectedOffer ? `${selectedOffer.amount.toLocaleString()} G` : 'une offre'}
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        {/* How it works */}
                        <div className="bg-white rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-6">Comment ça marche?</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calculator className="w-6 h-6 text-gold-600" />
                                    </div>
                                    <h4 className="font-semibold mb-1">1. Choisissez</h4>
                                    <p className="text-sm text-gray-500">Sélectionnez le montant et la durée qui vous conviennent</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Zap className="w-6 h-6 text-gold-600" />
                                    </div>
                                    <h4 className="font-semibold mb-1">2. Recevez</h4>
                                    <p className="text-sm text-gray-500">Fonds disponibles dans votre portefeuille sous 24h</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp className="w-6 h-6 text-gold-600" />
                                    </div>
                                    <h4 className="font-semibold mb-1">3. Remboursez</h4>
                                    <p className="text-sm text-gray-500">Prélèvement automatique sur vos ventes quotidiennes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Your Performance */}
                        <div className="bg-white rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Votre performance</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Revenus mensuels</span>
                                        <span className="font-medium">{SELLER_DATA.monthlyRevenue.toLocaleString()} G</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-gold-500 rounded-full" style={{ width: '75%' }} />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Ancienneté</span>
                                    <span className="font-medium">{SELLER_DATA.accountAge} mois</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Note vendeur</span>
                                    <span className="font-medium">⭐ {SELLER_DATA.rating}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Taux d'exécution</span>
                                    <span className="font-medium text-green-600">{SELLER_DATA.fulfillmentRate}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="bg-white rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Avantages</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Pas de vérification de crédit</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Approbation en quelques minutes</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Remboursement flexible basé sur ventes</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Pas de pénalités de remboursement anticipé</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Aucun impact sur votre crédit personnel</span>
                                </li>
                            </ul>
                        </div>

                        {/* FAQ */}
                        <div className="bg-white rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5" />
                                Questions fréquentes
                            </h3>
                            <div className="space-y-3 text-sm">
                                <details className="group">
                                    <summary className="font-medium cursor-pointer">Quand vais-je recevoir les fonds?</summary>
                                    <p className="text-gray-500 mt-2 pl-4">Sous 24h ouvrées après approbation.</p>
                                </details>
                                <details className="group">
                                    <summary className="font-medium cursor-pointer">Puis-je rembourser plus tôt?</summary>
                                    <p className="text-gray-500 mt-2 pl-4">Oui, sans frais supplémentaires.</p>
                                </details>
                                <details className="group">
                                    <summary className="font-medium cursor-pointer">Que se passe-t-il si je n'ai pas de ventes?</summary>
                                    <p className="text-gray-500 mt-2 pl-4">Aucun prélèvement les jours sans ventes.</p>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerCredit;
