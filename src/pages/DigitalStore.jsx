import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Sparkles, Zap, ShieldCheck, Headphones, Smartphone, Gamepad2, Gift, Book } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

import { useProducts } from '../hooks/useProducts';

const DigitalStore = () => {
    const { t } = useLanguage();
    const { products: allProducts, loading } = useProducts();
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!loading) {
            // Filter products by digital type
            const digitalProducts = allProducts.filter(p => p.type === 'digital' || p.isDigital === true);

            // Apply category filter
            if (filter === 'all') {
                setProducts(digitalProducts);
            } else {
                setProducts(digitalProducts.filter(p =>
                    p.category?.toLowerCase() === filter.toLowerCase() ||
                    p.subcategory?.toLowerCase() === filter.toLowerCase()
                ));
            }
        }
    }, [allProducts, loading, filter]);

    const categories = [
        { id: 'all', label: 'Tout', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'recharge', label: 'Recharges', icon: <Smartphone className="w-4 h-4" /> },
        { id: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'gift_cards', label: 'Cadeaux', icon: <Gift className="w-4 h-4" /> },
        { id: 'software', label: 'Logiciels', icon: <Zap className="w-4 h-4" /> },
        { id: 'education', label: 'Éducation', icon: <Book className="w-4 h-4" /> }
    ];

    return (
        <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen transition-colors duration-300">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#0A1D37] to-indigo-900 dark:from-neutral-950 dark:to-indigo-950 text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full -ml-32 -mb-32" />

                <div className="container mx-auto max-w-6xl relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-white/10">
                        <Zap className="w-4 h-4 text-gold-400" /> Zabely Digital Store
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        Vos produits digitaux,<br />
                        <span className="text-secondary text-gold-400">livrés instantanément.</span>
                    </h1>
                    <p className="text-lg opacity-80 max-w-2xl mx-auto mb-10">
                        Recharges, cartes cadeaux, logiciels et clés de gaming. Payez en Gourdes (MonCash/NatCash) et recevez votre code immédiatement dans votre librairie.
                    </p>

                    <div className="flex flex-wrap justify-center gap-8 opacity-60">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-bold">Paiement Sécurisé</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-sm font-bold">Livraison Flash</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Headphones className="w-5 h-5" />
                            <span className="text-sm font-bold">Support 24/7</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="container mx-auto max-w-6xl px-4 -mt-8 relative z-20">
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-3xl shadow-xl flex flex-wrap gap-2 justify-center border border-neutral-100 dark:border-neutral-700">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filter === cat.id
                                ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-105'
                                : 'bg-neutral-50 dark:bg-neutral-700/50 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                }`}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="container mx-auto max-w-6xl px-4 py-20">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white dark:bg-neutral-800 rounded-3xl h-64 animate-pulse border border-neutral-100 dark:border-neutral-700" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-[40px] border border-dashed border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="bg-neutral-50 dark:bg-neutral-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Gamepad2 className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">Bientôt Disponible</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto font-medium">
                            Nos premiers produits digitaux arrivent ! Nos vendeurs préparent leurs catalogues de clés et vouchers.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>

            {/* Benefit Section */}
            <div className="container mx-auto max-w-6xl px-4 pb-20">
                <div className="bg-[#0A1D37] dark:bg-neutral-800 rounded-[40px] p-10 md:p-20 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-neutral-900/10">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black leading-tight">
                            Pourquoi acheter digital sur <span className="text-secondary text-gold-400">Zabely</span> ?
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="bg-secondary p-2 rounded-xl mt-1 shadow-lg shadow-secondary/20"><Zap size={20} /></div>
                                <div>
                                    <p className="font-bold text-xl">Disponible en Gourdes</p>
                                    <p className="opacity-70">Plus besoin de carte de crédit internationale ou de dollars.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="bg-secondary p-2 rounded-xl mt-1 shadow-lg shadow-secondary/20"><ShieldCheck size={20} /></div>
                                <div>
                                    <p className="font-bold text-xl">Vendeurs Vérifiés</p>
                                    <p className="opacity-70">Des codes 100% valides provenant de nos meilleurs partenaires.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2 p-10 bg-white/5 rounded-[40px] backdrop-blur-sm border border-white/10 relative overflow-hidden">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-green-500/20">MC</div>
                                <div>
                                    <p className="font-bold">MonCash Approuvé</p>
                                    <p className="text-xs opacity-60">Validation instantanée du paiement.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/10 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">NC</div>
                                <div>
                                    <p className="font-bold">NatCash Approuvé</p>
                                    <p className="text-xs opacity-60">Recharge immédiate.</p>
                                </div>
                            </div>
                        </div>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-full animate-shimmer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalStore;
