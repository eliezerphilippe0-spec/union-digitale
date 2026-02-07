/**
 * TrustedBy - Social Proof Section
 * Shows stats, partner logos, and trust badges
 */

import { CheckCircle2, Shield, Award, Users, Package, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import CountUpAnimation from './CountUpAnimation';

const TrustedBy = () => {
    const { t } = useLanguage();

    const stats = [
        { 
            value: 10000, 
            suffix: '+',
            label: 'Produits',
            icon: Package,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        { 
            value: 500, 
            suffix: '+',
            label: 'Vendeurs Vérifiés',
            icon: Users,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        { 
            value: 25000, 
            suffix: '+',
            label: 'Clients Satisfaits',
            icon: Star,
            color: 'text-gold-500',
            bg: 'bg-gold-500/10'
        },
        { 
            value: 4.9, 
            decimals: 1,
            suffix: '/5',
            label: 'Note Moyenne',
            icon: Award,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
    ];

    const paymentPartners = [
        { 
            name: 'MonCash', 
            logo: '💳',
            color: 'bg-red-500/10 border-red-500/20 text-red-600',
            verified: true 
        },
        { 
            name: 'NatCash', 
            logo: '📱',
            color: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
            verified: true 
        },
        { 
            name: 'Visa', 
            logo: '💎',
            color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600',
            verified: true 
        },
        { 
            name: 'Mastercard', 
            logo: '🔶',
            color: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
            verified: true 
        },
    ];

    const shippingPartners = [
        { name: 'DHL Express', verified: true },
        { name: 'FedEx', verified: true },
        { name: 'Livraison Locale', verified: true },
    ];

    const guarantees = [
        { icon: Shield, text: 'Paiement 100% Sécurisé', desc: 'Cryptage SSL 256-bit' },
        { icon: CheckCircle2, text: 'Vendeurs Vérifiés', desc: 'Identité confirmée' },
        { icon: Award, text: 'Satisfait ou Remboursé', desc: 'Garantie 30 jours' },
    ];

    return (
        <section className="py-10 bg-white dark:bg-neutral-800 border-y border-gray-100 dark:border-neutral-700">
            <div className="container mx-auto px-4">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat, i) => (
                        <div 
                            key={i} 
                            className="relative group bg-gray-50 dark:bg-neutral-700/50 rounded-2xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-neutral-600"
                        >
                            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-primary-900 dark:text-white mb-1">
                                <CountUpAnimation 
                                    end={stat.value} 
                                    suffix={stat.suffix} 
                                    decimals={stat.decimals}
                                />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Guarantees Bar */}
                <div className="bg-gradient-to-r from-primary-50 to-gold-50 dark:from-primary-900/20 dark:to-gold-900/20 rounded-2xl p-4 mb-8 border border-primary-100 dark:border-primary-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {guarantees.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white dark:bg-neutral-700 rounded-xl flex items-center justify-center shadow-sm">
                                    <item.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Partners */}
                <div className="text-center mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Moyens de Paiement Acceptés
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {paymentPartners.map((partner, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${partner.color} hover:scale-105 transition-transform cursor-pointer`}
                            >
                                <span className="text-xl">{partner.logo}</span>
                                <span className="font-bold text-sm">{partner.name}</span>
                                {partner.verified && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Partners */}
                <div className="text-center">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Partenaires Livraison
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {shippingPartners.map((partner, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
                            >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {partner.name}
                                </span>
                                {partner.verified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustedBy;
