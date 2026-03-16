import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BILL_CATEGORIES, createBillPaymentRecord, getUserBills } from '../services/billingService';
import { Zap, Droplets, Globe, GraduationCap, ArrowRight, History, CreditCard, AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logger from '../utils/logger';

const PayBills = () => {
    const { currentUser } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Category, 2: Account Info, 3: Confirmation
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [userBills, setUserBills] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (currentUser) {
            fetchHistory();
        }
    }, [currentUser]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const bills = await getUserBills(currentUser.uid);
            setUserBills(bills);
        } catch (error) {
            console.error("Error fetching bill history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setStep(2);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const paymentRecord = {
                category: selectedCategory.id,
                categoryLabel: selectedCategory.label,
                accountNumber,
                amount: parseFloat(amount),
                timestamp: new Date()
            };

            const billId = await createBillPaymentRecord(currentUser.uid, paymentRecord);

            // Redirect to a simulated payment gateway or MonCash flow
            // For now, we simulate success for the demo flow
            logger.success(`Paiement initié pour ${selectedCategory.label}`);
            navigate(`/order-confirmation?orderId=${billId}&type=bill`);
        } catch (error) {
            logger.error('Failed to process bill payment', error);
            alert("Une erreur est survenue lors de l'initiation du paiement.");
        } finally {
            setLoading(false);
        }
    };

    const renderCategoryIcon = (id) => {
        switch (id) {
            case 'edh': return <Zap className="w-8 h-8 text-yellow-500" />;
            case 'dinepa': return <Droplets className="w-8 h-8 text-blue-500" />;
            case 'internet': return <Globe className="w-8 h-8 text-purple-500" />;
            case 'scolarite': return <GraduationCap className="w-8 h-8 text-green-500" />;
            default: return <CreditCard className="w-8 h-8 text-gray-500" />;
        }
    };

    return (
        <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen transition-colors duration-300">
            {/* Header / Hero */}
            <div className="bg-[#0A1D37] dark:bg-neutral-950 text-white py-16 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-3xl md:text-5xl font-black mb-4">UD-Peye Bil</h1>
                    <p className="text-lg opacity-80 max-w-2xl mx-auto font-medium">
                        Payez vos factures d'électricité, d'eau et d'internet en un clic.
                        Plus besoin de faire la queue aux bureaux de paiement.
                    </p>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 -mt-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Interaction Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-8 border border-neutral-100 dark:border-neutral-700 min-h-[500px]">

                            {/* Step Indicator */}
                            <div className="flex items-center gap-2 mb-10">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${step >= i ? 'bg-secondary' : 'bg-neutral-100 dark:bg-neutral-700'}`} />
                                ))}
                            </div>

                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-black text-[#0A1D37] dark:text-white mb-6">Quel service voulez-vous payer ?</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.values(BILL_CATEGORIES).map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat)}
                                                className="flex items-center gap-4 p-6 bg-white dark:bg-neutral-700/50 border-2 border-neutral-50 dark:border-neutral-700 rounded-[2rem] hover:border-secondary hover:bg-secondary/5 dark:hover:bg-secondary/10 transition-all text-left group"
                                            >
                                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl group-hover:bg-white dark:group-hover:bg-neutral-700 transition-colors">
                                                    {renderCategoryIcon(cat.id)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#0A1D37] dark:text-white">{cat.label}</p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest">Traitement Instantané</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 ml-auto text-neutral-300 dark:text-neutral-600 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && selectedCategory && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <button onClick={() => setStep(1)} className="text-neutral-500 dark:text-neutral-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 hover:text-secondary transition-colors">
                                        ← Retour au choix
                                    </button>
                                    <h2 className="text-2xl font-black text-[#0A1D37] dark:text-white mb-8 flex items-center gap-3">
                                        {renderCategoryIcon(selectedCategory.id)}
                                        {selectedCategory.label}
                                    </h2>

                                    <form onSubmit={handleSubmitPayment} className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-[#0A1D37] dark:text-neutral-300 mb-2 px-2">Numéro de Compte / Matricule</label>
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                                    <input
                                                        required
                                                        type="text"
                                                        value={accountNumber}
                                                        onChange={(e) => setAccountNumber(e.target.value)}
                                                        placeholder="Ex: 54321098..."
                                                        className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-2xl focus:ring-2 focus:ring-secondary font-bold text-[#0A1D37] dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-[#0A1D37] dark:text-neutral-300 mb-2 px-2">Montant (HTG)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-2xl focus:ring-2 focus:ring-secondary font-bold text-2xl text-[#0A1D37] dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3 text-amber-800 dark:text-amber-200 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p className="font-medium">
                                                Vérifiez bien votre numéro de matricule. Les paiements effectués ne sont pas remboursables une fois validés par l'EDH/DINEPA.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-secondary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                                            {loading ? "Traitement..." : "Payer Maintenant"}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / History */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-xl shadow-neutral-900/5 p-8 border border-neutral-100 dark:border-neutral-700">
                            <h3 className="font-black text-[#0A1D37] dark:text-white mb-6 flex items-center gap-2">
                                <History className="w-5 h-5 text-secondary" />
                                Historique
                            </h3>

                            {loadingHistory ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : userBills.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Aucun paiement récent.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {userBills.slice(0, 5).map(bill => (
                                        <div key={bill.id} className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-2xl border border-neutral-100 dark:border-neutral-700 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm text-[#0A1D37] dark:text-white">
                                                {renderCategoryIcon(bill.category)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#0A1D37] dark:text-white">{bill.categoryLabel}</p>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">{new Date(bill.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-secondary">{bill.amount} HTG</p>
                                                <p className="text-[10px] text-green-500 font-black">Validé</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reassurance */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
                            <CheckCircle2 className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-10" />
                            <h4 className="font-black text-xl mb-4">UD-Garantie</h4>
                            <p className="text-sm opacity-80 font-medium leading-relaxed">
                                Chaque paiement est validé en temps réel avec nos partenaires. En cas de retard, notre support client intervient sous 24h.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PayBills;
