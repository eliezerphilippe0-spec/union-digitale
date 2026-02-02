import React, { useEffect, useState } from 'react';
import { useRealEstate } from '../../hooks/useRealEstate';
import { MapPin, Home, Bed, Bath, Search, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RealEstateCatalog = () => {
    const { listings, fetchListings, loading } = useRealEstate();
    const [filter, setFilter] = useState('all'); // all, sale, rental
    const navigate = useNavigate();

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const filteredListings = listings.filter(l => {
        if (filter === 'sale') return l.type === 'house' || l.type === 'land';
        if (filter === 'rental') return l.type === 'rental';
        return true;
    });

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-4 text-gray-900">Immobilier & Locations</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">Découvrez des terrains, maisons à vendre et locations de vacances uniques en Haïti.</p>
                </div>

                {/* FILTERS */}
                <div className="flex justify-center gap-4 mb-8">
                    <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-full font-medium ${filter === 'all' ? 'bg-secondary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Tout</button>
                    <button onClick={() => setFilter('sale')} className={`px-6 py-2 rounded-full font-medium ${filter === 'sale' ? 'bg-secondary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Acheter</button>
                    <button onClick={() => setFilter('rental')} className={`px-6 py-2 rounded-full font-medium ${filter === 'rental' ? 'bg-secondary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Louer (Airbnb)</button>
                </div>

                {/* GRID */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-secondary" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredListings.map(item => (
                                <div key={item.id} onClick={() => navigate(`/real-estate/${item.id}`)} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                            {item.type === 'land' ? '🏞️' : item.type === 'house' ? '🏡' : '🏨'}
                                        </div>
                                        <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                            {item.type === 'rental' ? 'Location' : 'Vente'}
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-secondary transition-colors">{item.title}</h3>
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                                {item.price.toLocaleString()} {item.currency}
                                                {item.type === 'rental' && <span className="text-[10px] font-normal">/nuit</span>}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                                            <MapPin className="w-4 h-4" /> {item.location}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-400 border-t pt-4">
                                            {item.type !== 'land' && (
                                                <>
                                                    <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {item.rooms} Ch.</span>
                                                    <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> 2 Sdb</span>
                                                </>
                                            )}
                                            <span className="flex items-center gap-1 ml-auto"><Home className="w-3 h-3" /> {item.surface} m²</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredListings.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">Aucune annonce trouvée</h3>
                                <p className="text-gray-500">Soyez le premier à publier une annonce dans cette catégorie !</p>
                                <button onClick={() => navigate('/seller/real-estate/new')} className="mt-4 text-secondary font-bold hover:underline">Publier une annonce</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RealEstateCatalog;
