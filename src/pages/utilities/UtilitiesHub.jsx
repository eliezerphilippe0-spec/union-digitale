import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Phone, Droplet, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UtilitiesHub = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [recentPayments] = useState([
        { id: 1, type: 'EDH', amount: 1500, date: '2026-01-05', status: 'completed' },
        { id: 2, type: 'Natcom', amount: 200, date: '2026-01-03', status: 'completed' },
    ]);

    const services = [
        {
            id: 'electricity',
            name: 'EDH',
            description: 'Payer votre facture d\'électricité',
            icon: Zap,
            color: 'from-yellow-500 to-orange-500',
            route: '/utilities/electricity'
        },
        {
            id: 'mobile',
            name: 'Recharge Mobile',
            description: 'Natcom, Digicel',
            icon: Phone,
            color: 'from-blue-500 to-cyan-500',
            route: '/utilities/mobile'
        }
        // DINEPA coming soon
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        ⚡ Union Utilities
                    </h1>
                    <p className="text-gray-600 dark:text-neutral-300">
                        Payez vos factures et rechargez votre téléphone en quelques clics
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Ce mois</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    3,750 HTG
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Paiements</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {recentPayments.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">Économies</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    +15%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Services Disponibles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map((service) => {
                            const Icon = service.icon;
                            return (
                                <div
                                    key={service.id}
                                    onClick={() => navigate(service.route)}
                                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                                >
                                    <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {service.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-neutral-300 text-sm">
                                        {service.description}
                                    </p>
                                    <button className="mt-4 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                                        Payer maintenant →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Paiements Récents
                    </h2>
                    {recentPayments.length > 0 ? (
                        <div className="space-y-3">
                            {recentPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {payment.type}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-neutral-400">
                                                {payment.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {payment.amount} HTG
                                        </p>
                                        <span className="text-xs text-green-600 dark:text-green-400">
                                            ✓ Complété
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-neutral-400 py-8">
                            Aucun paiement récent
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UtilitiesHub;
