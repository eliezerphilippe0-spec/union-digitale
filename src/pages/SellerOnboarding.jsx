import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Package, BarChart3, CreditCard, ArrowRight, Zap } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';

const SellerOnboarding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isNewSeller = location.state?.newSeller;

    const steps = [
        {
            icon: <Package className="w-8 h-8" />,
            title: 'Ajoutez vos premiers produits',
            description: 'Téléchargez vos articles avec photos et descriptions détaillées',
            action: 'Ajouter un produit',
            link: '/seller/products/new'
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: 'Explorez votre dashboard',
            description: 'Suivez vos ventes, commandes et analytics en temps réel',
            action: 'Voir le dashboard',
            link: '/seller/dashboard'
        },
        {
            icon: <CreditCard className="w-8 h-8" />,
            title: 'Configurez vos paiements',
            description: 'Ajoutez vos informations bancaires pour recevoir vos revenus',
            action: 'Configurer',
            link: '/seller/dashboard?tab=payments'
        }
    ];

    return (
        <>
            <SEO
                title="Bienvenue Vendeur - Union Digitale"
                description="Commencez à vendre sur Union Digitale"
            />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Success Header */}
                    {isNewSeller && (
                        <div className="bg-green-100 border-2 border-green-500 rounded-2xl p-8 mb-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-green-900 mb-2">
                                🎉 Félicitations !
                            </h1>
                            <p className="text-xl text-green-800 mb-4">
                                Votre compte vendeur a été créé avec succès
                            </p>
                            <p className="text-green-700">
                                Votre compte sera vérifié sous 24-48h. En attendant, vous pouvez commencer à configurer votre boutique.
                            </p>
                        </div>
                    )}

                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                            Bienvenue sur Union Digitale !
                        </h2>
                        <p className="text-xl text-neutral-600">
                            Suivez ces étapes pour lancer votre boutique
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-6 mb-12">
                        {steps.map((step, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center text-white">
                                            {step.icon}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                                                Étape {index + 1}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-neutral-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-neutral-600 mb-4">
                                            {step.description}
                                        </p>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate(step.link)}
                                        >
                                            {step.action}
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-8">
                        <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-500" />
                            Conseils pour réussir
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-700">
                                    <strong>Photos de qualité :</strong> Utilisez des images claires et bien éclairées
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-700">
                                    <strong>Descriptions détaillées :</strong> Plus d'informations = plus de ventes
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-700">
                                    <strong>Prix compétitifs :</strong> Recherchez les prix du marché
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-700">
                                    <strong>Réponse rapide :</strong> Répondez aux questions clients sous 24h
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-neutral-700">
                                    <strong>Livraison rapide :</strong> Expédiez vos commandes rapidement
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/seller/dashboard')}
                            className="text-lg px-8 py-4"
                        >
                            Accéder à mon Dashboard
                            <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                        <p className="text-sm text-neutral-500 mt-4">
                            Besoin d'aide ? <a href="/customer-service" className="text-primary-600 hover:underline">Contactez le support</a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SellerOnboarding;
