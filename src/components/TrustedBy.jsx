import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TrustedBy = () => {
    const { t } = useLanguage();

    const partners = [
        { name: 'MonCash', verified: true },
        { name: 'Stripe', verified: true },
        { name: 'PayPal', verified: true },
        { name: 'DHL', verified: true },
        { name: 'FedEx', verified: true },
        { name: 'Natcash', verified: true }
    ];

    const stats = [
        { value: '10,000+', label: t('products') || 'Produits' },
        { value: '500+', label: t('sellers') || 'Vendeurs' },
        { value: '25+', label: t('countries') || 'Pays' },
        { value: '4.9/5', label: t('rating') || 'Note' }
    ];

    return (
        <section className="py-12 bg-white dark:bg-neutral-800 border-y border-gray-100 dark:border-neutral-700">
            <div className="container mx-auto px-4">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl sm:text-4xl font-bold text-primary-900 dark:text-white mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trusted By */}
                <div className="text-center mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
                        {t('trusted_by') || 'Ils nous font confiance'}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                        {partners.map((partner, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700/50 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                    {partner.name}
                                </span>
                                {partner.verified && (
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
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
