import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalons, GENDER_FOCUS } from '../../services/salonService';
import SalonCard from '../../components/salons/SalonCard';
import { getUserLocation, calculateDistance } from '../../services/locationService';
import { Navigation } from 'lucide-react';

const SalonListing = () => {
    const navigate = useNavigate();
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [nearMeActive, setNearMeActive] = useState(false);
    const [filters, setFilters] = useState({
        city: '',
        genderFocus: '',
        priceRange: ''
    });

    useEffect(() => {
        loadSalons();
    }, [filters]);

    const loadSalons = async () => {
        try {
            setLoading(true);
            let data = await getSalons(filters);

            if (userLocation || nearMeActive) {
                // Calculate distances and sort
                data = data.map(salon => {
                    const dist = userLocation && salon.address?.lat && salon.address?.lng
                        ? calculateDistance(userLocation.lat, userLocation.lng, salon.address.lat, salon.address.lng)
                        : null;
                    return { ...salon, distance: dist };
                });

                if (nearMeActive && userLocation) {
                    data.sort((a, b) => {
                        if (a.distance === null) return 1;
                        if (b.distance === null) return -1;
                        return a.distance - b.distance;
                    });
                }
            }

            setSalons(data);
        } catch (error) {
            console.error('Error loading salons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNearMe = async () => {
        if (nearMeActive) {
            setNearMeActive(false);
            return;
        }

        try {
            setLoading(true);
            const loc = await getUserLocation();
            setUserLocation(loc);
            setNearMeActive(true);
        } catch (error) {
            alert("Accès à la localisation refusé ou non disponible.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Search */}
            <div className="bg-indigo-600 text-white pt-12 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">Trouvez votre coiffeur idéal</h1>
                    <p className="opacity-90 mb-8 text-lg">Réservez les meilleurs salons et stylistes à domicile en Haïti.</p>

                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Ville, quartier..."
                            className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white text-slate-800 shadow-xl border-none focus:ring-2 focus:ring-indigo-400 transition-all text-lg"
                            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={24} />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="max-w-6xl mx-auto px-6 -mt-8">
                <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap gap-4 items-center justify-between border border-slate-100">
                    <div className="flex gap-4">
                        <select
                            className="px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-600"
                            onChange={(e) => setFilters({ ...filters, genderFocus: e.target.value })}
                        >
                            <option value="">Tous Genres</option>
                            <option value={GENDER_FOCUS.H}>Homme</option>
                            <option value={GENDER_FOCUS.F}>Femme</option>
                            <option value={GENDER_FOCUS.MIX}>Mixte</option>
                        </select>
                        <select className="px-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-600">
                            <option value="">Budget</option>
                            <option value="low">Économique</option>
                            <option value="mid">Standard</option>
                            <option value="high">Premium</option>
                        </select>
                        <button
                            onClick={handleNearMe}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm transition-all ${nearMeActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Navigation size={16} />
                            Près de moi
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Filter size={18} />
                        <span>{salons.length} résultats</span>
                    </div>
                </div>
            </div>

            {/* Salon Grid */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {salons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {salons.map(salon => (
                                    <SalonCard key={salon.id} salon={salon} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                                <Scissors size={64} className="mx-auto text-slate-200 mb-6" />
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Aucun salon trouvé</h2>
                                <p className="text-slate-500">Essayez de modifier vos filtres ou recherchez une autre ville.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SalonListing;
