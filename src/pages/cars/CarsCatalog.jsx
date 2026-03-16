import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Calendar, DollarSign, Fuel, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const CarsCatalog = () => {
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'sale', 'rent'

    useEffect(() => {
        fetchCars();
    }, [filter]);

    const fetchCars = async () => {
        try {
            setLoading(true);
            let q = collection(db, 'cars');

            if (filter !== 'all') {
                q = query(q, where('type', '==', filter));
            }

            const snapshot = await getDocs(q);
            const carsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCars(carsData);
        } catch (error) {
            console.error('Error fetching cars:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        🚗 Location & Vente de Véhicules
                    </h1>
                    <p className="text-gray-600">
                        Trouvez la voiture parfaite pour vos besoins en Haïti
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {['all', 'sale', 'rent'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-sm ${filter === t
                                ? 'bg-[#0A1D37] text-white shadow-blue-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {t === 'all' ? 'Tous' : t === 'sale' ? 'À Vendre' : 'Location'}
                        </button>
                    ))}
                    <div className="flex items-center gap-2 ml-4">
                        <select className="px-4 py-2.5 rounded-xl border border-gray-100 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500">
                            <option>Prix: Croissant</option>
                            <option>Prix: Décroissant</option>
                            <option>Plus récents</option>
                        </select>
                    </div>
                </div>

                {/* Cars Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1D37] mx-auto"></div>
                        <p className="mt-4 text-gray-500 font-medium tracking-wide">Recherche de véhicules...</p>
                    </div>
                ) : cars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {cars.map((car) => (
                            <div
                                key={car.id}
                                onClick={() => navigate(`/car/${car.id}`)}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group border border-gray-100"
                            >
                                {/* Car Image */}
                                <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                    {car.photos && car.photos[0] ? (
                                        <img
                                            src={car.photos[0]}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Car className="w-16 h-16 text-gray-300" />
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter text-white shadow-lg ${car.type === 'sale' ? 'bg-green-500' : 'bg-blue-600'}`}>
                                            {car.type === 'sale' ? 'À Vendre' : 'Location'}
                                        </div>
                                        {car.featured && (
                                            <div className="bg-amber-400 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                ★ Verified
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-900 border border-white/50">
                                        {car.year}
                                    </div>
                                </div>

                                {/* Car Info */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-black text-[#0A1D37] group-hover:text-blue-600 transition-colors">
                                                {car.brand} {car.model}
                                            </h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{car.location || 'Port-au-Prince, Haïti'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Features Icons */}
                                    <div className="grid grid-cols-3 gap-2 mb-6 py-4 border-y border-gray-50">
                                        <div className="flex flex-col items-center gap-1">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">5 Places</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 border-x border-gray-50">
                                            <Fuel className="w-4 h-4 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">Hybride</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Car className="w-4 h-4 text-gray-400" />
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">Auto</span>
                                        </div>
                                    </div>

                                    {/* Price & CTA */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-gray-400 font-medium">Prix</div>
                                            <div className="text-2xl font-black text-[#0A1D37]">
                                                {car.price?.toLocaleString()} <span className="text-sm text-gray-400">{car.currency || 'HTG'}</span>
                                            </div>
                                            {car.type === 'rent' && (
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">/ Journée</div>
                                            )}
                                        </div>
                                        <button className="bg-[#0A1D37] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                            Réserver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Aucun véhicule trouvé
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Soyez le premier à publier une annonce dans cette catégorie !
                        </p>
                        <button
                            onClick={() => navigate('/seller/dashboard')}
                            className="mt-4 px-6 py-2 bg-secondary text-white font-bold rounded-lg hover:bg-secondary-hover transition-colors"
                        >
                            Accéder au Dashboard Vendeur
                        </button>
                    </div>
                )}

                {/* CTA for sellers */}
                {cars.length > 0 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => navigate('/seller/car/new')}
                            className="px-8 py-3 bg-gradient-to-r from-secondary to-accent text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            Publier votre véhicule
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarsCatalog;
