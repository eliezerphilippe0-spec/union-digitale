import React from 'react';
import { UserPlus, FileText, ShoppingCart } from 'lucide-react';

/**
 * How It Works Section
 * Simplified 3-step process inspired by MotoUnion
 */

const HowItWorks = () => {
    const steps = [
        {
            number: 1,
            icon: UserPlus,
            title: 'Créez votre compte',
            description: 'Remplissez le formulaire en ligne avec vos informations.',
            color: 'from-gold-400 to-gold-600',
        },
        {
            number: 2,
            icon: FileText,
            title: 'Parcourez le catalogue',
            description: 'Découvrez des milliers de produits de vendeurs vérifiés.',
            color: 'from-primary-400 to-primary-600',
        },
        {
            number: 3,
            icon: ShoppingCart,
            title: 'Commandez en toute sécurité',
            description: 'Payez avec MonCash ou carte et recevez chez vous.',
            color: 'from-accent-400 to-accent-600',
        },
    ];

    return (
        <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
                        Comment ça marche ?
                    </h2>
                    <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
                        Commencez à acheter en 3 étapes simples
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="relative group animate-fadeIn"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Connector Line (hidden on mobile, shown on md+) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-gold-300 to-primary-300 dark:from-gold-600 dark:to-primary-600 opacity-30" />
                            )}

                            {/* Step Card */}
                            <div className="relative bg-white dark:bg-neutral-800 rounded-2xl p-6 lg:p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
                                {/* Number Badge */}
                                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                                    <span className="text-3xl font-bold text-white">
                                        {step.number}
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className="mb-4 flex-shrink-0">
                                    <step.icon className="w-12 h-12 mx-auto text-gold-500 dark:text-gold-400" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-3 flex-shrink-0">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm lg:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed flex-grow">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-12">
                    <p className="text-lg text-neutral-600 dark:text-neutral-200 mb-4">
                        Prêt à commencer ?
                    </p>
                    <button
                        onClick={() => window.location.href = '/register'}
                        className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-primary-900 font-bold px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        S'inscrire gratuitement
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
