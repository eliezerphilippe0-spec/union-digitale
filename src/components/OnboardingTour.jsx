import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Sparkles, ShoppingBag, Wallet, Info } from 'lucide-react';

const TOUR_STEPS = [
    {
        id: 'welcome',
        title: "Bienvenue sur Zabely !",
        content: "La première Super-App d'Haïti qui regroupe E-commerce, Services, Éducation et Finance.",
        icon: <Sparkles className="w-8 h-8 text-gold-500" />
    },
    {
        id: 'search',
        title: "Recherche Intelligente",
        content: "Trouvez n'importe quel produit, service ou formation en un clin d'œil grâce à notre moteur de recherche rapide.",
        target: 'search-bar', // Will match an ID
        icon: <ShoppingBag className="w-8 h-8 text-blue-500" />
    },
    {
        id: 'wallet',
        title: "Votre Portefeuille",
        content: "Gérez votre solde, envoyez de l'argent gratuitement à vos proches et payez vos commandes en toute sécurité.",
        target: 'wallet-nav',
        icon: <Wallet className="w-8 h-8 text-green-500" />
    },
    {
        id: 'finish',
        title: "Prêt à explorer ?",
        content: "Profitez de la meilleure expérience digitale en Haïti. Notre support est là si vous avez besoin d'aide.",
        icon: <Info className="w-8 h-8 text-indigo-500" />
    }
];

const OnboardingTour = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('zabely_onboarding_seen');
        if (!hasSeenTour) {
            // Delay slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('zabely_onboarding_seen', 'true');
    };

    if (!isVisible) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleComplete}
            />

            {/* Content Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                key={currentStep}
                className="relative bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20"
            >
                <div className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer" onClick={handleComplete}>
                    <X size={20} />
                </div>

                <div className="p-8">
                    <div className="bg-gray-50 dark:bg-neutral-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                        {step.icon}
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{step.title}</h2>
                    <p className="text-gray-600 dark:text-neutral-300 leading-relaxed mb-8">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        {/* Progress Dots */}
                        <div className="flex gap-1.5">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            {currentStep < TOUR_STEPS.length - 1 && (
                                <button
                                    onClick={handleComplete}
                                    className="text-gray-400 hover:text-gray-600 font-medium px-4 py-2"
                                >
                                    Passer
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingTour;
