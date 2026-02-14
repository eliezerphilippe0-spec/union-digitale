import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Calendar, DollarSign, Fuel, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SEO from '../../components/common/SEO';

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
        <>
            <SEO title="Union Auto" description="Achetez ou louez des voitures en Haïti: annonces vérifiées et offres locales." />
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
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'all'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('sale')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'sale'
                            ? 'bg-secondary text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        À Vendre
                    </button>
                    <button
                        onClick={() => setFilter('rent')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${filter === 'rent'
                            ? 'bg-accent text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        À Louer
                    </button>
                </div>

                {/* Cars Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Chargement des véhicules...</p>
                    </div>
                ) : cars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map((car) => (
                            <div
                                key={car.id}
                                onClick={() => navigate(`/car/${car.id}`)}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            >
                                {/* Car Image */}
                                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                    {car.photos && car.photos[0] ? (
                                        <img
                                            src={car.photos[0]}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Car className="w-20 h-20 text-gray-400" />
                                        </div>
                                    )}
                                    {/* Type Badge */}
                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white ${car.type === 'sale' ? 'bg-green-500' : 'bg-blue-500'
                                        }`}>
                                        {car.type === 'sale' ? 'À Vendre' : 'À Louer'}
                                    </div>
                                </div>

                                {/* Car Info */}
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {car.brand} {car.model}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3">{car.year}</p>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>{car.location || 'Haïti'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{car.mileage ? `${car.mileage} km` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <div>
                                            <p className="text-2xl font-bold text-primary-600">
                                                {car.price?.toLocaleString()} {car.currency || 'HTG'}
                                            </p>
                                            {car.type === 'rent' && (
                                                <p className="text-xs text-gray-500">par jour</p>
                                            )}
                                        </div>
                                        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                            Voir détails
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
        </>
    );
};

export default CarsCatalog;
