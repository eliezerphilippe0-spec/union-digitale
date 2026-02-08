/**
 * DeliveryEstimate - Inspiré Amazon/Mercado Libre
 * "Arrives tomorrow" - Estimation de livraison précise
 */

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Zap, CheckCircle, Calendar } from 'lucide-react';

const DeliveryEstimate = ({ 
    department = 'Ouest',
    hasUnionPlus = false,
    productType = 'physical',
    className = ""
}) => {
    const [selectedDepartment, setSelectedDepartment] = useState(department);
    const [showSelector, setShowSelector] = useState(false);

    const departments = [
        'Ouest', 'Nord', 'Nord-Est', 'Nord-Ouest', 'Artibonite',
        'Centre', 'Sud', 'Sud-Est', 'Grande-Anse', 'Nippes'
    ];

    // Delivery times by department (in days)
    const deliveryTimes = {
        'Ouest': { standard: 1, express: 0 }, // Same day possible
        'Nord': { standard: 3, express: 2 },
        'Nord-Est': { standard: 4, express: 3 },
        'Nord-Ouest': { standard: 4, express: 3 },
        'Artibonite': { standard: 2, express: 1 },
        'Centre': { standard: 3, express: 2 },
        'Sud': { standard: 3, express: 2 },
        'Sud-Est': { standard: 3, express: 2 },
        'Grande-Anse': { standard: 5, express: 4 },
        'Nippes': { standard: 4, express: 3 },
    };

    const getDeliveryDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('fr-HT', options);
    };

    const deliveryInfo = deliveryTimes[selectedDepartment] || deliveryTimes['Ouest'];
    const standardDate = getDeliveryDate(deliveryInfo.standard);
    const expressDate = getDeliveryDate(deliveryInfo.express);

    // Calculate hours remaining for same-day delivery
    const now = new Date();
    const cutoffHour = 14; // 2 PM cutoff
    const hoursRemaining = cutoffHour - now.getHours();
    const canGetToday = hoursRemaining > 0 && selectedDepartment === 'Ouest';

    if (productType === 'digital') {
        return (
            <div className={`bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-bold text-blue-900">Téléchargement immédiat</p>
                        <p className="text-sm text-blue-700">Disponible dès la confirmation du paiement</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
            {/* Location Selector */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <button
                    onClick={() => setShowSelector(!showSelector)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                    <MapPin className="w-4 h-4" />
                    <span>Livrer à <strong>{selectedDepartment}</strong></span>
                    <span className="text-gray-400">▼</span>
                </button>
                
                {showSelector && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                        {departments.map(dept => (
                            <button
                                key={dept}
                                onClick={() => { setSelectedDepartment(dept); setShowSelector(false); }}
                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedDepartment === dept
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Delivery Options */}
            <div className="p-4 space-y-3">
                {/* Express / Union Plus */}
                {(hasUnionPlus || canGetToday) && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                        <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-900">
                                    {canGetToday ? "Livraison Aujourd'hui" : `Livraison ${expressDate}`}
                                </span>
                                {hasUnionPlus && (
                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                        UNION PLUS
                                    </span>
                                )}
                            </div>
                            {canGetToday && (
                                <p className="text-sm text-amber-700 flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" />
                                    Commandez dans les {hoursRemaining}h pour recevoir aujourd'hui
                                </p>
                            )}
                            <p className="text-xs text-amber-600 mt-1">
                                Livraison express gratuite pour les membres Union Plus
                            </p>
                        </div>
                    </div>
                )}

                {/* Standard Delivery */}
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                            Livraison Standard: <span className="text-green-600">{standardDate}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            {deliveryInfo.standard === 1 ? 'Demain' : `${deliveryInfo.standard} jours ouvrables`}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                            ✓ GRATUIT dès 2,000 HTG d'achat
                        </p>
                    </div>
                </div>

                {/* Pickup Option */}
                <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                            Retrait en Point Relais
                        </p>
                        <p className="text-sm text-gray-600">
                            Disponible sous 24-48h · <span className="text-purple-600 font-medium">GRATUIT</span>
                        </p>
                        <button className="text-xs text-purple-600 hover:underline mt-1">
                            Voir les points de retrait →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryEstimate;
