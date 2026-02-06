/**
 * Pickup Points - Click & Collect Locations
 * Inspired by: Amazon Locker, Jumia Pickup Stations, Mercado Libre Puntos
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Check, Search, Filter, Star, Package } from 'lucide-react';

// Mock pickup points data (in production, fetch from API based on location)
const PICKUP_POINTS = [
    {
        id: 'pp_1',
        name: 'Union Point - Pétion-Ville',
        type: 'union_store',
        address: '45 Rue Geffrard, Pétion-Ville',
        city: 'Pétion-Ville',
        department: 'Ouest',
        coordinates: { lat: 18.5125, lng: -72.2866 },
        hours: '8h - 20h, Lun-Sam',
        distance: 0.8,
        rating: 4.8,
        reviews: 124,
        amenities: ['parking', 'wifi', 'ac'],
        available: true,
        estimatedPickup: '24h',
    },
    {
        id: 'pp_2',
        name: 'Pharmacie Nationale - Delmas',
        type: 'partner',
        address: '123 Route de Delmas, Delmas 33',
        city: 'Delmas',
        department: 'Ouest',
        coordinates: { lat: 18.5458, lng: -72.3108 },
        hours: '7h - 22h, Tous les jours',
        distance: 2.3,
        rating: 4.5,
        reviews: 89,
        amenities: ['parking'],
        available: true,
        estimatedPickup: '24-48h',
    },
    {
        id: 'pp_3',
        name: 'Supermarché Giant - Carrefour',
        type: 'partner',
        address: '78 Route de Carrefour',
        city: 'Carrefour',
        department: 'Ouest',
        coordinates: { lat: 18.5353, lng: -72.4106 },
        hours: '8h - 21h, Lun-Sam',
        distance: 5.1,
        rating: 4.2,
        reviews: 56,
        amenities: ['parking', 'ac'],
        available: true,
        estimatedPickup: '48h',
    },
    {
        id: 'pp_4',
        name: 'Union Locker - Centre-ville',
        type: 'locker',
        address: 'Place Geffrard, Port-au-Prince',
        city: 'Port-au-Prince',
        department: 'Ouest',
        coordinates: { lat: 18.5392, lng: -72.3390 },
        hours: '24h/24, 7j/7',
        distance: 1.5,
        rating: 4.9,
        reviews: 201,
        amenities: ['24h', 'secure'],
        available: true,
        estimatedPickup: '24h',
    },
    {
        id: 'pp_5',
        name: 'Station Texaco - Tabarre',
        type: 'partner',
        address: 'Route de Tabarre',
        city: 'Tabarre',
        department: 'Ouest',
        coordinates: { lat: 18.5794, lng: -72.2736 },
        hours: '6h - 22h, Tous les jours',
        distance: 4.2,
        rating: 4.0,
        reviews: 34,
        amenities: ['parking', '24h'],
        available: false,
        estimatedPickup: '48-72h',
    },
];

const POINT_TYPES = {
    union_store: { label: 'Union Store', color: 'bg-gold-500', icon: '🏪' },
    partner: { label: 'Partenaire', color: 'bg-blue-500', icon: '🤝' },
    locker: { label: 'Casier 24h', color: 'bg-green-500', icon: '📦' },
};

const AMENITY_ICONS = {
    parking: '🅿️',
    wifi: '📶',
    ac: '❄️',
    '24h': '🕐',
    secure: '🔒',
};

const PickupPoints = ({ onSelect, selectedPoint, showMap = true }) => {
    const [points, setPoints] = useState(PICKUP_POINTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('distance');

    // Filter and sort points
    const filteredPoints = points
        .filter(point => {
            const matchesSearch = point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                point.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                point.city.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || point.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === 'distance') return a.distance - b.distance;
            if (sortBy === 'rating') return b.rating - a.rating;
            return 0;
        });

    const handleSelect = (point) => {
        if (!point.available) return;
        onSelect?.(point);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold-500" />
                    Points de Retrait
                </h3>
                <p className="text-sm text-gray-500 mt-1">Récupérez votre commande près de chez vous</p>
            </div>

            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par ville ou adresse..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'Tous' },
                        { key: 'union_store', label: '🏪 Union Store' },
                        { key: 'locker', label: '📦 Casiers' },
                        { key: 'partner', label: '🤝 Partenaires' },
                    ].map(filter => (
                        <button
                            key={filter.key}
                            onClick={() => setFilterType(filter.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                filterType === filter.key
                                    ? 'bg-gold-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Map Placeholder */}
            {showMap && (
                <div className="h-48 bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Carte interactive</p>
                        </div>
                    </div>
                    {/* Map pins would go here with Leaflet/Google Maps */}
                    {filteredPoints.slice(0, 5).map((point, index) => (
                        <div
                            key={point.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${20 + index * 15}%`,
                                top: `${30 + (index % 3) * 20}%`,
                            }}
                        >
                            <div className={`w-8 h-8 ${POINT_TYPES[point.type].color} rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform`}>
                                {POINT_TYPES[point.type].icon}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Points List */}
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {filteredPoints.map(point => (
                    <button
                        key={point.id}
                        onClick={() => handleSelect(point)}
                        disabled={!point.available}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex gap-4 ${
                            !point.available ? 'opacity-50 cursor-not-allowed' : ''
                        } ${selectedPoint?.id === point.id ? 'bg-gold-50 border-l-4 border-gold-500' : ''}`}
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 ${POINT_TYPES[point.type].color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                            {POINT_TYPES[point.type].icon}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="font-semibold text-gray-900 truncate">{point.name}</h4>
                                    <p className="text-sm text-gray-500 truncate">{point.address}</p>
                                </div>
                                {selectedPoint?.id === point.id && (
                                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                <span className="flex items-center gap-1 text-gray-600">
                                    <Navigation className="w-3 h-3" />
                                    {point.distance} km
                                </span>
                                <span className="flex items-center gap-1 text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    {point.hours}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-600">
                                    <Star className="w-3 h-3 fill-current" />
                                    {point.rating} ({point.reviews})
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                {point.amenities.map(amenity => (
                                    <span key={amenity} className="text-sm" title={amenity}>
                                        {AMENITY_ICONS[amenity]}
                                    </span>
                                ))}
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                                    point.available 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {point.available ? `Dispo. ${point.estimatedPickup}` : 'Indisponible'}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Empty State */}
            {filteredPoints.length === 0 && (
                <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun point de retrait trouvé</p>
                    <p className="text-sm text-gray-400">Essayez une autre recherche</p>
                </div>
            )}

            {/* Benefits Banner */}
            <div className="p-4 bg-gradient-to-r from-gold-50 to-amber-50 border-t border-gold-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center text-white">
                        💰
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Économisez sur la livraison!</p>
                        <p className="text-sm text-gray-600">Retrait gratuit dans tous les points Union</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PickupPoints;
