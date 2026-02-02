import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CreditCard, Loader, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import OrderBump from '../../components/digital/OrderBump';
import CheckoutForm from '../../components/digital/CheckoutForm';

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string;
}

interface BumpOffer {
    id: string;
    title: string;
    price: number;
    description: string;
    image: string;
}

const CheckoutPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [bumpOffer, setBumpOffer] = useState<BumpOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderBumpAdded, setOrderBumpAdded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('ID du produit manquant');
                setLoading(false);
                return;
            }

            try {
                // Fetch main product
                let productDoc = await getDoc(doc(db, 'digital_products', id));
                if (!productDoc.exists()) {
                    productDoc = await getDoc(doc(db, 'products', id));
                }

                if (productDoc.exists()) {
                    const data = productDoc.data();
                    setProduct({
                        id: productDoc.id,
                        title: data.title || data.name || 'Produit',
                        price: data.offerPrice || data.price || 0,
                        thumbnail: data.thumbnail || data.images?.[0] || 'https://via.placeholder.com/150'
                    });

                    // Fetch order bump offer (related product or configured bump)
                    if (data.bumpOfferId) {
                        const bumpDoc = await getDoc(doc(db, 'digital_products', data.bumpOfferId));
                        if (bumpDoc.exists()) {
                            const bumpData = bumpDoc.data();
                            setBumpOffer({
                                id: bumpDoc.id,
                                title: bumpData.title || bumpData.name,
                                price: bumpData.bumpPrice || bumpData.price,
                                description: bumpData.bumpDescription || bumpData.shortDescription || '',
                                image: bumpData.thumbnail || bumpData.images?.[0] || ''
                            });
                        }
                    } else {
                        // Try to find a bump offer from order_bumps collection
                        const bumpQuery = query(
                            collection(db, 'order_bumps'),
                            where('productId', '==', id),
                            where('active', '==', true),
                            limit(1)
                        );
                        const bumpSnap = await getDocs(bumpQuery);
                        if (!bumpSnap.empty) {
                            const bumpData = bumpSnap.docs[0].data();
                            setBumpOffer({
                                id: bumpSnap.docs[0].id,
                                title: bumpData.title,
                                price: bumpData.price,
                                description: bumpData.description || '',
                                image: bumpData.image || ''
                            });
                        }
                    }
                } else {
                    setError('Produit non trouvé');
                }
            } catch (err) {
                console.error('Error fetching checkout data:', err);
                setError('Erreur lors du chargement');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-800 mb-2">{error || 'Produit non trouvé'}</h1>
                <button onClick={() => navigate(-1)} className="text-[#D4AF37] hover:underline">
                    Retour
                </button>
            </div>
        );
    }

    const total = product.price + (orderBumpAdded && bumpOffer ? bumpOffer.price : 0);

    const handleSuccess = () => {
        // Redirect to Upsell or Success
        // Using replace to prevent back navigation loop if payment succeeded
        navigate('/digital/upsell', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* LEFT COLUMN: Summary & Benefits */}
                    <div className="md:w-1/3 order-2 md:order-1">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Résumé de la commande</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <img src={product.thumbnail} alt="Product" className="w-16 h-16 rounded object-cover" />
                                <div>
                                    <h4 className="font-bold text-sm text-[#0A1D37]">{product.title}</h4>
                                    <p className="text-[#D4AF37] font-bold">{product.price.toLocaleString()} HTG</p>
                                </div>
                            </div>

                            {orderBumpAdded && bumpOffer && (
                                <div className="flex items-center gap-4 mb-4 bg-yellow-50 p-2 rounded">
                                    <img src={bumpOffer.image} alt="Bump" className="w-10 h-10 rounded object-cover" />
                                    <div>
                                        <h4 className="font-bold text-xs text-[#0A1D37]">{bumpOffer.title}</h4>
                                        <p className="text-[#D4AF37] font-bold">{bumpOffer.price.toLocaleString()} HTG</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4 mt-2 flex justify-between items-center text-lg font-extrabold text-[#0A1D37]">
                                <span>Total</span>
                                <span>{total.toLocaleString()} HTG</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <img src="https://via.placeholder.com/300x100?text=Secure+Badges" alt="Security" className="mx-auto mb-4" />
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3" /> Paiement 100% Sécurisé
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Checkout Form */}
                    <div className="md:w-2/3 order-1 md:order-2">
                        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-[#0A1D37] to-[#1a3a5c] text-white p-4 text-center">
                                <h2 className="text-xl font-bold">Dernière étape !</h2>
                                <p className="text-sm text-white/90">Remplissez le formulaire pour accéder à votre produit.</p>
                            </div>

                            <div className="p-8">
                                <CheckoutForm onSuccess={handleSuccess} amount={total} />

                                {bumpOffer && (
                                    <div className="mt-8 border-t border-gray-100 pt-6">
                                        <OrderBump
                                            product={bumpOffer}
                                            isChecked={orderBumpAdded}
                                            onToggle={() => setOrderBumpAdded(!orderBumpAdded)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
