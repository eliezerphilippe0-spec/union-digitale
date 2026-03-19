import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, CreditCard, User, Phone, Zap, Shield, CheckCircle, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Transfer = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        recipient: '',
        amount: '',
        note: ''
    });
    const [recents, setRecents] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('internal_transfer_recents');
        if (saved) setRecents(JSON.parse(saved).slice(0, 4));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
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

            // Save to recents
            const newRecent = { id: formData.recipient };
            const updatedRecents = [newRecent, ...recents.filter(r => r.id !== newRecent.id)].slice(0, 4);
            localStorage.setItem('internal_transfer_recents', JSON.stringify(updatedRecents));

            setTimeout(() => {
                setLoading(false);
                setShowSuccess(true);
            }, 1500);
        } catch (error) {
            console.error('Transfer error:', error);
            alert('❌ Erreur lors du transfert');
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center p-6">
                <div className="text-center max-w-sm w-full">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-200 animate-in zoom-in duration-500">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-[#0A1D37] dark:text-white mb-2">Envoyé !</h2>
                    <p className="text-gray-400 font-medium mb-10">
                        {formData.amount} HTG ont été transférés avec succès à {formData.recipient}
                    </p>
                    <div className="space-y-3">
                        <button className="w-full bg-[#0A1D37] text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2">
                            <Download size={18} /> Reçu PDF
                        </button>
                        <button onClick={() => navigate('/pay')} className="w-full text-gray-400 font-black text-xs uppercase tracking-widest py-4">
                            Retour à Zabely Pay
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-20">
            <div className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700 sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/pay')} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl">
                        <ArrowLeft size={24} className="text-gray-600 dark:text-white" />
                    </button>
                    <h1 className="text-lg font-black text-[#0A1D37] dark:text-white uppercase tracking-tighter">Transfert Zabely Pay</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-6 pt-10">
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-neutral-700 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-100 dark:shadow-none">
                        <Zap size={32} className="text-white fill-current" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0A1D37] dark:text-white mb-2">Envoyer de l'argent</h2>
                    <p className="text-sm text-gray-400 dark:text-neutral-400 font-medium mb-8">Paiement instantané entre comptes Zabely Pay.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Bénéficiaire</label>
                                {recents.length > 0 && <span className="text-[10px] font-black text-blue-600 uppercase">Récents</span>}
                            </div>

                            {recents.length > 0 && (
                                <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                    {recents.map((recent, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, recipient: recent.id })}
                                            className="min-w-[70px] flex flex-col items-center gap-1.5 group"
                                        >
                                            <div className="w-12 h-12 bg-gray-50 dark:bg-neutral-700 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-all">
                                                <User size={18} />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-500 dark:text-neutral-400 truncate w-full text-center">
                                                {recent.id.split('@')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={formData.recipient}
                                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                                    placeholder="Email ou Téléphone"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-neutral-700 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold text-[#0A1D37] dark:text-white placeholder:text-gray-300 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-4">Montant (HTG)</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-blue-600">G</div>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full pl-14 pr-4 py-8 bg-gray-50 dark:bg-neutral-700 border-none rounded-3xl focus:ring-2 focus:ring-blue-600 font-black text-5xl text-[#0A1D37] dark:text-white placeholder:text-gray-100 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-4">Note (Optionnel)</label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="Pour quoi est ce paiement ?"
                                rows="2"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-700 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold text-[#0A1D37] dark:text-white placeholder:text-gray-300 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.recipient || !formData.amount}
                            className="w-full bg-[#0A1D37] dark:bg-blue-600 text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-blue-100 dark:shadow-none hover:bg-blue-900 dark:hover:bg-blue-500 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Send size={24} />
                                    Confirmer le Transfert
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-center gap-3 text-gray-400 py-6">
                    <Shield size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Sécurisée Zabely Pay</span>
                </div>
            </main>
        </div>
    );
};

export default Transfer;
