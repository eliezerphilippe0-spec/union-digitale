import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Star, ShieldCheck, Loader, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface DigitalProduct {
    id: string;
    title: string;
    subtitle?: string;
    price: number;
    offerPrice?: number;
    description: string;
    features: string[];
    thumbnail: string;
    rating?: number;
    reviewCount?: number;
}

const ProductPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState<DigitalProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setError('ID du produit manquant');
                setLoading(false);
                return;
            }

            try {
                // Try digital_products collection first
                let productDoc = await getDoc(doc(db, 'digital_products', id));

                // Fallback to products collection
                if (!productDoc.exists()) {
                    productDoc = await getDoc(doc(db, 'products', id));
                }

                if (productDoc.exists()) {
                    const data = productDoc.data();
                    setProduct({
                        id: productDoc.id,
                        title: data.title || data.name || 'Produit sans titre',
                        subtitle: data.subtitle || data.shortDescription || '',
                        price: data.price || data.comparePrice || 0,
                        offerPrice: data.offerPrice || data.price || 0,
                        description: data.description || '',
                        features: data.features || data.benefits || [],
                        thumbnail: data.thumbnail || data.images?.[0] || 'https://via.placeholder.com/600x400',
                        rating: data.rating || 5,
                        reviewCount: data.reviewCount || 0
                    });
                } else {
                    setError('Produit non trouvé');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('Erreur lors du chargement du produit');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Produit non trouvé'}</h1>
                <Link to="/catalog" className="text-[#D4AF37] hover:underline">
                    Retour au catalogue
                </Link>
            </div>
        );
    }

    const displayPrice = product.offerPrice || product.price;
    const hasDiscount = product.offerPrice && product.offerPrice < product.price;

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Header / Hero */}
            <div className="bg-[#0A1D37] text-white py-12">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                        {product.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light mb-8">
                        {product.subtitle}
                    </p>
                    <Link to={`/digital/checkout/${id}`} className="inline-block bg-[#D4AF37] hover:bg-[#b5952f] text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105">
                        Commencer Maintenant - {displayPrice.toLocaleString()} HTG
                    </Link>
                    {hasDiscount && (
                        <p className="mt-2 text-gray-400 line-through">{product.price.toLocaleString()} HTG</p>
                    )}
                    <p className="mt-4 text-sm text-gray-400">Accès immédiat après paiement</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img src={product.thumbnail} alt={product.title} className="rounded-xl shadow-2xl w-full" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-300'}`}
                                />
                            ))}
                            <span className="text-gray-600 text-sm ml-2">({product.reviewCount || 0} avis)</span>
                        </div>
                        <h2 className="text-3xl font-bold text-[#0A1D37] mb-6">Ce que vous allez apprendre</h2>
                        <ul className="space-y-4">
                            {product.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600 mt-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg text-gray-700">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Guarantee */}
            <div className="bg-gray-50 py-16 border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <ShieldCheck className="w-16 h-16 text-[#0A1D37] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Garantie Satisfaction 100%</h3>
                    <p className="text-gray-600">Si vous n'êtes pas satisfait dans les 30 jours, nous vous remboursons intégralement. Sans poser de questions.</p>
                </div>
            </div>

            {/* Float CTA */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                <Link to={`/digital/checkout/${id}`} className="block w-full bg-[#D4AF37] text-white text-center font-bold py-3 rounded-lg">
                    Acheter - {displayPrice.toLocaleString()} HTG
                </Link>
            </div>
        </div>
    );
};

export default ProductPage;
