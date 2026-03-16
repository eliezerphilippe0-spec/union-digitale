import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
    ArrowRight, ShoppingBag, CreditCard, Send, 
    FileText, Plane, Truck, Sparkles 
} from 'lucide-react';

const services = [
    {
        icon: ShoppingBag,
        color: 'from-blue-500 to-indigo-600',
        key: 'marketplace',
        label: 'Marketplace',
        desc: 'Shop & Local',
        route: '/catalog',
    },
    {
        icon: CreditCard,
        color: 'from-emerald-400 to-teal-600',
        key: 'payments',
        label: 'Paiements',
        desc: 'Portefeuille',
        route: '/wallet',
    },
    {
        icon: Send,
        color: 'from-orange-400 to-red-500',
        key: 'transfer',
        label: 'Transfert',
        desc: 'Diaspora link',
        route: '/wallet',
    },
    {
        icon: FileText,
        color: 'from-pink-500 to-purple-600',
        key: 'bills',
        label: 'Factures',
        desc: 'Internet & Tel',
        route: '/pay-bills',
    },
    {
        icon: Plane,
        color: 'from-sky-400 to-blue-500',
        key: 'travel',
        label: 'Voyages',
        desc: 'Vols & Séjours',
        route: '/travel',
    },
    {
        icon: Truck,
        color: 'from-amber-400 to-orange-500',
        key: 'delivery',
        label: 'Livraison',
        desc: 'Express Pro',
        route: '/catalog',
    },
];

const ServicesHub = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <section className="py-16 bg-gray-50 dark:bg-[#0d1117] relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between mb-10"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {t('services_hub_title') || 'Centre de Services'}
                            </h2>
                            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 flex items-center gap-2 mt-1">
                                <Sparkles size={14} className="text-gold-500" />
                                {t('superapp_tagline') || 'Une seule application, tous vos besoins.'}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/services')}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 text-indigo-600 dark:text-indigo-400 text-sm font-bold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
                    >
                        {t('view_all') || 'Tout gérer'} <ArrowRight size={16} />
                    </motion.button>
                </motion.div>

                {/* Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                >
                    {services.map((s) => (
                        <motion.button
                            key={s.key}
                            variants={itemVariants}
                            whileHover={{ 
                                scale: 1.03, 
                                y: -5,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(s.route)}
                            className="group flex flex-col items-center text-center p-6 bg-white dark:bg-neutral-800/80 rounded-3xl border border-gray-100 dark:border-neutral-700 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                        >
                            {/* Icon block with gradient */}
                            <motion.div 
                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 transition-transform duration-500 shadow-lg`}
                            >
                                <s.icon className="w-8 h-8 text-white" />
                            </motion.div>

                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-1 leading-none">
                                    {t(`service_${s.key}`) || s.label}
                                </h3>
                                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                    {t(`service_${s.key}_desc`) || s.desc}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default ServicesHub;
