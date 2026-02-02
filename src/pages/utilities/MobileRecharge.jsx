import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MobileRecharge = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        operator: 'Natcom',
        phoneNumber: '',
        amount: ''
    });

    const operators = [
        { id: 'Natcom', name: 'Natcom', color: 'from-red-500 to-red-600' },
        { id: 'Digicel', name: 'Digicel', color: 'from-blue-500 to-blue-600' }
    ];

    const predefinedAmounts = [50, 100, 200, 500, 1000, 2000];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Veuillez vous connecter');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'utility_payments'), {
                userId: user.uid,
                type: 'mobile',
                provider: formData.operator,
                accountNumber: formData.phoneNumber,
                amount: parseFloat(formData.amount),
                status: 'completed',
                transactionId: `${formData.operator.toUpperCase()}-${Date.now()}`,
                createdAt: serverTimestamp()
            });

            alert(`✅ Recharge de ${formData.amount} HTG effectuée avec succès!\nNuméro: ${formData.phoneNumber}\nOpérateur: ${formData.operator}`);
            navigate('/utilities');
        } catch (error) {
            console.error('Recharge error:', error);
            alert('❌ Erreur lors de la recharge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <button
                    onClick={() => navigate('/utilities')}
                    className="flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Phone className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                        Recharge Mobile
                    </h1>
                    <p className="text-center text-gray-600 dark:text-neutral-300 mb-8">
                        Rechargez votre téléphone instantanément
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Operator Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                                Opérateur
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {operators.map((operator) => (
                                    <button
                                        key={operator.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, operator: operator.id })}
                                        className={`py-4 px-6 rounded-lg border-2 font-bold transition-all ${formData.operator === operator.id
                                                ? `border-transparent bg-gradient-to-r ${operator.color} text-white shadow-lg`
                                                : 'border-gray-300 dark:border-neutral-600 hover:border-blue-300 dark:text-white'
                                            }`}
                                    >
                                        {operator.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Numéro de Téléphone
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="Ex: 3712-3456"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        {/* Predefined Amounts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                                Montant
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {predefinedAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                                        className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${formData.amount === amount.toString()
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                : 'border-gray-300 dark:border-neutral-600 hover:border-blue-300 dark:text-white'
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
                                Montant Personnalisé
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="Entrez le montant"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        {/* Summary */}
                        {formData.amount && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {formData.amount} HTG
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !formData.phoneNumber || !formData.amount}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Traitement...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Recharger Maintenant
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                            ⚡ <strong>Instantané:</strong> Votre recharge sera créditée en moins de 30 secondes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileRecharge;
