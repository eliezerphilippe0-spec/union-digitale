/**
 * AddressAutocomplete - P3 Fix
 * Suggestions d'adresses communes en Haïti
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

// Communes populaires en Haïti par département
const HAITI_ADDRESSES = {
    'Ouest': [
        'Pétion-Ville, Rue Faubert',
        'Delmas 33',
        'Delmas 75',
        'Carrefour, Route Nationale',
        'Tabarre',
        'Cité Soleil',
        'Croix-des-Bouquets',
        'Kenscoff',
        'Port-au-Prince, Centre-ville',
        'Port-au-Prince, Bois Verna',
        'Port-au-Prince, Turgeau',
    ],
    'Nord': [
        'Cap-Haïtien, Centre-ville',
        'Cap-Haïtien, Carénage',
        'Limonade',
        'Quartier Morin',
        'Milot',
    ],
    'Artibonite': [
        'Gonaïves, Centre-ville',
        'Saint-Marc',
        'Dessalines',
    ],
    'Sud': [
        'Les Cayes, Centre-ville',
        'Camp-Perrin',
        'Aquin',
    ],
    'Nord-Est': [
        'Fort-Liberté',
        'Ouanaminthe',
    ],
    'Centre': [
        'Hinche',
        'Mirebalais',
    ],
};

const AddressAutocomplete = ({ 
    value, 
    onChange, 
    department = 'Ouest',
    placeholder = "Entrez votre adresse...",
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const wrapperRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);

        if (val.length >= 2) {
            const allAddresses = HAITI_ADDRESSES[department] || HAITI_ADDRESSES['Ouest'];
            const filtered = allAddresses.filter(addr => 
                addr.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 5));
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (address) => {
        setInputValue(address);
        onChange(address);
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        if (inputValue.length < 2) {
            // Show popular suggestions
            const popular = (HAITI_ADDRESSES[department] || HAITI_ADDRESSES['Ouest']).slice(0, 5);
            setSuggestions(popular);
            setShowSuggestions(true);
        }
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={() => { setInputValue(''); onChange(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">
                            📍 Suggestions pour {department}
                        </span>
                    </div>
                    {suggestions.map((addr, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelect(addr)}
                            className="w-full px-4 py-3 text-left hover:bg-gold-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{addr}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressAutocomplete;
