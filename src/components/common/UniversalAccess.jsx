import React from 'react';
import { Smartphone, Monitor, Tablet, Store, ArrowRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * UniversalAccess Component
 * Illustre visuellement le concept "Une boutique → Tous les clients"
 * Montre comment une seule boutique est accessible sur tous les appareils
 */

const UniversalAccess = () => {
    const { t } = useLanguage();

    const devices = [
        {
            icon: Smartphone,
            name: 'Mobile',
            emoji: '📱',
            percentage: '65%',
            description: 'Android & iPhone',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        {
            icon: Monitor,
            name: 'Ordinateur',
            emoji: '💻',
            percentage: '30%',
            description: 'Windows & Mac',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20'
        },
        {
            icon: Tablet,
            name: 'Tablette',
            emoji: '📲',
            percentage: '5%',
            description: 'iPad & Android',
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20'
        }
    ];

    const features = [
        {
            icon: CheckCircle,
            text: 'Une seule boutique à créer'
        },
        {
            icon: CheckCircle,
            text: 'Accessible automatiquement partout'
        },
        {
            icon: CheckCircle,
            text: 'Gérez tout depuis un dashboard'
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-50 dark:bg-gold-900/30 rounded-full mb-4">
                        <Store className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                        <span className="text-sm font-semibold text-gold-600 dark:text-gold-400">
                            {t('universal_access') || 'Accès Universel'}
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                        Une Boutique. <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-amber-500">Tous les Clients.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto">
                        Créez votre boutique une fois. Vos clients vous trouvent automatiquement sur Android, iPhone et ordinateur.
                    </p>
                </div>

                {/* Devices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
                    {devices.map((device, index) => (
                        <div
                            key={device.name}
                            className={`relative bg-white dark:bg-neutral-800 rounded-2xl p-8 border ${device.borderColor} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Percentage Badge */}
                            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-xs font-bold">
                                {device.percentage}
                            </div>

                            {/* Icon */}
                            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${device.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-5xl">{device.emoji}</span>
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">
                                {device.name}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-4">
                                {device.description}
                            </p>

                            {/* Stats */}
                            <div className="text-center">
                                <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                    {device.percentage} des achats
                                </p>
                            </div>

                            {/* Hover effect */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${device.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        </div>
                    ))}
                </div>

                {/* Central Message */}
                <div className="bg-gradient-to-r from-primary-900 via-accent-900 to-primary-900 rounded-3xl p-8 md:p-12 text-white text-center mb-12 relative overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="text-6xl mb-6">🎯</div>
                        <h3 className="text-2xl md:text-4xl font-bold mb-4">
                            100% de vos clients gérés depuis un seul dashboard
                        </h3>
                        <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                            Peu importe l'appareil qu'ils utilisent, vous gérez tout depuis un seul endroit. Simple. Efficace. Universel.
                        </p>

                        {/* Features List */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <feature.icon className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => window.location.href = '/register/seller'}
                            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-primary-900 font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                        >
                            Créer ma Boutique Maintenant
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="text-4xl font-bold text-gold-600 dark:text-gold-400 mb-2">1x</div>
                        <p className="text-neutral-600 dark:text-neutral-400">Boutique à créer</p>
                    </div>
                    <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">3+</div>
                        <p className="text-neutral-600 dark:text-neutral-400">Plateformes couvertes</p>
                    </div>
                    <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">100%</div>
                        <p className="text-neutral-600 dark:text-neutral-400">Clients accessibles</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UniversalAccess;
