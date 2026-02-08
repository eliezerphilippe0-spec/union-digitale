/**
 * StoreBranding - Branding de boutique style Amazon
 * Nom personnalisé, logo, bannière, vidéo de présentation
 */

import React, { useState, useRef } from 'react';
import { 
    Store, Camera, Video, Image, Edit2, Check, X,
    Play, Pause, Volume2, VolumeX, Maximize,
    Upload, Trash2, Eye, Star, MapPin, Clock,
    Instagram, Facebook, Globe, Phone
} from 'lucide-react';

const StoreBranding = ({ store, isOwner = false, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    
    const [editData, setEditData] = useState({
        storeName: store?.storeName || '',
        slogan: store?.slogan || '',
        description: store?.description || '',
        logo: store?.logo || null,
        bannerImage: store?.bannerImage || null,
        bannerVideo: store?.bannerVideo || null,
        socialLinks: store?.socialLinks || {},
    });

    const handleVideoToggle = () => {
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    const handleSave = () => {
        onUpdate?.(editData);
        setIsEditing(false);
    };

    // Mock data if no store provided
    const displayStore = {
        storeName: store?.storeName || "TechStore Haiti",
        slogan: store?.slogan || "La technologie accessible à tous 🇭🇹",
        description: store?.description || "Votre partenaire tech depuis 2020. Produits authentiques, garantie locale, livraison rapide.",
        logo: store?.logo,
        bannerImage: store?.bannerImage,
        bannerVideo: store?.bannerVideo,
        rating: store?.rating || 4.8,
        reviewCount: store?.reviewCount || 1250,
        followers: store?.followers || 5400,
        location: store?.location || "Port-au-Prince",
        memberSince: store?.memberSince || "2020",
        responseTime: store?.responseTime || "< 1 heure",
        socialLinks: store?.socialLinks || {
            instagram: "techstore_ht",
            facebook: "techstorehaiti",
            website: "techstore.ht"
        },
        badges: store?.badges || ['top_seller', 'fast_shipper', 'verified'],
        ...editData,
    };

    return (
        <div className="relative">
            {/* Banner Section with Video Support */}
            <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-b-3xl">
                {/* Video Banner */}
                {displayStore.bannerVideo ? (
                    <div className="absolute inset-0">
                        <video
                            ref={videoRef}
                            src={displayStore.bannerVideo}
                            className="w-full h-full object-cover"
                            loop
                            muted={isMuted}
                            playsInline
                            poster={displayStore.bannerImage}
                        />
                        
                        {/* Video Controls */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <button
                                onClick={handleVideoToggle}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                ) : displayStore.bannerImage ? (
                    <img
                        src={displayStore.bannerImage}
                        alt="Store banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    /* Default Gradient Banner */
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Owner Edit Button */}
                {isOwner && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg text-white text-sm transition-colors">
                            <Image className="w-4 h-4" />
                            Changer bannière
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg text-white text-sm transition-colors">
                            <Video className="w-4 h-4" />
                            Ajouter vidéo
                        </button>
                    </div>
                )}

                {/* Store Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex items-end gap-6">
                        {/* Logo */}
                        <div className="relative">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white">
                                {displayStore.logo ? (
                                    <img src={displayStore.logo} alt={displayStore.storeName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Store className="w-12 h-12 text-white" />
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <button className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg">
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Store Name & Info */}
                        <div className="flex-1 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.storeName}
                                        onChange={(e) => setEditData({...editData, storeName: e.target.value})}
                                        className="text-2xl md:text-3xl font-bold bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white placeholder-white/50"
                                        placeholder="Nom de la boutique"
                                    />
                                ) : (
                                    <h1 className="text-2xl md:text-3xl font-bold">{displayStore.storeName}</h1>
                                )}
                                
                                {/* Badges */}
                                {displayStore.badges?.includes('verified') && (
                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Vérifié
                                    </span>
                                )}
                                {displayStore.badges?.includes('top_seller') && (
                                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        ⭐ Top Vendeur
                                    </span>
                                )}
                            </div>

                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.slogan}
                                    onChange={(e) => setEditData({...editData, slogan: e.target.value})}
                                    className="text-white/90 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 w-full max-w-md text-sm"
                                    placeholder="Votre slogan..."
                                />
                            ) : (
                                <p className="text-white/90 text-sm md:text-base">{displayStore.slogan}</p>
                            )}

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-semibold">{displayStore.rating}</span>
                                    <span className="text-white/70">({displayStore.reviewCount} avis)</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/70">
                                    <Eye className="w-4 h-4" />
                                    <span>{displayStore.followers?.toLocaleString()} abonnés</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/70">
                                    <MapPin className="w-4 h-4" />
                                    <span>{displayStore.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Edit/Save Buttons */}
                        {isOwner && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="p-3 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-3 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full text-white"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Store Details Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Description */}
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                                    rows={2}
                                    placeholder="Description de votre boutique..."
                                />
                            ) : (
                                <p className="text-gray-600 text-sm line-clamp-2">{displayStore.description}</p>
                            )}
                        </div>

                        {/* Quick Info Pills */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                Répond {displayStore.responseTime}
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                Membre depuis {displayStore.memberSince}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-2">
                            {displayStore.socialLinks?.instagram && (
                                <a href={`https://instagram.com/${displayStore.socialLinks.instagram}`} 
                                   target="_blank" rel="noopener noreferrer"
                                   className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Instagram className="w-5 h-5 text-pink-600" />
                                </a>
                            )}
                            {displayStore.socialLinks?.facebook && (
                                <a href={`https://facebook.com/${displayStore.socialLinks.facebook}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Facebook className="w-5 h-5 text-blue-600" />
                                </a>
                            )}
                            {displayStore.socialLinks?.website && (
                                <a href={`https://${displayStore.socialLinks.website}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Globe className="w-5 h-5 text-gray-600" />
                                </a>
                            )}
                            {displayStore.socialLinks?.phone && (
                                <a href={`tel:${displayStore.socialLinks.phone}`}
                                   className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </a>
                            )}
                        </div>

                        {/* Follow Button */}
                        {!isOwner && (
                            <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors">
                                + Suivre
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreBranding;
