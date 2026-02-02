import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealEstate } from '../../hooks/useRealEstate';
import { MapPin, User, Check, Shield } from 'lucide-react';
import BookingCalendar from '../../components/services/BookingCalendar';

const RealEstateDetails = () => {
    const { id } = useParams();
    const { getListingById } = useRealEstate();
    const [listing, setListing] = useState(null);
    const [bookingSlot, setBookingSlot] = useState(null);

    useEffect(() => {
        getListingById(id).then(setListing);
    }, [id]);

    if (!listing) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

    const isRental = listing.type === 'rental';

    return (
        <div className="bg-white min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT: IMAGES & INFO */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image */}
                        <div className="h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-6xl">
                            {listing.type === 'land' ? '🏞️' : isRental ? '🏨' : '🏡'}
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                            <div className="flex items-center gap-2 text-gray-500 mb-6">
                                <MapPin className="w-5 h-5" /> {listing.location}
                            </div>

                            <div className="prose max-w-none text-gray-600">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                                <p>{listing.description}</p>
                            </div>

                            {/* Features */}
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <span className="block text-xs text-gray-500 uppercase">Surface</span>
                                    <span className="font-bold text-lg">{listing.surface} m²</span>
                                </div>
                                {listing.rooms && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <span className="block text-xs text-gray-500 uppercase">Chambres</span>
                                        <span className="font-bold text-lg">{listing.rooms}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: ACTION CARD */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                            <div className="mb-6">
                                <span className="text-sm text-gray-500">{isRental ? 'Prix par nuit' : 'Prix total'}</span>
                                <div className="text-3xl font-bold text-secondary">
                                    {listing.price.toLocaleString()} {listing.currency}
                                </div>
                            </div>

                            {/* OWNER INFO */}
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{listing.ownerName || 'Agence'}</p>
                                    <p className="text-xs text-green-600 flex items-center gap-1"><Shield className="w-3 h-3" /> Vérifié</p>
                                </div>
                            </div>

                            {isRental ? (
                                <>
                                    <h3 className="font-bold mb-4">Dates disponibles</h3>
                                    <BookingCalendar onSlotSelect={setBookingSlot} />
                                    <button disabled={!bookingSlot} className={`w-full py-3 mt-4 rounded-lg font-bold text-white transition-all ${bookingSlot ? 'bg-secondary hover:bg-orange-600' : 'bg-gray-300'}`}>
                                        {bookingSlot ? 'Réserver' : 'Sélectionnez une date'}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600 mb-4">Ce bien vous intéresse ? Contactez le vendeur pour organiser une visite ou faire une offre.</p>
                                    <button className="w-full py-3 bg-secondary text-white rounded-lg font-bold hover:bg-orange-600">Contacter le vendeur</button>
                                    <button className="w-full py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50">Faire une offre</button>
                                </div>
                            )}

                            <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>Garantie Union Digitale : Fonds séquestrés jusqu'à la validation de la transaction.</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RealEstateDetails;
