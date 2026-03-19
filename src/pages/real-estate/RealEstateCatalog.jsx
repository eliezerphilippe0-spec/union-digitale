import React, { useEffect, useState } from 'react';
import { useRealEstate } from '../../hooks/useRealEstate';
import { MapPin, Home, Bed, Bath, Search, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/common/SEO';

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
        <>
            <SEO title="Immobilier en Haïti" description="Maisons, terrains et locations en Haïti. Trouvez des offres vérifiées." />
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
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1D37] mx-auto"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredListings.map(item => (
                                <div key={item.id} onClick={() => navigate(`/real-estate/${item.id}`)} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 flex flex-col h-full">
                                    <div className="h-64 bg-gray-100 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-700">
                                            {item.type === 'land' ? '🏞️' : item.type === 'house' ? '🏡' : '🏨'}
                                        </div>

                                        {/* Status Badges */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0A1D37] shadow-sm">
                                                {item.type === 'rental' ? 'Location Courte Durée' : 'À Vendre'}
                                            </div>
                                            {item.type === 'rental' && (
                                                <div className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-[10px] font-bold shadow-lg flex items-center gap-1">
                                                    ⚡ Instant Book
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute top-4 right-4 bg-amber-400 text-white p-2 rounded-xl shadow-lg">
                                            <Star className="w-4 h-4 fill-current" />
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-xl text-[#0A1D37] line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                        </div>

                                        <div className="flex items-center gap-1 text-sm text-gray-400 mb-6">
                                            <MapPin className="w-4 h-4 text-blue-500" /> {item.location}
                                        </div>

                                        {/* Amenities Grid */}
                                        <div className="grid grid-cols-3 gap-4 mb-8 py-4 border-y border-gray-50">
                                            <div className="flex flex-col items-center gap-1">
                                                <Bed className="w-5 h-5 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{item.rooms || 0} Ch.</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 border-x border-gray-50">
                                                <Bath className="w-5 h-5 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">2 Sdb</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <Home className="w-5 h-5 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{item.surface} m²</span>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between mt-auto">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">À partir de</div>
                                                <div className="text-3xl font-black text-[#0A1D37]">
                                                    {item.price.toLocaleString()} <span className="text-sm font-bold text-gray-400">{item.currency}</span>
                                                </div>
                                                {item.type === 'rental' && <div className="text-[10px] font-bold text-green-600 uppercase mt-0.5">Par Nuitée</div>}
                                            </div>
                                            <button className="bg-[#0A1D37] hover:bg-blue-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-xl shadow-blue-50 transition-all hover:-translate-y-1">
                                                Voir l'offre
                                            </button>
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
        </>
    );
};

export default RealEstateCatalog;
