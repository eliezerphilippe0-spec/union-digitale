import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { paymentService } from '../../services/paymentService'; // Assuming JS file import works in TSX
import { useAuth } from '../../contexts/AuthContext';

interface CheckoutFormProps {
    onSuccess: () => void;
    amount: number;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, amount }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'moncash' | 'natcash' | 'card'>('moncash');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });

    // Auto-fill from auth context if available
    React.useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                fullName: currentUser.full_name || currentUser.displayName || '',
                email: currentUser.email || '',
                phone: currentUser.phoneNumber || ''
            }));
        }
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Construct simulated order data
            // In a real app, items would come from cart context
            const orderData = {
                total: amount,
                // Using dummy items for the demo if not provided via props/context
                items: [{ title: 'Order', price: amount, quantity: 1 }],
                shippingAddress: null, // Digital product
                paymentMethod: paymentMethod,
                type: 'digital_product' // or whatever default
            };

            const userForOrder = currentUser || {
                uid: 'guest_' + Date.now(),
                email: formData.email,
                displayName: formData.fullName
            };

            console.log(`Processing ${paymentMethod} charge for ${amount} HTG`);

            let result;
            if (paymentMethod === 'moncash') {
                // Call MonCash service (which handles simulation fallback)
                result = await paymentService.processMonCashPayment(orderData, userForOrder);
            } else if (paymentMethod === 'natcash') {
                // Call Natcash service (simulation)
                result = await paymentService.processNatcashPayment(orderData, userForOrder);
            } else {
                // Card simulation
                await new Promise(resolve => setTimeout(resolve, 2000));
                result = '/order-confirmation/simulated_card'; // simplified for demo
            }

            // If we get a URL/path back, we can navigate or just call onSuccess
            // For now, let's assume onSuccess handles navigation based on the demo flow
            console.log("Payment Result:", result);

            // Artificial delay to show "Success" state if we had one, or just to smooth the transition
            setTimeout(() => {
                setLoading(false);
                onSuccess();
            }, 500);

        } catch (err: any) {
            console.error("Payment Error:", err);
            setLoading(false);
            setError("Une erreur est survenue lors du paiement. Veuillez réessayer.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                    {error}
                </div>
            )}

            {/* Step 1: Contact Info */}
            <div>
                <h3 className="text-gray-900 font-bold mb-3 border-b pb-1">1. Vos Coordonnées</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Prénom Complet"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email (pour la livraison)"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Téléphone WhatsApp"
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
                        required
                    />
                </div>
            </div>

            {/* Step 2: Payment Method */}
            <div>
                <h3 className="text-gray-900 font-bold mb-3 border-b pb-1">2. Paiement Sécurisé</h3>
                <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer relative transition-all ${paymentMethod === 'moncash' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-gray-300 opacity-80 hover:opacity-100'}`}>
                        <input
                            type="radio"
                            name="payment"
                            className="w-5 h-5 accent-red-600"
                            checked={paymentMethod === 'moncash'}
                            onChange={() => setPaymentMethod('moncash')}
                        />
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-red-600">MonCash</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/MonCash_Logo.png/640px-MonCash_Logo.png" alt="MonCash" className="h-6" />
                        </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer relative transition-all ${paymentMethod === 'natcash' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-300 opacity-80 hover:opacity-100'}`}>
                        <input
                            type="radio"
                            name="payment"
                            className="w-5 h-5 accent-blue-600"
                            checked={paymentMethod === 'natcash'}
                            onChange={() => setPaymentMethod('natcash')}
                        />
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">Natcash</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Natcom_Logo.png/220px-Natcom_Logo.png" alt="Natcash" className="h-6" />
                        </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer relative transition-all ${paymentMethod === 'card' ? 'border-gray-800 bg-gray-50 ring-1 ring-gray-800' : 'border-gray-300 opacity-80 hover:opacity-100'}`}>
                        <input
                            type="radio"
                            name="payment"
                            className="w-5 h-5 accent-gray-800"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                        />
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-bold text-gray-700">Carte de Crédit</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-extrabold text-xl py-4 rounded-lg shadow-lg transform transition hover:-translate-y-1 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D4AF37] hover:bg-[#b5952f]'}`}
            >
                {loading ? "Traitement en cours..." : `PAYER ${amount.toLocaleString()} HTG MAINTENANT`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-2">
                Paiement encrypté 256-bit SSL. Vos données sont protégées.
            </p>
        </form>
    );
};

export default CheckoutForm;
