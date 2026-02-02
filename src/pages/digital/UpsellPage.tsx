import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { functions, db } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface UpsellOffer {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    features: string[];
    image: string;
}

const UpsellPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingOffer, setFetchingOffer] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 min timer
    const [upsellOffer, setUpsellOffer] = useState<UpsellOffer | null>(null);

    // Get orderId from navigation state or URL params
    const orderId = (location.state as any)?.orderId || new URLSearchParams(location.search).get('orderId');

    // Fetch upsell offer
    useEffect(() => {
        const fetchUpsellOffer = async () => {
            try {
                // Try to get upsell from upsells collection
                const upsellQuery = query(
                    collection(db, 'upsells'),
                    where('active', '==', true),
                    limit(1)
                );
                const upsellSnap = await getDocs(upsellQuery);

                if (!upsellSnap.empty) {
                    const data = upsellSnap.docs[0].data();
                    setUpsellOffer({
                        id: upsellSnap.docs[0].id,
                        title: data.title || 'Coaching Privé (1h)',
                        description: data.description || '',
                        price: data.price || 2500,
                        originalPrice: data.originalPrice || 7500,
                        features: data.features || [
                            'Audit de votre projet',
                            'Plan d\'action personnalisé',
                            'Enregistrement vidéo inclus'
                        ],
                        image: data.image || 'https://via.placeholder.com/400x200'
                    });
                } else {
                    // Use default upsell offer
                    setUpsellOffer({
                        id: 'default_upsell',
                        title: 'Coaching Privé (1h)',
                        description: 'Accélérez vos résultats avec un accompagnement personnalisé',
                        price: 2500,
                        originalPrice: 7500,
                        features: [
                            'Audit de votre projet',
                            'Plan d\'action personnalisé',
                            'Enregistrement vidéo inclus'
                        ],
                        image: 'https://via.placeholder.com/400x200'
                    });
                }
            } catch (err) {
                console.error('Error fetching upsell:', err);
                // Use fallback
                setUpsellOffer({
                    id: 'default_upsell',
                    title: 'Coaching Privé (1h)',
                    description: '',
                    price: 2500,
                    originalPrice: 7500,
                    features: [
                        'Audit de votre projet',
                        'Plan d\'action personnalisé',
                        'Enregistrement vidéo inclus'
                    ],
                    image: 'https://via.placeholder.com/400x200'
                });
            } finally {
                setFetchingOffer(false);
            }
        };

        fetchUpsellOffer();
    }, []);

    // Countdown effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAccept = async () => {
        if (!upsellOffer) return;

        setLoading(true);
        setError(null);

        try {
            // Call Cloud Function for one-click upsell
            const oneClickUpsell = httpsCallable(functions, 'oneClickUpsell');
            const result = await oneClickUpsell({
                upsellProductId: upsellOffer.id,
                orderId: orderId
            });

            const data = result.data as any;

            if (data.success) {
                console.log('✅ Upsell added successfully');
                navigate('/library', { replace: true });
            } else {
                throw new Error(data.error || 'Échec de l\'ajout');
            }
        } catch (err: any) {
            console.error('Upsell error:', err);

            // Handle specific error codes
            if (err.code === 'functions/unauthenticated') {
                setError('Veuillez vous reconnecter');
            } else if (err.code === 'functions/failed-precondition') {
                setError('Aucun paiement récent trouvé');
            } else {
                setError(err.message || 'Erreur lors de l\'ajout');
            }
            setLoading(false);
        }
    };

    const handleDecline = () => {
        navigate('/library');
    };

    // Loading state
    if (fetchingOffer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="w-10 h-10 animate-spin text-[#D4AF37]" />
            </div>
        );
    }

    // No upsell available
    if (!upsellOffer) {
        navigate('/library', { replace: true });
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-red-500 relative">

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-2">
                    <div className="bg-green-500 h-2 w-[80%]"></div>
                </div>

                <div className="p-8 text-center">
                    <div className="inline-block bg-red-100 text-red-600 px-4 py-1 rounded-full text-sm font-bold mb-6 animate-pulse">
                        ATTENTION : Offre Unique - Ne fermez pas cette page !
                    </div>

                    <h1 className="text-3xl font-black text-[#0A1D37] mb-4">
                        Attendez ! Votre commande n'est pas terminée...
                    </h1>

                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        Voulez-vous ajouter le <strong>"{upsellOffer.title}"</strong> à votre commande pour seulement{' '}
                        <span className="text-green-600 font-bold">{upsellOffer.price.toLocaleString()} HTG</span>{' '}
                        au lieu de {upsellOffer.originalPrice.toLocaleString()} HTG ?
                    </p>

                    <div className="bg-gray-100 p-6 rounded-xl mb-8 border border-gray-200">
                        <img src={upsellOffer.image} alt={upsellOffer.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <ul className="text-left space-y-2">
                            {upsellOffer.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <Check className="text-green-500 w-5 h-5 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className={`text-white text-xl font-bold py-4 rounded-xl shadow-lg transform transition flex items-center justify-center gap-2 ${
                                loading
                                    ? 'bg-gray-400 cursor-wait'
                                    : 'bg-green-500 hover:bg-green-600 hover:scale-105'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin w-6 h-6" />
                                    Traitement en cours...
                                </>
                            ) : (
                                `OUI, AJOUTER À MA COMMANDE (${upsellOffer.price.toLocaleString()} HTG)`
                            )}
                        </button>

                        <button
                            onClick={handleDecline}
                            disabled={loading}
                            className="text-gray-400 text-sm hover:underline hover:text-gray-600"
                        >
                            Non merci, je ne veux pas accélérer mes résultats
                        </button>
                    </div>

                    <div className="mt-8 text-red-500 text-sm font-bold">
                        Expire dans {formatTime(timeLeft)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpsellPage;
