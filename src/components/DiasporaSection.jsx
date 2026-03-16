import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
    ArrowRight, Globe, ShoppingBag, 
    CreditCard, Receipt, Plane 
} from 'lucide-react';

const DiasporaSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const actions = [
        { icon: ShoppingBag, label: t('diaspora_buy') || 'Acheter pour la famille',    route: '/catalog',   color: 'from-blue-500 to-indigo-600' },
        { icon: CreditCard,  label: t('diaspora_send') || 'Envoyer de l\'argent',       route: '/wallet',    color: 'from-emerald-500 to-teal-500' },
        { icon: Receipt,     label: t('diaspora_bills') || 'Payer les factures',        route: '/pay-bills', color: 'from-pink-500 to-purple-500' },
        { icon: Plane,       label: t('diaspora_travel') || 'Réserver un voyage',       route: '/travel',    color: 'from-amber-500 to-orange-500' },
    ];

    const flags = [
        { flag: '🇨🇦', country: 'Canada' },
        { flag: '🇺🇸', country: 'USA' },
        { flag: '🇫🇷', country: 'France' },
        { flag: '🇨🇱', country: 'Chili' },
        { flag: '🌍', country: '+ pays' },
    ];

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
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 30 },
        visible: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 80, damping: 12 }
        }
    };

    return (
        <section className="relative overflow-hidden py-24">
            {/* Rich dark background */}
            <div className="absolute inset-0 bg-[#0A0F1C]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1C] via-[#0D1829] to-[#0A0F1C]/90" />

            {/* Decorative glow orbs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" 
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.03, 0.08, 0.03]
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" 
            />

            {/* Network lines pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}></div>

            <div className="relative container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-20 items-center">

                    {/* ── Left: Copy ── */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-xl"
                    >
                        {/* Diaspora badge */}
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-8 shadow-xl"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em]">
                                {t('diaspora_badge') || 'Diaspora Haïtienne'}
                            </span>
                        </motion.div>

                        <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                            {t('diaspora_title') || 'Le Pont Numérique '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                {t('diaspora_title2') || 'Haïti ↔ Diaspora.'}
                            </span>
                        </h2>

                        <p className="text-gray-400 text-lg md:text-xl mb-10 leading-relaxed font-medium">
                            {t('diaspora_desc') || 'Votre partenaire de confiance pour soutenir vos proches. Achetez des produits essentiels, réglez les factures et envoyez des transferts sécurisés instantanément.'}
                        </p>

                        {/* Flags row */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="flex flex-wrap items-center gap-6 mb-12 pb-10 border-b border-white/10"
                        >
                            {flags.map(({ flag, country }) => (
                                <motion.div 
                                    key={country} 
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                    className="flex flex-col items-center gap-2 group cursor-default"
                                >
                                    <span className="text-4xl filter drop-shadow-lg group-hover:scale-120 transition-transform">{flag}</span>
                                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest group-hover:text-white/80 transition-colors">{country}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Main CTA */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/catalog')}
                            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-white text-primary-900 font-extrabold rounded-2xl shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_50px_-10px_rgba(255,255,255,0.3)] transition-all duration-300"
                        >
                            <Globe className="w-5 h-5 text-indigo-600" />
                            <span className="uppercase tracking-widest text-sm">{t('diaspora_cta') || 'Soutenir ma famille'}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </motion.button>
                    </motion.div>

                    {/* ── Right: Action Cards ── */}
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                        {actions.map((action, i) => (
                            <motion.button
                                key={i}
                                variants={cardVariants}
                                whileHover={{ 
                                    y: -10,
                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                    transition: { duration: 0.3 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(action.route)}
                                className="group relative flex flex-col items-start gap-6 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] transition-all duration-500 cursor-pointer text-left shadow-2xl"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                    <action.icon size={30} />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-white font-black text-xl leading-tight block">
                                        {action.label}
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                        Accéder <ArrowRight size={14} />
                                    </div>
                                </div>
                                
                                {/* Background glow for individual card */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-[2.5rem]" />
                            </motion.button>
                        ))}
                    </motion.div>

                </div>

                {/* Bottom tagline */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 pt-12 border-t border-white/5 text-center"
                >
                    <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4">
                        <span className="w-12 h-px bg-white/10 hidden sm:block" />
                        {t('diaspora_tagline') || 'Le pont économique Diaspora ↔ Haïti'}
                        <span className="w-12 h-px bg-white/10 hidden sm:block" />
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default DiasporaSection;
