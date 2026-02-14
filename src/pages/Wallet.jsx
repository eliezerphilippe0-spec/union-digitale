import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Send, History, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';

const Wallet = () => {
    const { currentUser } = useAuth();
    const { balance, transactions, deposit, transfer } = useWallet();
    const { t } = useLanguage();

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Form States
    const [amount, setAmount] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDeposit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const redirectUrl = await deposit(amount);

            if (redirectUrl) {
                // Redirect to MonCash
                window.location.href = redirectUrl;
            } else {
                throw new Error(t('redirect_error'));
            }
        } catch (error) {
            console.error(error);
            alert(t('recharge_error'));
            setLoading(false); // Only stop loading on error, otherwise we navigate away
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await transfer(recipientEmail, amount);
            setShowTransferModal(false);
            setAmount('');
            setRecipientEmail('');
            alert(t('transfer_success'));
        } catch (error) {
            console.error(error);
            alert(t('transfer_error') + ' : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <SEO title="Portefeuille" description="Gérez votre solde et vos transactions Union Digitale." />
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <WalletIcon className="text-secondary" /> {t('my_wallet')}
                </h1>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-xl p-8 shadow-lg mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-sm text-gray-300 mb-1">{t('available_balance')}</div>
                        <div className="text-4xl font-bold mb-6">{balance?.toLocaleString() || '0'} G</div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="bg-secondary hover:bg-secondary-hover text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> {t('top_up')}
                            </button>
                            <button
                                onClick={() => setShowTransferModal(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-colors backdrop-blur-sm"
                            >
                                <Send className="w-4 h-4" /> {t('send_money')}
                            </button>
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-secondary/20 rounded-full blur-2xl"></div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" /> {t('transaction_history')}
                    </h2>

                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">{t('no_transactions')}</p>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'transfer_in'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-red-100 text-red-600'
                                            }`}>
                                            {tx.type === 'deposit' && <ArrowDownLeft className="w-5 h-5" />}
                                            {tx.type === 'payment' && <CreditCard className="w-5 h-5" />}
                                            {tx.type === 'transfer_out' && <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {tx.type === 'deposit' ? t('deposit_type') :
                                                    tx.type === 'payment' ? t('payment_type') :
                                                        tx.type === 'transfer_out' ? t('transfer_out_type') : t('transaction_default')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()} • {tx.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${tx.type === 'deposit' || tx.type === 'transfer_in'
                                        ? 'text-green-600'
                                        : 'text-gray-900'
                                        }`}>
                                        {tx.type === 'deposit' || tx.type === 'transfer_in' ? '+' : '-'}
                                        {tx.amount?.toLocaleString() || '0'} G
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('top_up_modal_title')}</h3>
                        <form onSubmit={handleDeposit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount_htg')}</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-secondary"
                                    placeholder="Ex: 1000"
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-hover disabled:opacity-50"
                                >
                                    {loading ? '...' : t('confirm_moncash')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('send_modal_title')}</h3>
                        <form onSubmit={handleTransfer}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipient_email')}</label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-secondary"
                                    placeholder="ami@exemple.com"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount_htg')}</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-secondary"
                                    placeholder="Ex: 500"
                                    required
                                    min="1"
                                    max={balance}
                                />
                                <div className="text-xs text-gray-500 mt-1">{t('available_balance')} : {balance?.toLocaleString() || '0'} G</div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-hover disabled:opacity-50"
                                >
                                    {loading ? '...' : t('confirm_send')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
