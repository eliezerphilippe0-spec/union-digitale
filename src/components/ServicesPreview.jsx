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
        <section className="py-12 bg-white border-y border-gray-100">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                        <span className="text-primary-800 text-xs font-bold uppercase tracking-wide">
                            Super-App Haïtienne
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        Tous vos services au même endroit
                    </h2>

                    <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
                        Paiements, voyages, shopping et plus encore - gérez tout depuis une seule application
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8">
                    {previewServices.map((service, index) => {
                        const category = serviceCategories.find(c => c.id === service.category);
                        return (
                            <ServiceCard key={service.id} service={service} category={category} size="default" />
                        );
                    })}
                </div>

                {/* CTA Button */}
                <div className="text-center">
                    <button
                        onClick={() => navigate('/services')}
                        className="
                            inline-flex items-center justify-center gap-2
                            w-full sm:w-auto
                            px-8 py-3.5
                            bg-primary-600 text-white
                            hover:bg-primary-700
                            font-bold text-sm sm:text-base
                            rounded-xl
                            transition-colors
                            border border-primary-700
                        "
                    >
                        Explorer d'autres services
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ServicesPreview;
