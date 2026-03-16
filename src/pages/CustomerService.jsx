import React, { useState, useMemo } from 'react';
import MainLayout from '../layouts/MainLayout';
import {
    Truck, RotateCcw, MessageCircle, HelpCircle, Mail, Phone,
    ChevronDown, ChevronUp, Search, ExternalLink, Shield, Store,
    DollarSign, RefreshCw, Send
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FAQ_CATEGORIES, FAQ_DATA } from '../data/faqData';
import SEO from '../components/SEO';

const iconMap = {
    Truck,
    RotateCcw,
    MessageCircle,
    HelpCircle,
    Shield,
    Store,
    DollarSign,
    RefreshCw
};

const CustomerService = () => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('orders');
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (id) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    const filteredFaqs = useMemo(() => {
        return FAQ_DATA.filter(faq => {
            const matchesSearch = faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                faq.a.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = searchTerm ? true : faq.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    const quickActions = [
        { icon: Truck, label: 'Suivre Commande', link: "/orders" },
        { icon: RotateCcw, label: 'Retours', link: "/orders" },
        {
            icon: MessageCircle,
            label: 'Support WhatsApp',
            link: "https://wa.me/50912345678",
            isExternal: true,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        { icon: Mail, label: 'Envoyer Email', link: "mailto:support@uniondigitale.ht" }
    ];

    return (
        <MainLayout>
            <SEO title="Centre d'Aide" description="Besoin d'aide ? Trouvez des réponses à vos questions sur les commandes, les paiements et les services d'Union Digitale." />

            <div className="bg-gray-50 min-h-screen pb-16">
                {/* Hero Section */}
                <div className="bg-[#0A1D37] text-white py-16 px-4">
                    <div className="container mx-auto max-w-4xl text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Comment pouvons-nous vous aider ?</h1>
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Rechercher une réponse (ex: MonCash, Livraison...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 shadow-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none text-lg"
                            />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-10">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {quickActions.map((action, idx) => (
                            <a
                                href={action.link}
                                key={idx}
                                target={action.isExternal ? "_blank" : "_self"}
                                rel={action.isExternal ? "noopener noreferrer" : ""}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center group"
                            >
                                <div className={`w-12 h-12 ${action.bg || 'bg-blue-50'} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`w-6 h-6 ${action.color || 'text-secondary'}`} />
                                </div>
                                <span className="font-bold text-gray-800 text-sm block">{action.label}</span>
                            </a>
                        ))}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Categories */}
                        {!searchTerm && (
                            <div className="lg:w-1/4 space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-3">Catégories</h3>
                                {FAQ_CATEGORIES.map(cat => {
                                    const Icon = iconMap[cat.icon];
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setActiveCategory(cat.id);
                                                setOpenFaq(null);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeCategory === cat.id
                                                    ? 'bg-secondary text-white shadow-lg'
                                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 text-current" />
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* FAQ List */}
                        <div className="flex-1">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {searchTerm ? `Résultats pour "${searchTerm}"` : FAQ_CATEGORIES.find(c => c.id === activeCategory)?.label}
                                    </h2>
                                    <span className="text-xs font-bold bg-blue-50 text-secondary px-2 py-1 rounded-full">
                                        {filteredFaqs.length} Questions
                                    </span>
                                </div>

                                {filteredFaqs.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {filteredFaqs.map((faq) => (
                                            <div key={faq.id} className="group">
                                                <button
                                                    onClick={() => toggleFaq(faq.id)}
                                                    className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-semibold text-gray-800 group-hover:text-secondary transition-colors line-clamp-2">
                                                        {faq.q}
                                                    </span>
                                                    {openFaq === faq.id ? (
                                                        <ChevronUp className="w-5 h-5 text-secondary shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                                                    )}
                                                </button>
                                                {openFaq === faq.id && (
                                                    <div className="px-6 pb-6 text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                            {faq.a}
                                                        </div>
                                                        <div className="mt-4 flex items-center gap-4 text-sm">
                                                            <span className="text-gray-400">Cette réponse vous a-t-elle aidé ?</span>
                                                            <button className="text-green-600 hover:underline font-medium">Oui</button>
                                                            <button className="text-red-500 hover:underline font-medium">Non</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 font-medium">Aucun résultat trouvé pour votre recherche.</p>
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-4 text-secondary font-bold hover:underline"
                                        >
                                            Voir toutes les questions
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Still need help? */}
                            <div className="mt-8 bg-gradient-to-br from-[#0A1D37] to-[#1a3d6e] rounded-3xl p-8 text-white text-center">
                                <h3 className="text-2xl font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
                                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                                    Notre équipe de support est disponible 7j/7 pour vous accompagner dans vos démarches.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="https://wa.me/50912345678" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-green-500/20">
                                        <MessageCircle className="w-5 h-5" /> Chat WhatsApp
                                    </a>
                                    <a href="mailto:support@uniondigitale.ht" className="flex items-center justify-center gap-2 bg-white text-secondary font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all shadow-lg">
                                        <Mail className="w-5 h-5" /> Envoyer un Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CustomerService;
