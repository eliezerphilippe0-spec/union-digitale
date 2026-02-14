import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/product/ProductCard';
import { Loader, Music, Book, Smartphone, Briefcase, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';

const CategoryLanding = ({ type }) => {
    const { products, loading } = useProducts();
    const { t } = useLanguage();

    const config = useMemo(() => {
        switch (type) {
            case 'music':
                return {
                    title: "Union Music",
                    icon: Music,
                    color: "text-pink-600",
                    bgColor: "bg-pink-50",
                    filter: p => p.category === 'music' || p.tags?.includes('music'),
                    heroImage: "🎵",
                    description: "Écoutez des millions de chansons sans publicité."
                };
            case 'books':
                return {
                    title: "Union Books",
                    icon: Book,
                    color: "text-orange-600",
                    bgColor: "bg-orange-50",
                    filter: p => p.category === 'books' || p.tags?.includes('book'),
                    heroImage: "📚",
                    description: "Des millions d'eBooks, livres audio et magazines."
                };
            case 'apps':
                return {
                    title: "Appstore for Android",
                    icon: Smartphone,
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    filter: p => p.category === 'apps' || p.tags?.includes('app'),
                    heroImage: "📱",
                    description: "Découvrez et téléchargez vos applications préférées."
                };
            case 'business':
                return {
                    title: "Fierté Union Business",
                    icon: Briefcase,
                    color: "text-blue-800",
                    bgColor: "bg-blue-50",
                    filter: p => p.tags?.includes('business'),
                    heroImage: "💼",
                    description: "Solutions d'achat pour votre entreprise."
                };
            default:
                return {
                    title: "Union Store",
                    icon: Gift,
                    color: "text-primary",
                    bgColor: "bg-gray-50",
                    filter: () => true,
                    heroImage: "🛍️",
                    description: "Le meilleur du shopping en ligne."
                };
        }
    }, [type]);

    const filteredProducts = products.filter(config.filter);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin w-8 h-8 text-secondary" /></div>;

    return (
        <>
            <SEO title={config.title} description={config.description} />
            <div className="bg-white min-h-screen pb-12">
            {/* Hero Section */}
            <div className={`${config.bgColor} py-12 px-4 border-b border-gray-200`}>
                <div className="container mx-auto flex items-center gap-6">
                    <div className="hidden md:flex w-32 h-32 bg-white rounded-full shadow-lg items-center justify-center text-6xl">
                        {config.heroImage}
                    </div>
                    <div>
                        <h1 className={`text-4xl font-bold mb-2 flex items-center gap-3 ${config.color}`}>
                            <config.icon className="w-10 h-10" />
                            {config.title}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl">{config.description}</p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">À la une</h2>
                    <Link to="/catalog" className="text-sm font-medium text-blue-600 hover:underline">
                        Voir tout le catalogue
                    </Link>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl">
                        <div className="text-6xl mb-4">🚧</div>
                        <h3 className="text-xl font-bold mb-2">Bientôt disponible</h3>
                        <p className="text-gray-500">Nous ajoutons de nouveaux produits {config.title} très bientôt !</p>
                        <Link to="/catalog" className="inline-block mt-4 bg-secondary text-white px-6 py-2 rounded-full font-bold hover:opacity-90">
                            Continuer mes achats
                        </Link>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default CategoryLanding;
