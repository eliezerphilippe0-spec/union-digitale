import React, { useState } from 'react';
import SEO from '../../components/common/SEO';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ElectricityPayment = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        meterNumber: '',
        amount: ''
    });

    const predefinedAmounts = [500, 1000, 1500, 2000, 3000, 5000];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Veuillez vous connecter');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Save to Firestore
            await addDoc(collection(db, 'utility_payments'), {
                userId: user.uid,
                type: 'electricity',
                provider: 'EDH',
                accountNumber: formData.meterNumber,
                amount: parseFloat(formData.amount),
                status: 'completed',
                transactionId: `EDH-${Date.now()}`,
                createdAt: serverTimestamp()
            });

            alert(`✅ Paiement de ${formData.amount} HTG effectué avec succès!\nNuméro de compteur: ${formData.meterNumber}`);
            navigate('/utilities');
        } catch (error) {
            console.error('Payment error:', error);
            alert('❌ Erreur lors du paiement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <SEO title="Paiement électricité" description="Payez vos factures d’électricité en toute sécurité." />
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <button
                    onClick={() => navigate('/utilities')}
                    className="flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
                    {/* Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                        Paiement EDH
                    </h1>
                    <p className="text-center text-gray-600 dark:text-neutral-300 mb-8">
                        Payez votre facture d'électricité en ligne
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Meter Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Numéro de Compteur
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.meterNumber}
                                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                                placeholder="Ex: 123456789"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        {/* Predefined Amounts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                                Montant Rapide
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {predefinedAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                                        className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${formData.amount === amount.toString()
                                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                : 'border-gray-300 dark:border-neutral-600 hover:border-yellow-300 dark:text-white'
                                            }`}
                                    >
                                        {amount} HTG
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Ou Montant Personnalisé
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="Entrez le montant"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        {/* Summary */}
                        {formData.amount && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-700 dark:text-neutral-300">Montant</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {formData.amount} HTG
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-700 dark:text-neutral-300">Frais</span>
                                    <span className="font-bold text-gray-900 dark:text-white">0 HTG</span>
                                </div>
                                <div className="border-t border-yellow-300 dark:border-yellow-700 pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                        <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {formData.amount} HTG
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !formData.meterNumber || !formData.amount}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Payer avec MonCash
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            💡 <strong>Astuce:</strong> Votre paiement sera traité instantanément et vous recevrez un reçu par email.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElectricityPayment;
