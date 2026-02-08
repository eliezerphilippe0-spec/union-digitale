import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, TrendingUp, Users, Shield, BarChart3, CreditCard, Package, Zap, CheckCircle, ArrowRight, Star } from 'lucide-react';
import SEO from '../components/common/SEO';
import Button from '../components/ui/Button';
import UniversalAccess from '../components/common/UniversalAccess';

const SellerLanding = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: <Store className="w-8 h-8" />,
            title: 'Accès Universel au Marché',
            description: 'Une seule boutique, accessible sur Android, iPhone et ordinateur',
            highlight: '📱💻🍎'
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: 'Commissions Compétitives',
            description: 'Seulement 5-15% de commission sur vos ventes',
            highlight: '5-15%'
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: 'Millions d\'Acheteurs',
            description: 'Accédez à notre base de 50,000+ acheteurs actifs',
            highlight: '50K+'
        },
        {
            icon: <Package className="w-8 h-8" />,
            title: 'Outils Gratuits',
            description: 'Dashboard professionnel, analytics, et gestion de stock',
            highlight: 'Gratuit'
        },
        {
            icon: <CreditCard className="w-8 h-8" />,
            title: 'Paiements Sécurisés',
            description: 'MonCash, Natcash, et virements bancaires',
            highlight: 'Sécurisé'
        }
    ];

    const steps = [
        {
            number: '1',
            title: 'Créez votre boutique',
            description: 'Une seule fois, en 5 minutes. Accessible automatiquement partout.',
            time: '5 min'
        },
        {
            number: '2',
            title: 'Touchez tous les clients',
            description: 'Android, iPhone, ordinateur - vos clients vous trouvent partout',
            time: 'Automatique'
        },
        {
            number: '3',
            title: 'Gérez depuis partout',
            description: 'Dashboard unique pour gérer 100% de vos ventes',
            time: '24/7'
        }
    ];

    const testimonials = [
        {
            name: 'Marie Jeanne',
            shop: 'Boutique Marie',
            avatar: '👩',
            rating: 5,
            comment: 'J\'ai vendu 50,000 HTG en seulement 1 mois ! La plateforme est simple et les paiements sont rapides.',
            sales: '50K HTG'
        },
        {
            name: 'Jean Baptiste',
            shop: 'Tech Haiti',
            avatar: '👨',
            rating: 5,
            comment: 'Interface professionnelle et support client réactif. Je recommande à tous les vendeurs !',
            sales: '120K HTG'
        },
        {
            name: 'Claudette Pierre',
            shop: 'Mode Caraïbes',
            avatar: '👩',
            rating: 5,
            comment: 'Mes ventes ont triplé depuis que j\'ai rejoint Union Digitale. Merci !',
            sales: '85K HTG'
        }
    ];

    const faqs = [
        {
            question: 'Quels sont les frais ?',
            answer: 'Commission de 5-15% selon la catégorie. Pas de frais d\'inscription ni d\'abonnement mensuel.'
        },
        {
            question: 'Comment recevoir mes paiements ?',
            answer: 'Paiements automatiques via MonCash, Natcash ou virement bancaire tous les vendredis.'
        },
        {
            question: 'Puis-je vendre à l\'international ?',
            answer: 'Oui ! Vous pouvez vendre partout en Haïti et à l\'international avec notre système de livraison.'
        },
        {
            question: 'Combien de temps pour l\'approbation ?',
            answer: 'Votre compte est vérifié en 24-48h après soumission des documents KYC.'
        }
    ];

    return (
        <>
            <SEO
                title="Devenez Vendeur - Union Digitale"
                description="Vendez vos produits à des millions d'acheteurs. Commissions compétitives, outils gratuits, paiements sécurisés."
            />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-accent-900 via-accent-800 to-primary-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-yellow-400 text-accent-900 px-4 py-2 rounded-full text-sm font-bold mb-6">
                                🎉 OFFRE DE LANCEMENT : 0% de commission le 1er mois !
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                Vendez Partout. Gérez Depuis Un Seul Endroit.
                            </h1>
                            <p className="text-2xl text-accent-100 mb-4">
                                Une seule boutique → Tous les clients
                            </p>
                            <div className="flex items-center gap-3 mb-8 flex-wrap justify-center md:justify-start">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                    <span className="text-xl">📱</span>
                                    <span className="text-sm text-white font-medium">Android</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                    <span className="text-xl">🍎</span>
                                    <span className="text-sm text-white font-medium">iPhone</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                    <span className="text-xl">💻</span>
                                    <span className="text-sm text-white font-medium">Ordinateur</span>
                                </div>
                            </div>
                            <p className="text-lg text-accent-200 mb-8">
                                Créez votre boutique une fois. Vos clients vous trouvent automatiquement sur tous les appareils. Vous gérez tout depuis un seul dashboard.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => navigate('/register/seller')}
                                    className="bg-yellow-400 text-accent-900 hover:bg-yellow-300 font-bold text-lg px-8 py-4"
                                >
                                    Commencer à Vendre
                                    <ArrowRight className="w-6 h-6 ml-2" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={() => navigate('/login')}
                                    className="bg-white/10 text-white hover:bg-white/20 border-2 border-white/30"
                                >
                                    Je suis déjà vendeur
                                </Button>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-yellow-400">5,000+</div>
                                        <div className="text-accent-200 text-sm mt-1">Vendeurs Actifs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-yellow-400">50K+</div>
                                        <div className="text-accent-200 text-sm mt-1">Acheteurs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-yellow-400">10K+</div>
                                        <div className="text-accent-200 text-sm mt-1">Produits</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-yellow-400">4.8/5</div>
                                        <div className="text-accent-200 text-sm mt-1">Satisfaction</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                            Pourquoi vendre sur Union Digitale ?
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Tout ce dont vous avez besoin pour réussir en ligne
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 hover:shadow-xl transition-shadow">
                                <div className="text-primary-600 mb-4">{benefit.icon}</div>
                                <div className="text-3xl font-bold text-accent-600 mb-2">{benefit.highlight}</div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">{benefit.title}</h3>
                                <p className="text-neutral-600">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Universal Access Section */}
            <UniversalAccess />

            {/* How It Works */}
            <div className="py-20 bg-neutral-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                            Comment ça marche ?
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Commencez à vendre en 3 étapes simples
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                            {step.number}
                                        </div>
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            {step.time}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
                                    <p className="text-neutral-600">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="w-8 h-8 text-primary-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/register/seller')}
                            className="text-lg px-8 py-4"
                        >
                            Créer ma Boutique Maintenant
                            <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                            Ce que disent nos vendeurs
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Rejoignez des milliers de vendeurs satisfaits
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-3xl">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-neutral-900">{testimonial.name}</div>
                                        <div className="text-sm text-neutral-600">{testimonial.shop}</div>
                                        <div className="flex gap-1 mt-1">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-neutral-700 mb-4 italic">"{testimonial.comment}"</p>
                                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-center font-bold">
                                    💰 {testimonial.sales} de ventes
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <div className="py-20 bg-neutral-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                            Questions Fréquentes
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-neutral-900 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    {faq.question}
                                </h3>
                                <p className="text-neutral-600 ml-7">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="bg-gradient-to-r from-primary-900 to-accent-900 text-white py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Prêt à développer votre business ?
                    </h2>
                    <p className="text-xl text-primary-100 mb-8">
                        Rejoignez Union Digitale aujourd'hui et commencez à vendre en quelques minutes
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/register/seller')}
                        className="bg-yellow-400 text-accent-900 hover:bg-yellow-300 font-bold text-xl px-12 py-5"
                    >
                        Créer ma Boutique Gratuitement
                        <Zap className="w-6 h-6 ml-2" />
                    </Button>
                    <p className="text-sm text-primary-200 mt-4">
                        ✓ Inscription gratuite  ✓ Aucun engagement  ✓ Support 24/7
                    </p>
                </div>
            </div>
        </>
    );
};

export default SellerLanding;
