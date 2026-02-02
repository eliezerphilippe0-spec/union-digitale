import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import ServiceCard from './ServiceCard';
import { featuredServices, serviceCategories } from '../data/services-data';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ServicesPreview Component - Homepage Integration
 * Shows featured services with CTA to full services page
 */
const ServicesPreview = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Get first 6 featured services
    const previewServices = featuredServices.slice(0, 6);

    return (
        <section className="py-16 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 dark:bg-gold-900/20 rounded-full mb-4">
                        <Sparkles className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                        <span className="text-gold-800 dark:text-gold-300 text-sm font-semibold">
                            Super-App Haïtienne
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 dark:text-white mb-4">
                        Tous vos services
                        <br />
                        <span className="text-gold-600 dark:text-gold-400">
                            au même endroit
                        </span>
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                        Paiements, voyages, shopping et plus encore - gérez tout depuis une seule application
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {previewServices.map((service, index) => {
                        const category = serviceCategories.find(c => c.id === service.category);
                        return (
                            <div
                                key={service.id}
                                className="scroll-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <ServiceCard service={service} category={category} size="default" />
                            </div>
                        );
                    })}
                </div>

                {/* CTA Button */}
                <div className="text-center">
                    <button
                        onClick={() => navigate('/services')}
                        className="
                            inline-flex items-center gap-2
                            px-8 py-4
                            bg-gradient-to-r from-primary-600 to-primary-700
                            hover:from-primary-700 hover:to-primary-800
                            text-white
                            font-bold text-lg
                            rounded-xl
                            shadow-luxury-md
                            hover:shadow-luxury-lg
                            transition-all duration-300
                            hover:scale-105
                            btn-press
                        "
                    >
                        Voir tous les services
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ServicesPreview;
