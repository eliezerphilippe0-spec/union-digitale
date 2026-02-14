import React, { useState, useEffect } from 'react';
import { Plane, Calendar, MapPin, Search, Loader } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';

const Travel = () => {
    const { t } = useLanguage();
    const [origin, setOrigin] = useState('PAP');
    const [destination, setDestination] = useState('MIA');
    const [date, setDate] = useState('');
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { addToCart } = useCart();

    // Mock Airports
    const airports = [
        { code: 'PAP', name: 'Port-au-Prince (Toussaint Louverture)' },
        { code: 'CAP', name: 'Cap-Haïtien (Hugo Chávez)' },
        { code: 'MIA', name: 'Miami (MIA)' },
        { code: 'JFK', name: 'New York (JFK)' },
        { code: 'FLL', name: 'Fort Lauderdale (FLL)' },
        { code: 'SDQ', name: 'Saint-Domingue (Las Américas)' },
        { code: 'PTP', name: 'Pointe-à-Pitre (Guadeloupe)' },
        { code: 'ORY', name: 'Paris (Orly)' }
    ];

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);
        setFlights([]);

        try {
            // Basic query - in a real app, we'd query by date range
            // For this demo, we'll fetch all flights matching the route
            const q = query(
                collection(db, 'flights'),
                where('origin', '==', origin),
                where('destination', '==', destination)
            );

            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setFlights(results);
        } catch (error) {
            console.error("Error searching flights:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (flight) => {
        addToCart({
            id: flight.id,
            title: `Vol ${flight.airline} : ${flight.origin} -> ${flight.destination}`,
            price: flight.price,
            image: '✈️',
            type: 'flight',
            quantity: 1,
            details: flight
        });
        alert('Vol ajouté au panier !');
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <SEO title="Voyages" description="Trouvez vols et offres de voyage." />
            {/* Hero Section */}
            <div className="bg-blue-900 text-white py-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('travel_title')}</h1>
                    <p className="text-xl text-blue-200 mb-8">{t('travel_subtitle')}</p>

                    {/* Search Form */}
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto text-gray-900">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 text-left">{t('departure')}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <select
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-secondary appearance-none bg-white"
                                    >
                                        {airports.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 text-left">{t('arrival')}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <select
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-secondary appearance-none bg-white"
                                    >
                                        {airports.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1 text-left">{t('date')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-6 rounded transition-colors flex items-center justify-center gap-2 h-[42px]"
                            >
                                <Search className="w-5 h-5" /> {t('search_flights')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader className="animate-spin w-10 h-10 text-secondary" />
                    </div>
                ) : searched ? (
                    flights.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-6">{t('flights_found')} {origin} → {destination}</h2>
                            {flights.map(flight => (
                                <div key={flight.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                                            ✈️
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-gray-900">{flight.airline}</div>
                                            <div className="text-sm text-gray-500">{flight.class === 'business' ? t('business_class') : t('economy_class')}</div>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="text-center">
                                                    <div className="font-bold text-xl">{new Date(flight.departureTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="text-xs text-gray-500">{flight.origin}</div>
                                                </div>
                                                <div className="flex-1 border-t-2 border-gray-300 border-dashed relative w-32">
                                                    <Plane className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-gray-400 rotate-90" />
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-xl">{new Date(flight.arrivalTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div className="text-xs text-gray-500">{flight.destination}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[150px]">
                                        <div className="text-3xl font-bold text-secondary mb-2">{flight.price.toLocaleString()} G</div>
                                        <button
                                            onClick={() => handleBook(flight)}
                                            className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-2 px-4 rounded transition-colors"
                                        >
                                            {t('book_flight')}
                                        </button>
                                        <div className="text-xs text-gray-500 mt-2 text-center">{flight.seatsAvailable} {t('seats_remaining')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_flights_found')}</h3>
                            <p className="text-gray-500">{t('no_flights_desc')}</p>
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plane className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('flight_direct')}</h3>
                            <p className="text-sm text-gray-500">Des liaisons quotidiennes vers Miami, New York et les Caraïbes.</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('flight_flexibility')}</h3>
                            <p className="text-sm text-gray-500">Modifiez vos dates de voyage sans frais supplémentaires (selon conditions).</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('flight_agencies')}</h3>
                            <p className="text-sm text-gray-500">Support client disponible en Haïti 24/7 pour vous assister.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Travel;
