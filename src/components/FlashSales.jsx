import { useState, useEffect } from 'react';
import { Zap, Clock, ShoppingBag, TrendingDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ───────────────────────────────────────────────
   Countdown timer hook — resets every 24 hours
 ─────────────────────────────────────────────── */
const useCountdown = () => {
    const getSecondsUntilMidnight = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return Math.floor((midnight - now) / 1000);
    };

    const [seconds, setSeconds] = useState(getSecondsUntilMidnight);

    useEffect(() => {
        const id = setInterval(() => {
            setSeconds((s) => (s <= 1 ? getSecondsUntilMidnight() : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return { h, m, s, seconds };
};

const CountdownDigit = ({ value }) => (
    <div className="relative h-7 w-5 bg-red-500/10 rounded overflow-hidden flex items-center justify-center font-mono font-black text-lg text-red-600 border border-red-500/20">
        <AnimatePresence mode="popLayout">
            <motion.span
                key={value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                {value}
            </motion.span>
        </AnimatePresence>
    </div>
);

/* ───────────────────────────────────────────────
   Main Component
 ─────────────────────────────────────────────── */
const FlashSales = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { h, m, s } = useCountdown();

    const deals = [
        {
            id: 1,
            emoji: '❄️',
            title: t('flash_fridge') || 'Réfrigérateur Inverter',
            subtitle: t('flash_fridge_sub') || 'Idéal pour la famille en Haïti',
            discount: '-40%',
            oldPrice: '850',
            newPrice: '510',
            stock: 12,
            color: '#3b82f6',
            badge: '🎁 Diaspora Choice',
            category: 'home_kitchen',
        },
        {
            id: 2,
            emoji: '🔋',
            title: t('flash_generator') || 'Générateur Solaire',
            subtitle: t('flash_generator_sub') || 'Énergie fiable 24/7',
            discount: '-30%',
            oldPrice: '1200',
            newPrice: '840',
            stock: 28,
            color: '#f59e0b',
            badge: '🔥 Meilleure Vente',
            category: 'energy',
        },
        {
            id: 3,
            emoji: '📺',
            title: t('flash_tv') || 'Smart TV 55"',
            subtitle: t('flash_tv_sub') || '4K Ultra HD Premium',
            discount: '-50%',
            oldPrice: '700',
            newPrice: '350',
            stock: 15,
            color: '#6366f1',
            badge: '⚡ Flash Diaspora',
            category: 'electronics',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    };

    return (
        <section className="py-16 bg-white dark:bg-[#0a0f1c] border-y border-gray-100 dark:border-white/5">
            <div className="container mx-auto px-4">

                {/* ── Header ── */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6"
                >
                    <div className="flex items-center gap-5">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 20px rgba(239, 68, 68, 0.4)", "0 0 0px rgba(239, 68, 68, 0)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/20"
                        >
                            <Zap className="w-7 h-7 text-white" />
                        </motion.div>
                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase mb-1">
                                🔥 {t('daily_deals') || 'Deals du jour'}
                            </h2>
                            <div className="flex items-center gap-2 text-sm font-bold text-red-500">
                                <Clock size={16} className="animate-pulse" />
                                <span>{t('flash_expires_in') || 'Expire dans :'}</span>
                                <div className="flex gap-1 ml-1 items-center">
                                    <CountdownDigit value={h[0]} />
                                    <CountdownDigit value={h[1]} />
                                    <span className="text-red-500">:</span>
                                    <CountdownDigit value={m[0]} />
                                    <CountdownDigit value={m[1]} />
                                    <span className="text-red-500">:</span>
                                    <CountdownDigit value={s[0]} />
                                    <CountdownDigit value={s[1]} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/deals')}
                        className="hidden md:flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white/5 hover:bg-black dark:hover:bg-white/10 rounded-2xl text-sm font-black text-white transition-all shadow-xl shadow-gray-200 dark:shadow-none"
                    >
                        {t('view_all_deals') || 'Toutes les promos'} <ArrowRight size={18} className="text-red-500" />
                    </motion.button>
                </motion.div>

                {/* ── Deal Cards ── */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {deals.map((deal) => (
                        <motion.button
                            key={deal.id}
                            variants={cardVariants}
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            onClick={() => navigate(`/category/${deal.category}`)}
                            className="group relative bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/10 p-8 text-left hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 overflow-hidden cursor-pointer"
                        >
                            {/* Decorative Background Blob */}
                            <div 
                                className="absolute -top-24 -right-24 w-64 h-64 blur-[80px] opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-700 pointer-events-none"
                                style={{ backgroundColor: deal.color }}
                            />

                            {/* Badge Row */}
                            <div className="flex items-center justify-between mb-8">
                                <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/30">
                                    {deal.badge}
                                </span>
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                    <TrendingDown size={18} className="text-red-500" />
                                </div>
                            </div>

                            {/* Emoji Container */}
                            <div className="flex items-center justify-center py-6 mb-6 relative">
                                <motion.span 
                                    whileHover={{ rotate: [-5, 5, -5] }}
                                    className="text-8xl group-hover:scale-110 transition-transform duration-500 relative z-10 filter drop-shadow-2xl"
                                >
                                    {deal.emoji}
                                </motion.span>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 dark:to-white/5 rounded-full" />
                            </div>

                            {/* Info */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md">Urgent</span>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{deal.discount} DE RÉDUCTION</span>
                                </div>
                                <h3 className="font-black text-gray-900 dark:text-white text-2xl mb-2 leading-tight group-hover:text-red-500 transition-colors">{deal.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6 line-clamp-1">{deal.subtitle}</p>

                                {/* Price block */}
                                <div className="flex items-end gap-3 mb-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Offre Limitée</span>
                                        <span className="text-3xl font-black text-gray-900 dark:text-white">{deal.newPrice} $</span>
                                    </div>
                                    <div className="mb-1">
                                        <span className="text-sm font-bold text-gray-300 dark:text-gray-600 line-through">{deal.oldPrice} $</span>
                                    </div>
                                </div>

                                {/* Stock progress bar */}
                                <div className="mb-8">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                        <span className={deal.stock < 15 ? 'text-red-500' : 'text-gray-400'}>
                                            {deal.stock < 15 ? '🛒 Presque épuisé !' : '📦 Stock disponible'}
                                        </span>
                                        <span className={deal.stock < 15 ? 'text-red-600 animate-pulse' : 'text-gray-800 dark:text-gray-200'}>
                                            {deal.stock} restants
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${deal.stock}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: `linear-gradient(to right, ${deal.stock < 15 ? '#ef4444, #b91c1c' : `${deal.color}, ${deal.color}cc`})`,
                                                boxShadow: deal.stock < 15 ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <div className="flex items-center justify-between group/btn gap-3">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 truncate">Livraison Incluse</span>
                                        <span className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white group-hover/btn:translate-x-1 transition-transform truncate">{t('shop_now') || 'Profiter maintenant'}</span>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-xl group-hover/btn:scale-110 group-hover/btn:bg-red-600 group-hover/btn:text-white transition-all duration-300">
                                        <ShoppingBag size={18} />
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
                
                {/* Mobile view all link */}
                <div className="md:hidden text-center mt-10">
                    <button
                        onClick={() => navigate('/deals')}
                        className="inline-flex items-center gap-2 text-sm font-black text-red-500 border-b-2 border-red-500 pb-1"
                    >
                        {t('view_all_deals') || 'Toutes les promos'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
};


export default FlashSales;
