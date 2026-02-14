import React, { useState } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import ServicesGrid from '../components/ServicesGrid';
import { serviceCategories, serviceBundles } from '../data/services-data';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import { ScrollFadeIn } from '../hooks/useScrollAnimation.jsx';

const Services = () => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <SEO title="Services" description="Découvrez des services locaux en Haïti." />
            {/* Hero Section - Compact */}
            <section className="relative min-h-[40vh] bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
                </div>

                <div className="relative container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                        <Sparkles className="w-4 h-4 text-gold-400" />
                        <span className="text-white text-sm font-semibold">
                            Super-App Haïtienne
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                        Tous vos services
                        <br />
                        <span className="text-gold-400">au même endroit</span>
                    </h1>

                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-8">
                        Paiements, voyages, shopping et plus encore - tout ce dont vous avez besoin pour votre quotidien
                    </p>

                    {/* Search Bar */}
                    <div className="w-full max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un service..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gold-500 text-gray-900 dark:text-white shadow-luxury-md"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Filters */}
            <section className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all
                                ${!selectedCategory
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'}
                            `}
                        >
                            <Filter className="w-4 h-4" />
                            Tous
                        </button>
                        {serviceCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all
                                    ${selectedCategory === category.id
                                        ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
                                        : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'}
                                `}
                            >
                                <category.icon className="w-4 h-4" />
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Bundles */}
            {!selectedCategory && (
                <ScrollFadeIn delay={100}>
                    <section className="container mx-auto px-4 py-12">
                        <h2 className="text-3xl font-bold text-primary-900 dark:text-white mb-6">
                            Packs Services
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {serviceBundles.map((bundle, index) => (
                                <div
                                    key={bundle.id}
                                    className={`
                                        luxury-card
                                        p-6 rounded-2xl
                                        bg-gradient-to-br ${bundle.gradient}
                                        shadow-luxury-md hover:shadow-luxury-xl
                                        cursor-pointer
                                        transition-all duration-500
                                    `}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                            <bundle.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold border border-white/30">
                                            -{bundle.discount}%
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-xl mb-2">
                                        {bundle.name}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        {bundle.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </ScrollFadeIn>
            )}

            {/* Services Grid */}
            <section className="container mx-auto px-4 py-12">
                <ServicesGrid categoryFilter={selectedCategory} />
            </section>
        </div>
    );
};

export default Services;
