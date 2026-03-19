import React, { useState, useEffect } from 'react';
import SEO from '../../components/common/SEO';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Shield, Clock, CheckCircle, User, Phone, DollarSign, Zap, Info, Plus, ChevronRight, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logTransaction, TRANSACTION_TYPES } from '../../utils/transactionLogger';
import { useLanguage } from '../../contexts/LanguageContext';

const TransfertArgent = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        beneficiaire: '',
        telephone: '',
        montant: '',
        methode: 'moncash'
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');
    const [recents, setRecents] = useState([]);

    // Professional Fee Calculation (Simulated Wise/Remitly logic)
    const commissionRate = 0.015; // 1.5% professional fee
    const minFee = 50; // Minimum fee in HTG
    const calculatedFee = Math.max(minFee, (parseFloat(formData.montant) || 0) * commissionRate);
    const totalToPay = (parseFloat(formData.montant) || 0) + calculatedFee;

    useEffect(() => {
        const savedRecents = localStorage.getItem('transfer_recents');
        if (savedRecents) setRecents(JSON.parse(savedRecents).slice(0, 3));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            if (currentUser) {
                await logTransaction({
                    userId: currentUser.uid,
                    type: TRANSACTION_TYPES.TRANSFER,
                    amount: formData.montant,
                    recipient: formData.beneficiaire,
                    phoneNumber: formData.telephone,
                    metadata: {
                        service: 'Money Transfer Pro',
                        fee: calculatedFee,
                        paymentMethod: formData.methode,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Save to recents
            const newRecent = { name: formData.beneficiaire, phone: formData.telephone };
            const updatedRecents = [newRecent, ...recents.filter(r => r.phone !== newRecent.phone)].slice(0, 3);
            localStorage.setItem('transfer_recents', JSON.stringify(updatedRecents));

            // Simulate bank-grade processing delay
            setTimeout(() => {
                setIsProcessing(false);
                setShowSuccess(true);
                setTransactionRef(`ZB-TX-${Math.random().toString(36).toUpperCase().substring(2, 10)}`);
            }, 2500);
        } catch (error) {
            console.error('Transaction error:', error);
            setIsProcessing(false);
            alert('Erreur lors de la transaction. Veuillez réessayer.');
        }
    };

    const selectRecent = (person) => {
        setFormData({ ...formData, beneficiaire: person.name, telephone: person.phone });
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center border border-gray-100">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-[#0A1D37] mb-2 uppercase tracking-tight">Transfert Envoyé !</h2>
                    <p className="text-gray-400 text-sm mb-8 font-medium">Votre argent est en route vers {formData.beneficiaire}</p>

                    <div className="bg-gray-50 rounded-3xl p-6 mb-8 text-left space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Montant Envoyé</span>
                            <span className="text-[#0A1D37] font-black">{formData.montant} HTG</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Référence</span>
                            <span className="text-blue-600 font-black">{transactionRef}</span>
                        </div>
                    </div>

                    {/* Status Tracker */}
                    <div className="flex justify-between mb-10 relative px-4">
                        <div className="absolute top-4 left-10 right-10 h-0.5 bg-gray-100 -z-10"></div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-100">1</div>
                            <span className="text-[10px] font-black text-[#0A1D37] uppercase">Initié</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-100 animate-pulse">2</div>
                            <span className="text-[10px] font-black text-blue-600 uppercase">Traitement</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 opacity-30">
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-black">3</div>
                            <span className="text-[10px] font-black text-gray-400 uppercase">Reçu</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button className="bg-[#0A1D37] text-white w-full py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2">
                            <Download size={18} /> Télécharger le Reçu
                        </button>
                        <button onClick={() => navigate('/services')} className="text-gray-400 font-black text-xs uppercase tracking-widest py-3 hover:text-blue-600 transition-colors">
                            Retour aux Services
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO title="Transfert d'argent" description="Envoyez de l'argent rapidement en Haïti avec Zabely Pay." />
            {/* Header Sticky */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/services')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-black text-[#0A1D37] uppercase tracking-tighter">Zabely Pay</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-6 pt-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 animate-bounce">
                        <Zap size={32} className="text-white fill-current" />
                    </div>
                    <div className="service-header-content">
                        <h2 className="text-2xl font-black text-[#0A1D37]">Envoyer de l'argent</h2>
                        <div className="service-provider">
                            <span className="text-sm text-gray-400 font-medium">Fournisseur : Zabely</span>
                            <span className="verified-badge text-green-500 font-bold ml-2">✓ Vérifié</span>
                        </div>
                    </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Recipient Selection */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Destinataire</label>
                            {recents.length > 0 && <span className="text-[10px] font-black text-blue-600 uppercase">Récents</span>}
                        </div>

                        {recents.length > 0 && (
                            <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                                {recents.map((person, i) => (
                                    <button key={i} type="button" onClick={() => selectRecent(person)} className="flex flex-col items-center gap-2 min-w-[80px] group">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-transparent group-hover:border-blue-100">
                                            <User size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 truncate w-full text-center">{person.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                                <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                    <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-gray-300">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300 uppercase">Nouveau</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type="text"
                                    name="beneficiaire"
                                    value={formData.beneficiaire}
                                    onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
                                    placeholder="Nom complet"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold text-[#0A1D37] placeholder:text-gray-300 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    placeholder="Numéro (Ex: 3712-3456)"
                                    pattern="[0-9]{4}-[0-9]{4}"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold text-[#0A1D37] placeholder:text-gray-300 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amount & Method */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-6">Montant & Méthode</label>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-black">G</div>
                                <input
                                    type="number"
                                    name="montant"
                                    value={formData.montant}
                                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                                    placeholder="0.00"
                                    min="50"
                                    required
                                    className="w-full pl-10 pr-4 py-6 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-blue-600 font-black text-4xl text-[#0A1D37] placeholder:text-gray-200 transition-all"
                                />
                            </div>
                            <div className="w-24 px-4 py-6 bg-blue-50 rounded-3xl flex flex-col items-center justify-center border border-blue-100">
                                <span className="text-[10px] font-black text-blue-600 uppercase">HTG</span>
                                <span className="text-[10px] font-bold text-blue-300">Haïti</span>
                            </div>
                        </div>

                        {/* Fee Calculator Display */}
                        {formData.montant && (
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-8">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-bold">Frais de service (1.5%)</span>
                                    <span className="text-[#0A1D37] font-black">{calculatedFee.toFixed(2)} HTG</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-[#0A1D37] font-black uppercase tracking-widest text-[10px]">Total à payer</span>
                                    <span className="text-blue-600 font-black">{totalToPay.toLocaleString()} HTG</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, methode: 'moncash' })}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase ${formData.methode === 'moncash' ? 'border-[#0A1D37] bg-[#0A1D37] text-white shadow-xl' : 'border-gray-100 text-gray-400'}`}
                            >
                                <img src="https://moncash.com/wp-content/themes/moncash/assets/images/logo.png" className="h-4 brightness-0 invert" alt="MonCash" style={{ display: formData.methode === 'moncash' ? 'block' : 'none' }} />
                                MonCash
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, methode: 'natcash' })}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase ${formData.methode === 'natcash' ? 'border-[#0A1D37] bg-[#0A1D37] text-white shadow-xl' : 'border-gray-100 text-gray-400'}`}
                            >
                                NatCash
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing || !formData.montant || !formData.beneficiaire || !formData.telephone}
                        className="w-full bg-[#0A1D37] text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-100 hover:bg-blue-900 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Send size={24} />
                                Transférer Maintenant
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
                    <Shield size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Transactions cryptées de bout en bout</span>
                </div>
            </main>
        </div>
    );
};

export default TransfertArgent;
