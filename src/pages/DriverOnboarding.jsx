import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield, Wallet, Smartphone, ChevronRight, CheckCircle } from 'lucide-react';
import { registerDriver } from '../services/deliveryService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

const DriverOnboarding = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vehicleType: 'motorcycle',
        vehicleNumber: '',
        licenseNumber: '',
        area: 'Port-au-Prince'
    });

    const handleApply = async () => {
        setLoading(true);
        try {
            await registerDriver(currentUser.uid, formData);
            toast.success('Candidature envoyée avec succès !');
            setStep(3); // Celebration step
        } catch (error) {
            toast.error('Erreur lors de l\'envoi : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: "Pourquoi rejoindre UD Solution ?",
            icon: <Truck className="w-12 h-12 text-secondary" />,
            content: (
                <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-white/50 rounded-xl border border-white/20 backdrop-blur-sm">
                        <Wallet className="w-6 h-6 text-green-500" />
                        <div>
                            <h4 className="font-bold">Gagnez de l'argent immédiatement</h4>
                            <p className="text-sm opacity-70">Paiement instantané dans votre Wallet après chaque livraison.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-white/50 rounded-xl border border-white/20 backdrop-blur-sm">
                        <Shield className="w-6 h-6 text-blue-500" />
                        <div>
                            <h4 className="font-bold">Soyez votre propre patron</h4>
                            <p className="text-sm opacity-70">Choisissez vos horaires et vos parcours de livraison sur la carte.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStep(2)}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                        Commencer ma candidature <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )
        },
        {
            title: "Informations Véhicule",
            icon: <Smartphone className="w-12 h-12 text-indigo-500" />,
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type de véhicule</label>
                        <select
                            className="w-full p-4 rounded-xl border-2 border-neutral-100 outline-none focus:border-indigo-500 bg-white"
                            value={formData.vehicleType}
                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        >
                            <option value="motorcycle">Moto (Taxi-Moto)</option>
                            <option value="car">Voiture</option>
                            <option value="pickup">Camionnette / Pickup</option>
                            <option value="bicycle">Vélo / À pied</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Numéro de Plaque</label>
                        <input
                            type="text"
                            placeholder="Ex: T-45678"
                            className="w-full p-4 rounded-xl border-2 border-neutral-100 outline-none focus:border-indigo-500 bg-white"
                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={handleApply}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Envoi...' : 'Valider ma candidature'}
                    </button>
                </div>
            )
        },
        {
            title: "Candidature Reçue !",
            icon: <CheckCircle className="w-16 h-16 text-green-500" />,
            content: (
                <div className="text-center space-y-4">
                    <p className="text-lg">Votre dossier est en cours de révision par l'équipe **UD Solution**.</p>
                    <p className="text-sm opacity-70">Nous vous contacterons par WhatsApp pour la validation finale de vos documents.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-neutral-900 text-white font-bold py-4 rounded-xl transition-all"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-neutral-100">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4 bg-neutral-100 p-4 rounded-2xl">
                        {currentStep.icon}
                    </div>
                    <h1 className="text-2xl font-black text-neutral-900 mb-2">{currentStep.title}</h1>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-secondary' : 'bg-neutral-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {currentStep.content}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-neutral-400">
                        En postulant, vous confirmez être majeur et posséder les permis nécessaires à la conduite de votre véhicule en Haïti.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverOnboarding;
