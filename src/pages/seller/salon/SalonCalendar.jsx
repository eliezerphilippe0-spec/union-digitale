import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, CheckCircle, XCircle, Plus, Scissors } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getVendorByUserId } from '../../../services/vendorService';
import { getSalonBookingsForDate } from '../../../services/salonBookingService';
import { useToast } from '../../../components/ui/Toast';

const SalonCalendar = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [salon, setSalon] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadInitialData();
    }, [currentUser]);

    useEffect(() => {
        if (salon) {
            loadBookings();
        }
    }, [selectedDate, salon]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const vendorData = await getVendorByUserId(currentUser.uid);
            if (!vendorData || vendorData.category !== 'SALON') {
                navigate('/seller/onboarding');
                return;
            }
            setSalon(vendorData);
        } catch (error) {
            addToast({ title: 'Erreur', description: 'Impossible de charger vos données.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadBookings = async () => {
        try {
            const data = await getSalonBookingsForDate(salon.id, selectedDate);
            setBookings(data);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    };

    const nextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const prevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };

    if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold">Chargement de votre agenda...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Agenda Rendez-vous</h1>
                        <p className="text-slate-400 font-medium">Gérez votre temps et vos clients</p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <button onClick={prevDay} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 text-center min-w-[150px]">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
                            </p>
                            <p className="text-lg font-black text-slate-800">
                                {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                        <button onClick={nextDay} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Stats Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100">
                            <div className="flex items-center gap-1 mb-4 opacity-70">
                                <CalendarIcon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Aujourd'hui</span>
                            </div>
                            <p className="text-4xl font-black tracking-tighter mb-1">{bookings.length}</p>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-tight">Rendez-vous</p>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Disponibilité</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600">En salon</span>
                                    <div className="w-10 h-5 bg-indigo-100 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-indigo-600 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center opacity-40">
                                    <span className="text-xs font-bold text-slate-600">Domicile</span>
                                    <div className="w-10 h-5 bg-slate-200 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Bookings */}
                    <div className="md:col-span-3 space-y-4">
                        {bookings.length > 0 ? (
                            bookings.map(booking => (
                                <div key={booking.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-lg transition-all border-l-8 border-l-indigo-500">
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-xl font-black text-slate-800">{booking.startAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.durationMin} MIN</p>
                                    </div>

                                    <div className="h-10 w-[1px] bg-slate-100" />

                                    <div className="flex-grow">
                                        <h4 className="font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{booking.serviceName}</h4>
                                        <div className="flex items-center gap-4 text-slate-400 text-xs font-medium mt-1">
                                            <span className="flex items-center gap-1"><User size={14} /> client_{booking.clientId.substring(0, 5)}</span>
                                            <span className="font-bold text-indigo-400">{booking.totalPrice} HTG</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
                                            <CheckCircle size={20} />
                                        </button>
                                        <button className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                            <XCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <Clock size={48} className="mx-auto text-slate-100 mb-6" />
                                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Aucun RDV pour ce jour</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto">Profitez de ce temps libre ou activez des promotions !</p>
                                <button className="mt-8 bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                    Ajouter un RDV manuel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalonCalendar;
