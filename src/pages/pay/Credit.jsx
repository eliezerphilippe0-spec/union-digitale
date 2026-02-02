import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Credit = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        duration: '3'
    });

    const creditOptions = [
        { amount: 500, monthly: 180 },
        { amount: 1000, monthly: 350 },
        { amount: 2000, monthly: 700 },
        { amount: 5000, monthly: 1750 }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Veuillez vous connecter');
            navigate('/login');
            return;
        }

        const amount = parseFloat(formData.amount);
        const duration = parseInt(formData.duration);
        const monthlyPayment = Math.ceil((amount * 1.05) / duration);

        setLoading(true);
        try {
            await addDoc(collection(db, 'credits'), {
                userId: user.uid,
                amount,
                interestRate: 5,
                duration,
                monthlyPayment,
                remainingBalance: amount * 1.05,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            alert(`✅ Demande de crédit de ${amount} HTG soumise!\nPaiement mensuel: ${monthlyPayment} HTG\nDurée: ${duration} mois`);
            navigate('/pay');
        } catch (error) {
            console.error('Credit error:', error);
            alert('❌ Erreur lors de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <button onClick={() => navigate('/pay')} className="flex items-center gap-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white mb-6">
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                </button>

                <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 shadow-lg">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                        Micro-Crédit
                    </h1>
                    <p className="text-center text-gray-600 dark:text-neutral-300 mb-8">
                        Obtenez un crédit rapide et flexible
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-3">
                                Montant du Crédit
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                {creditOptions.map((option) => (
                                    <button
                                        key={option.amount}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, amount: option.amount.toString() })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.amount === option.amount.toString()
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-300 dark:border-neutral-600 hover:border-green-300'
                                            }`}
                                    >
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{option.amount} HTG</p>
                                        <p className="text-sm text-gray-500 dark:text-neutral-400">{option.monthly} HTG/mois</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Durée (mois)
                            </label>
                            <select
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-neutral-700 dark:text-white"
                            >
                                <option value="3">3 mois</option>
                                <option value="6">6 mois</option>
                                <option value="12">12 mois</option>
                            </select>
                        </div>

                        {formData.amount && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-3">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Conditions</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-neutral-300">Montant</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formData.amount} HTG</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-neutral-300">Taux d'intérêt</span>
                                    <span className="font-bold text-gray-900 dark:text-white">5%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-neutral-300">Paiement mensuel</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                        {Math.ceil((parseFloat(formData.amount) * 1.05) / parseInt(formData.duration))} HTG
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !formData.amount}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Traitement...' : 'Soumettre la Demande'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Credit;
