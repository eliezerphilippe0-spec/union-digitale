import React, { useState, useEffect } from 'react';
import { Plane, Calendar, MapPin, Search, Loader } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

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
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    {searched && (
                        <div className="w-full lg:w-64 space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-600" />
                                    Filtres
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Compagnies</label>
                                        <div className="space-y-2">
                                            {['Sunrise', 'Spirit', 'American', 'JetBlue'].map(airline => (
                                                <label key={airline} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-blue-600">
                                                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                                                    {airline}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Escale</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                <input type="radio" name="stops" className="text-blue-600" defaultChecked />
                                                Direct uniquement
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                <input type="radio" name="stops" className="text-blue-600" />
                                                1+ Escale
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
                                <h4 className="font-bold mb-2">Alerte Prix 🔔</h4>
                                <p className="text-xs text-blue-100 mb-4">Recevez une notification quand le prix baisse pour cet itinéraire.</p>
                                <button className="w-full bg-white text-blue-600 text-xs font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                    Activer l'alerte
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader className="animate-spin w-10 h-10 text-secondary" />
                            </div>
                        ) : searched ? (
                            flights.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">{flights.length} vols trouvés pour {origin} → {destination}</h2>
                                        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>Moins cher</option>
                                            <option>Plus rapide</option>
                                            <option>Le meilleur</option>
                                        </select>
                                    </div>

                                    {flights.map(flight => (
                                        <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
                                            {flight.price < 50000 && (
                                                <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-tighter">
                                                    Meilleur Prix
                                                </div>
                                            )}

                                            <div className="flex items-center gap-8 flex-1 w-full">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                    {flight.airline === 'Sunrise' ? '🇭🇹' : '✈️'}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-lg text-gray-900">{flight.airline}</span>
                                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                            {flight.class === 'business' ? t('business_class') : t('economy_class')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-6 mt-4">
                                                        <div className="text-center min-w-[60px]">
                                                            <div className="font-black text-xl text-gray-900">
                                                                {new Date(flight.departureTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-xs font-bold text-blue-600">{flight.origin}</div>
                                                        </div>

                                                        <div className="flex-1 flex flex-col items-center">
                                                            <span className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-tighter">Vols Direct (2h 15m)</span>
                                                            <div className="w-full h-px bg-gray-200 relative">
                                                                <Plane className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-blue-500 rotate-90" />
                                                                <div className="absolute left-0 top-0 w-2 h-2 rounded-full border-2 border-gray-200 bg-white -mt-[3px]"></div>
                                                                <div className="absolute right-0 top-0 w-2 h-2 rounded-full border-2 border-gray-200 bg-white -mt-[3px]"></div>
                                                            </div>
                                                        </div>

                                                        <div className="text-center min-w-[60px]">
                                                            <div className="font-black text-xl text-gray-900">
                                                                {new Date(flight.arrivalTime?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-xs font-bold text-blue-600">{flight.destination}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[180px] bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl w-full md:w-auto">
                                                <div className="text-xs text-gray-400 mb-1">Prix par adulte</div>
                                                <div className="text-3xl font-black text-blue-701 mb-3">
                                                    {flight.price.toLocaleString()} <span className="text-sm font-bold">G</span>
                                                </div>
                                                <button
                                                    onClick={() => handleBook(flight)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                                                >
                                                    {t('book_flight') || 'Sélectionner'}
                                                </button>
                                                <div className="flex items-center justify-center gap-1 text-[10px] mt-2 text-orange-600 font-bold">
                                                    <Users className="w-3 h-3" />
                                                    {flight.seatsAvailable} {t('seats_remaining') || 'places restantes'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm">
                                    <Plane className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_flights_found')}</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto">{t('no_flights_desc')}</p>
                                    <button className="mt-6 text-blue-600 font-bold text-sm hover:underline">Changer les dates</button>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-50 text-center hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <Plane className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{t('flight_direct')}</h3>
                                    <p className="text-xs text-gray-500">Des liaisons quotidiennes vers Miami, New York et les Caraïbes.</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-50 text-center hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{t('flight_flexibility')}</h3>
                                    <p className="text-xs text-gray-500">Modifiez vos dates de voyage sans frais supplémentaires (selon conditions).</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-50 text-center hover:shadow-md transition-shadow">
                                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{t('flight_agencies')}</h3>
                                    <p className="text-xs text-gray-500">Support client disponible en Haïti 24/7 pour vous assister.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Travel;
