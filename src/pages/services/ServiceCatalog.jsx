import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, MapPin, Filter, Star, Briefcase, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';

const CATEGORIES = [
    { id: 'all', label: 'Tous', icon: Briefcase },
    { id: 'beauty', label: 'Beauté', icon: '💅' },
    { id: 'home', label: 'Maison', icon: '🏠' },
    { id: 'education', label: 'Éducation', icon: '🎓' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'events', label: 'Événements', icon: '🎉' },
];

const ServiceCatalog = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { services, loading, fetchServices } = useServices();

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const filteredServices = services.filter(s => {
        const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.ownerName && s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header & Search */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        <span className="text-indigo-600">Union</span> Services
                    </h1>
                    <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                        Trouvez le professionnel idéal pour tous vos besoins, directement en Haïti.
                    </p>

                    <div className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Que cherchez-vous aujourd'hui ? (ex: Plombier, Coiffeur...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all
                                ${selectedCategory === cat.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
                            `}
                        >
                            <span className="text-lg">{typeof cat.icon === 'string' ? cat.icon : <cat.icon className="w-4 h-4" />}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Service Grid */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin w-10 h-10 text-indigo-600" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredServices.map(service => (
                            <div
                                key={service.id}
                                onClick={() => navigate(`/services/${service.id}`)}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group cursor-pointer"
                            >
                                {/* Image Placeholder */}
                                <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                                    <span className="text-6xl transform group-hover:scale-110 transition-transform duration-300">{service.image}</span>
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        {service.rating}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{service.title}</h3>
                                            <p className="text-sm text-gray-500">{service.provider}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                                        <MapPin className="w-3 h-3" /> {service.locationType === 'client_home' ? 'À domicile' : 'Sur place'}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="text-indigo-700 font-bold">
                                            {service.price.toLocaleString()} {service.currency}
                                            <span className="text-xs text-gray-400 font-normal ml-1">/ session</span>
                                        </div>
                                        <button className="bg-gray-900 text-white p-2 rounded-lg group-hover:bg-indigo-600 transition-colors">
                                            <Briefcase className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredServices.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Aucun service trouvé</h3>
                        <p className="text-gray-500">Essayez de modifier votre recherche ou vos filtres.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceCatalog;
