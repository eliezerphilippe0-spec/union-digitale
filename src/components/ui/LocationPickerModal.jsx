import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, Navigation, MapPin, Loader2, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import useGeolocation from '../../hooks/useGeolocation';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to center map
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

// Component to handle map clicks/drags
const MapEvents = ({ onMove }) => {
    useMapEvents({
        dragend: (e) => {
            const center = e.target.getCenter();
            onMove([center.lat, center.lng]);
        },
        click: (e) => {
            onMove([e.latlng.lat, e.latlng.lng]);
        }
    });
    return null;
};

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialLocation }) => {
    const { t } = useLanguage();
    const { location: geoCoords, loading: geoLoading, getLocation } = useGeolocation();

    const defaultCenter = [18.5392, -72.3364]; // Port-au-Prince
    const [center, setCenter] = useState(initialLocation || defaultCenter);
    const [zoom, setZoom] = useState(13);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const searchTimeout = useRef(null);

    // Reverse Geocoding (Photon API - free / OSM based)
    const reverseGeocode = useCallback(async (lat, lng) => {
        setLoading(true);
        try {
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                const feature = data.features[0].properties;
                const parts = [
                    feature.name,
                    feature.street,
                    feature.district,
                    feature.city,
                    feature.country
                ].filter(Boolean);
                setAddress(parts.join(', ') || t('address_not_found'));
                return data.features[0];
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Search Autocomplete (Photon API)
    const handleSearch = async (query) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            // Bias results towards Haiti
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=18.5&lon=-72.3&limit=5`);
            const data = await res.json();
            setSearchResults(data.features || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    };

    const onSearchInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => handleSearch(val), 500);
    };

    const selectResult = (result) => {
        const [lng, lat] = result.geometry.coordinates;
        const newCoords = [lat, lng];
        setCenter(newCoords);
        setZoom(16);
        setSearchResults([]);
        setSearchQuery('');
        reverseGeocode(lat, lng);
    };

    const handleConfirm = () => {
        onConfirm({
            lat: center[0],
            lng: center[1],
            addressFormatted: address,
            timestamp: new Date().toISOString()
        });
        onClose();
    };

    useEffect(() => {
        if (isOpen && !address) {
            reverseGeocode(center[0], center[1]);
        }
    }, [isOpen, center, address, reverseGeocode]);

    useEffect(() => {
        if (geoCoords) {
            setCenter([geoCoords.lat, geoCoords.lng]);
            setZoom(16);
            reverseGeocode(geoCoords.lat, geoCoords.lng);
        }
    }, [geoCoords, reverseGeocode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between shrink-0 bg-white">
                    <h2 className="font-bold text-lg text-gray-800">{t('location_picker_title') || "Choisir un emplacement"}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search Bar Overlay */}
                <div className="relative px-4 py-3 bg-gray-50 border-b z-[1000]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={onSearchInputChange}
                            placeholder={t('search_place') || "Rechercher un lieu..."}
                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary animate-spin" />}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[1001] animate-in slide-in-from-top-2">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectResult(res)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
                                >
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800 line-clamp-1">{res.properties.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">
                                            {[res.properties.street, res.properties.city, res.properties.country].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map Area */}
                <div className="relative flex-1 h-[400px] sm:h-[450px]">
                    <MapContainer
                        center={center}
                        zoom={zoom}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={center} draggable={false} />
                        <ChangeView center={center} zoom={zoom} />
                        <MapEvents onMove={(coords) => {
                            setCenter(coords);
                            reverseGeocode(coords[0], coords[1]);
                        }} />
                    </MapContainer>

                    {/* Centered Overlay Pin (Visual feedback for draggable feel) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] pointer-events-none z-[800] mb-5">
                        <MapPin className="w-10 h-10 text-secondary drop-shadow-lg animate-bounce" />
                    </div>

                    {/* My Location FAB */}
                    <button
                        onClick={getLocation}
                        disabled={geoLoading}
                        className="absolute bottom-6 right-6 z-[800] bg-white p-3 rounded-full shadow-xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-secondary disabled:opacity-50"
                        title={t('my_position')}
                    >
                        {geoLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6 fill-current" />}
                    </button>
                </div>

                {/* Footer Info & CTA */}
                <div className="p-4 sm:p-6 bg-white border-t shrink-0">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="bg-secondary/10 p-2 rounded-lg mt-1 shrink-0">
                            <MapPin className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">
                                {loading ? "Recherche de l'adresse..." : "Emplacement sélectionné"}
                            </p>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                {loading ? "..." : address || "Prêt à être confirmé"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <Check className="w-5 h-5" />
                        {t('confirm_location') || "Confirmer cet emplacement"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LocationPickerModal;
