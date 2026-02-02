import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Send, CreditCard, Shield, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const PayHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [balance] = useState(15750); // From wallet
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        try {
            const q = query(
                collection(db, 'transactions'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const quickActions = [
        { id: 'transfer', name: 'Transférer', icon: Send, color: 'from-blue-500 to-cyan-500', route: '/pay/transfer' },
        { id: 'credit', name: 'Crédit', icon: CreditCard, color: 'from-green-500 to-emerald-500', route: '/pay/credit' }
        // Insurance coming soon
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    💳 Union Pay
                </h1>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8 shadow-2xl">
                    <p className="text-sm opacity-90 mb-2">Solde Disponible</p>
                    <p className="text-5xl font-bold mb-6">{balance.toLocaleString()} HTG</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/pay/transfer')}
                            className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 py-3 rounded-lg font-semibold transition-all"
                        >
                            Envoyer
                        </button>
                        <button
                            onClick={() => navigate('/wallet')}
                            className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 py-3 rounded-lg font-semibold transition-all"
                        >
                            Recharger
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <div
                                key={action.id}
                                onClick={() => navigate(action.route)}
                                className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {action.name}
                                </h3>
                            </div>
                        );
                    })}
                </div>

                {/* Transactions */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Transactions Récentes
                    </h2>
                    {transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'transfer' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                                            }`}>
                                            {tx.type === 'transfer' ? (
                                                <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{tx.type}</p>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {tx.createdAt?.toDate().toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {tx.amount} HTG
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-neutral-400 py-8">
                            Aucune transaction récente
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayHub;
