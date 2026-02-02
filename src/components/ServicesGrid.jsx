import React from 'react';
import ServiceCard from './ServiceCard';
import { serviceCategories, getServicesByCategory } from '../data/services-data';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ServicesGrid Component - Bento Grid Layout
 * Features:
 * - Asymmetric grid layout
 * - Category-based organization
 * - Responsive design
 * - Stagger animations
 */
const ServicesGrid = ({ limit, categoryFilter }) => {
    const { t } = useLanguage();

    // Filter categories if specified
    const categories = categoryFilter
        ? serviceCategories.filter(c => c.id === categoryFilter)
        : serviceCategories;

    return (
        <div className="space-y-12">
            {categories.map((category, catIndex) => {
                const categoryServices = getServicesByCategory(category.id);
                const displayServices = limit
                    ? categoryServices.slice(0, limit)
                    : categoryServices;

                if (displayServices.length === 0) return null;

                return (
                    <div key={category.id} className="scroll-fade-in" style={{ animationDelay: `${catIndex * 100}ms` }}>
                        {/* Category Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`
                                p-3 rounded-xl
                                bg-gradient-to-br ${category.gradient}
                                shadow-luxury-sm
                            `}>
                                <category.icon className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-primary-900 dark:text-white">
                                    {category.name}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {category.description}
                                </p>
                            </div>
                        </div>

                        {/* Services Grid - Bento Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayServices.map((service, index) => (
                                <div
                                    key={service.id}
                                    className={`
                                        ${service.featured && index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
                                    `}
                                    style={{ animationDelay: `${(catIndex * 100) + (index * 50)}ms` }}
                                >
                                    <ServiceCard
                                        service={service}
                                        category={category}
                                        size={service.featured && index === 0 ? 'large' : 'default'}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ServicesGrid;
