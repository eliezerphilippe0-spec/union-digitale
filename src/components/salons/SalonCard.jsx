import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Clock } from 'lucide-react';

const SalonCard = ({ salon }) => {
    const {
        id,
        slug,
        shopName,
        shopLogo,
        shopBanner,
        rating = 0,
        reviewCount = 0,
        address = {},
        genderFocus = 'MIX',
        verified = false,
        serviceMode = 'IN_SHOP',
        distance = null
    } = salon;

    const genderLabels = {
        'H': 'Homme',
        'F': 'Femme',
        'MIX': 'Mixte'
    };

    return (
        <Link
            to={`/salons/${slug || id}`}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full"
        >
            {/* Banner/Image */}
            <div className="relative h-48 overflow-hidden">
                {shopBanner ? (
                    <img
                        src={shopBanner}
                        alt={shopName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center">
                        <MapPin className="text-white opacity-40" size={48} />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-indigo-600 shadow-sm">
                        {genderLabels[genderFocus]}
                    </span>
                    {serviceMode === 'HOME' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
                            À domicile
                        </span>
                    )}
                    {distance !== null && (
                        <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm">
                            {distance} km
                        </span>
                    )}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                    <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                    <span className="text-sm font-bold text-slate-800">{rating.toFixed(1)}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {shopName}
                    </h3>
                    {verified && <CheckCircle className="text-indigo-500 shrink-0" size={20} />}
                </div>

                <div className="flex items-center gap-2 text-slate-500 mb-4 text-sm font-medium">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="line-clamp-1">{address.city || 'Haïti'}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        <Clock size={14} />
                        <span>Dispo. aujourd'hui</span>
                    </div>
                    <span className="text-indigo-600 font-bold text-sm">Voir profil</span>
                </div>
            </div>
        </Link>
    );
};

export default SalonCard;
