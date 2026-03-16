import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Navigation,
    DollarSign,
    Package,
    Power,
    ChevronRight,
    CheckCircle2,
    QrCode
} from 'lucide-react';
import { getAvailableMissions, acceptMission } from '../services/deliveryService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

const DriverDashboard = () => {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [isOnline, setIsOnline] = useState(false);
    const [missions, setMissions] = useState([]);
    const [activeMission, setActiveMission] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOnline) {
            fetchMissions();
            const interval = setInterval(fetchMissions, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [isOnline]);

    const fetchMissions = async () => {
        const available = await getAvailableMissions();
        setMissions(available);
    };

    const handleAccept = async (missionId) => {
        setLoading(true);
        try {
            await acceptMission(missionId, currentUser.uid);
            toast.success('Mission acceptée ! En route pour le ramassage.');
            fetchMissions();
            // In a real app, we'd set activeMission here
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header / Stats Overlay */}
            <div className="bg-neutral-900 text-white p-6 pt-12 rounded-b-[40px] shadow-xl">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-sm opacity-60 font-bold uppercase tracking-widest">Dashboard Livreur</h1>
                        <p className="text-2xl font-black">Bonjour, {currentUser?.displayName?.split(' ')[0] || 'Jean'}</p>
                    </div>
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`p-3 rounded-2xl flex items-center gap-2 transition-all ${isOnline ? 'bg-green-500 shadow-green-500/50 shadow-lg' : 'bg-neutral-800'}`}
                    >
                        <Power className="w-5 h-5" />
                        <span className="font-bold text-sm">{isOnline ? 'En Ligne' : 'Hors Ligne'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <DollarSign className="w-5 h-5 text-gold-400 mb-2" />
                        <p className="text-xs opacity-60">Gains aujourd'hui</p>
                        <p className="text-xl font-bold">1,250 G</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <Package className="w-5 h-5 text-blue-400 mb-2" />
                        <p className="text-xs opacity-60">Courses finies</p>
                        <p className="text-xl font-bold">5</p>
                    </div>
                </div>
            </div>

            {/* Main Feed */}
            <div className="container mx-auto px-4 -mt-6">
                {!isOnline ? (
                    <div className="bg-white p-12 rounded-3xl shadow-xl text-center border border-neutral-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                            <Navigation className="w-10 h-10 text-neutral-300" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-800 mb-2">Passez en ligne pour voir les missions</h2>
                        <p className="text-sm opacity-60">Les colis disponibles dans votre zone s'afficheront ici.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="font-black text-neutral-900">MISSIONS PROCHES ({missions.length})</h2>
                            <button onClick={fetchMissions} className="text-xs font-bold text-indigo-600">Actualiser</button>
                        </div>

                        {missions.length === 0 ? (
                            <div className="p-8 text-center opacity-40 italic">Recherche de colis à proximité...</div>
                        ) : (
                            missions.map(mission => (
                                <div key={mission.id} className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 animate-in slide-in-from-right-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600">
                                                G
                                            </div>
                                            <div>
                                                <p className="text-xs text-neutral-400 truncate w-32">ID: {mission.id.slice(0, 8)}</p>
                                                <p className="font-bold text-green-600">+{mission.deliveryFee} HTG</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                                            À ramasser
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative">
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <div className="w-0.5 h-6 bg-neutral-100" />
                                                <MapPin className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div className="text-sm space-y-3">
                                                <p className="font-medium text-neutral-500 leading-none">{mission.pickupAddress}</p>
                                                <p className="font-bold text-neutral-900 leading-none">{mission.deliveryAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleAccept(mission.id)}
                                        disabled={loading}
                                        className="mt-6 w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        Accepter la mission <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Nav Simulation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-neutral-100 p-4 flex justify-around items-center">
                <div className="flex flex-col items-center gap-1 text-indigo-600">
                    <Navigation className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Missions</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-neutral-300">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Historique</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-neutral-300">
                    <QrCode className="w-6 h-6" />
                    <span className="text-[10px] font-bold">Scan QR</span>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
