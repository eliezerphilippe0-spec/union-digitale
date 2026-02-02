import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Gauge, Tag, DollarSign, User, Phone, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function CarDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);

    // Reservation State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reserving, setReserving] = useState(false);
    const [error, setError] = useState('');
    const [availabilityMessage, setAvailabilityMessage] = useState('');

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const docRef = doc(db, 'cars', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCar({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError('Annonce non trouvée.');
                }
            } catch (err) {
                setError('Erreur lors du chargement de l\'annonce.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCar();
    }, [id]);

    const checkAvailability = async (start, end) => {
        // Validate dates
        const startD = new Date(start);
        const endD = new Date(end);

        if (startD >= endD) {
            setAvailabilityMessage('La date de fin doit être après la date de début.');
            return false;
        }

        if (startD < new Date()) {
            setAvailabilityMessage('Les dates doivent être dans le futur.');
            return false;
        }

        // Check overlap in Firestore
        try {
            const q = query(
                collection(db, 'reservations'),
                where('carId', '==', id),
                where('status', 'in', ['pending', 'confirmed'])
                // Ideally we'd do range query here but Firestore range limits are tricky
                // Simpler: fetch all active reservations for this car and filter in memory for MVP
            );
            const snapshot = await getDocs(q);
            const reservations = snapshot.docs.map(d => d.data());

            const hasOverlap = reservations.some(res => {
                const resStart = res.startDate.toDate ? res.startDate.toDate() : new Date(res.startDate);
                const resEnd = res.endDate.toDate ? res.endDate.toDate() : new Date(res.endDate);
                return (startD < resEnd && endD > resStart);
            });

            if (hasOverlap) {
                setAvailabilityMessage('Ces dates sont déjà réservées.');
                return false;
            }

            setAvailabilityMessage('Dates disponibles !');
            return true;
        } catch (err) {
            console.error("Availability check failed", err);
            setAvailabilityMessage('Erreur de vérification.');
            return false;
        }
    };

    const handleReservation = async (e) => {
        e.preventDefault();
        setError('');

        if (!currentUser) {
            navigate(`/login?redirect=/cars/${id}`);
            return;
        }

        if (!startDate || !endDate) {
            setError("Veuillez sélectionner des dates.");
            return;
        }

        setReserving(true);
        const isAvailable = await checkAvailability(startDate, endDate);

        if (!isAvailable) {
            setReserving(false);
            return; // Message set by checkAvailability
        }

        try {
            const totalPrice = car.price * ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)); // Rough estimate

            await addDoc(collection(db, 'reservations'), {
                carId: id,
                renterId: currentUser.uid,
                ownerId: car.ownerId,
                startDate: new Date(startDate), // Store as proper timestamp/date
                endDate: new Date(endDate),
                status: 'pending',
                totalPrice,
                createdAt: serverTimestamp()
            });

            alert('Demande de réservation envoyée !');
            // Redirect to a "My Reservations" or checkout success page
            navigate('/account');

        } catch (err) {
            console.error(err);
            setError('Echec de la réservation: ' + err.message);
        } finally {
            setReserving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;
    if (!car) return <div className="p-10 text-center text-red-500">{error || 'Introuvable'}</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <SEO title={`${car.brand} ${car.model} | Union Auto`} description={`Louez ou achetez cette ${car.brand} ${car.model}`} />

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow overflow-hidden">
                            {/* Main Image */}
                            <div className="h-96 w-full bg-gray-200 relative">
                                {car.photos && car.photos.length > 0 ? (
                                    <img src={car.photos[0]} alt={car.model} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">Aucune image</div>
                                )}
                                <span className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-secondary text-sm uppercase">
                                    {car.type === 'sale' ? 'A Vendre' : 'Location'}
                                </span>
                            </div>
                            {/* Gallery (Thumbnails) */}
                            {car.photos && car.photos.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {car.photos.map((src, idx) => (
                                        <img key={idx} src={src} className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-100" />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{car.brand} {car.model} <span className="text-xl font-normal text-gray-500">({car.year})</span></h1>
                                    <div className="flex items-center text-gray-500 mt-1">
                                        <MapPin className="w-4 h-4 mr-1" /> {car.location || "Haïti"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-secondary">
                                        {car.currency} {car.price.toLocaleString()}
                                        {car.type === 'rent' && <span className="text-sm font-normal text-gray-500"> /jour</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b">
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded text-center">
                                    <Gauge className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="font-bold text-gray-700">{car.mileage} km</span>
                                    <span className="text-xs text-gray-500">Kilométrage</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded text-center">
                                    <Tag className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="font-bold text-gray-700">{car.type === 'sale' ? 'Vente' : 'Auto'}</span>
                                    <span className="text-xs text-gray-500">Transmission</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded text-center">
                                    {/* Placeholder for Fuel Type logic if added to form */}
                                    <DollarSign className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="font-bold text-gray-700">Gasoline</span>
                                    <span className="text-xs text-gray-500">Carburant</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-gray-50 rounded text-center">
                                    <User className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="font-bold text-gray-700">Proprio</span>
                                    <span className="text-xs text-gray-500">Vérifié</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {car.description || `Superbe ${car.brand} ${car.model} de ${car.year}. Parfaite condition, disponible immédiatement.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions / Booking */}
                    <div className="space-y-6">
                        {/* Contact Seller Card */}
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="font-bold text-gray-900 mb-4">Vendeur</h3>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold">Propriétaire</div>
                                    {/* <div className="text-sm text-gray-500">Membre depuis 2023</div> */}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition">
                                    <MessageCircle className="w-5 h-5" /> Contacter (WhatsApp)
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition">
                                    <Phone className="w-5 h-5" /> Afficher Numéro
                                </button>
                            </div>
                        </div>

                        {/* Booking Calendar Card (Only for Rent) */}
                        {car.type === 'rent' ? (
                            <div className="bg-white p-6 rounded-xl shadow border-t-4 border-secondary">
                                <h3 className="font-bold text-lg mb-4">Réserver ce véhicule</h3>
                                <form onSubmit={handleReservation} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full border rounded-md p-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full border rounded-md p-2"
                                            required
                                        />
                                    </div>

                                    {availabilityMessage && (
                                        <div className={`text-sm font-medium ${availabilityMessage.includes('disponibles') ? 'text-green-600' : 'text-red-500'}`}>
                                            {availabilityMessage}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={reserving}
                                            className="w-full bg-[#0A1D37] text-white font-bold py-3 rounded-lg hover:bg-[#1a3d6e] disabled:opacity-70 transition flex justify-center items-center gap-2"
                                        >
                                            {reserving ? 'Vérification...' : 'Demander la réservation'}
                                            {!reserving && <Calendar className="w-4 h-4" />}
                                        </button>
                                        <p className="text-xs text-center text-gray-400 mt-2">Aucun débit immédiat via ce formulaire.</p>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            /* Sale Interest Form */
                            <div className="bg-white p-6 rounded-xl shadow border-t-4 border-blue-500">
                                <h3 className="font-bold text-lg mb-2">Intéressé par l'achat ?</h3>
                                <p className="text-sm text-gray-600 mb-4">Envoyez une offre ou planifiez une inspection.</p>
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
                                    Faire une offre
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
