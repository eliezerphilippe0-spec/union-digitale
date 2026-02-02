import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Transfer = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        recipient: '',
        amount: '',
        note: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Veuillez vous connecter');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'transfer',
                recipient: formData.recipient,
                amount: parseFloat(formData.amount),
                note: formData.note,
                status: 'completed',
                createdAt: serverTimestamp()
            });

            alert(`✅ Transfert de ${formData.amount} HTG envoyé à ${formData.recipient}!`);
            navigate('/pay');
        } catch (error) {
            console.error('Transfer error:', error);
            alert('❌ Erreur lors du transfert');
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
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <Send className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                        Transférer de l'Argent
                    </h1>
                    <p className="text-center text-gray-600 dark:text-neutral-300 mb-8">
                        Envoyez de l'argent instantanément
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Destinataire (Email ou Téléphone)
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.recipient}
                                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                placeholder="email@example.com ou 3712-3456"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Montant (HTG)
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="1000"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                                Note (Optionnel)
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="Message pour le destinataire"
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.recipient || !formData.amount}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Envoyer {formData.amount || '0'} HTG
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Transfer;
