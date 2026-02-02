import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, X } from 'lucide-react';
import { functions } from '../../lib/firebase'; // Assuming firebase export
import { httpsCallable } from 'firebase/functions';

const UpsellPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');
    const [loading, setLoading] = useState(false);

    // Example Upsell Product
    const upsellProduct = {
        id: 'upsell_vip_001',
        title: 'Accès VIP à vie',
        price: 1500,
        originalPrice: 5000,
        description: 'Ne payez plus jamais pour nos mises à jour. Accès illimité à tous les futurs templates.',
        image: 'https://placehold.co/600x400/gold/white?text=VIP+Access',
        features: [
            'Mises à jour gratuites à vie',
            'Support prioritaire 24/7',
            'Accès aux contenus exclusifs',
            'Badge Membre VIP'
        ]
    };

    const handleAccept = async () => {
        setLoading(true);
        try {
            // Call Cloud Function
            // const oneClickUpsell = httpsCallable(functions, 'oneClickUpsell');
            // await oneClickUpsell({ originalOrderId: orderId, upsellProductId: upsellProduct.id });

            // Simulation
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert("Offre ajoutée avec succès !");

            navigate(`/order-confirmation?orderId=${orderId}&upsell=added`);
        } catch (error) {
            console.error("Upsell failed", error);
            alert("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        navigate(`/order-confirmation?orderId=${orderId}`);
    };

    if (!orderId) return <div className="p-10 text-center">Commande non trouvée.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            {/* Progress Bar */}
            <div className="w-full max-w-2xl mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-400 mb-2">
                    <span className="text-green-600">1. Checkout</span>
                    <span className="text-blue-600">2. Offre Spéciale</span>
                    <span>3. Confirmation</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-2/3"></div>
                </div>
            </div>

            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-red-600 text-white text-center py-3 font-bold text-lg animate-pulse">
                    ATTENDEZ ! VOTRE COMMANDE N'EST PAS ENCORE TERMINÉE...
                </div>

                <div className="p-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                        Voulez-vous ajouter cet accès <span className="text-blue-600">VIP à vie</span> ?
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Cette offre unique disparaîtra dès que vous quitterez cette page.
                    </p>

                    <div className="mb-8 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <img
                            src={upsellProduct.image}
                            alt="VIP Access"
                            className="relative rounded-lg w-full object-cover shadow-md"
                        />
                        <div className="absolute top-4 right-4 bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg transform rotate-3">
                            -70% DE RABAIS
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
                        {upsellProduct.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                <span className="font-medium text-gray-800">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className="text-gray-400 line-through text-2xl font-bold">{upsellProduct.originalPrice.toLocaleString()} G</span>
                        <span className="text-green-600 text-5xl font-extrabold">{upsellProduct.price.toLocaleString()} G</span>
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-xl shadow-lg transform transition hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-3 mb-4"
                    >
                        {loading ? "Traitement en cours..." : "OUI ! AJOUTER À MA COMMANDE"}
                        {!loading && <ArrowRight className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={handleDecline}
                        className="text-gray-400 hover:text-gray-600 text-sm font-medium underline decoration-gray-300 underline-offset-4 transition-colors"
                    >
                        Non merci, je ne veux pas profiter de cette offre unique
                    </button>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-gray-400 text-sm">
                <X className="w-4 h-4" />
                <span>Ne pas fermer cette fenêtre</span>
            </div>
        </div>
    );
};

export default UpsellPage;
