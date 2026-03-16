import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClientBookings } from '../../services/salonBookingService';
import ClientBookingCard from '../../components/bookings/ClientBookingCard';
import { Calendar, Search, Filter, Scissors, ChevronRight } from 'lucide-react';

const MyBookings = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadBookings();
    }, [currentUser]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await getClientBookings(currentUser.uid);
            setBookings(data);
        } catch (error) {
            console.error('Error loading my bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const upcomingBookings = bookings.filter(b => b.startAt.toDate() >= new Date());
    const pastBookings = bookings.filter(b => b.startAt.toDate() < new Date());

    const activeBookings = filter === 'upcoming' ? upcomingBookings : pastBookings;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Simple Branded Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2">Mes Rendez-vous</h1>
                        <p className="text-slate-400 font-medium">Gérez vos réservations de services et salons</p>
                    </div>

                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[1.5rem]">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            À venir ({upcomingBookings.length})
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Passés ({pastBookings.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white h-32 rounded-[2rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {activeBookings.length > 0 ? (
                            <div className="space-y-6">
                                {activeBookings.map(booking => (
                                    <ClientBookingCard key={booking.id} booking={booking} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                                    <Calendar size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">
                                    {filter === 'upcoming' ? 'Aucun rendez-vous prévu' : 'Historique vide'}
                                </h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto mb-10">
                                    {filter === 'upcoming'
                                        ? "Vous n'avez pas encore de réservations. Trouvez le coiffeur idéal dès maintenant !"
                                        : "Vous n'avez pas encore de rendez-vous passés."}
                                </p>
                                <button
                                    onClick={() => navigate('/salons')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <Scissors size={20} />
                                    Découvrir les salons
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
