import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Check, ChevronRight, Scissors, CreditCard, Loader2 } from 'lucide-react';
import { createSalonBooking } from '../../services/salonBookingService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

const BookingWizard = ({ salon, services, initialServiceId }) => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [selectedService, setSelectedService] = useState(
        services.find(s => s.id === initialServiceId) || null
    );
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);

    const steps = [
        { id: 1, label: 'Service', icon: Scissors },
        { id: 2, label: 'Date & Heure', icon: Calendar },
        { id: 3, label: 'Paiement', icon: CreditCard }
    ];

    const handleServiceSelect = (service) => {
        setSelectedService(service);
        setStep(2);
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setStep(3);
    };

    const handleConfirmBooking = async () => {
        if (!currentUser) {
            addToast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour réserver.', type: 'error' });
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const [hours, minutes] = selectedTime.split(':');
            const bookingDateTime = new Date(selectedDate);
            bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const bookingId = await createSalonBooking({
                salonId: salon.id,
                clientId: currentUser.uid,
                serviceId: selectedService.id,
                serviceName: selectedService.title,
                startAt: bookingDateTime,
                durationMin: selectedService.serviceDetails?.durationMin || 30,
                totalPrice: selectedService.price,
                paymentProvider: 'MONCASH'
            });

            addToast({ title: 'Réservation réussie !', description: 'Votre rendez-vous a été enregistré.', type: 'success' });
            navigate(`/checkout?bookingId=${bookingId}`); // Redirect to payment/checkout
        } catch (error) {
            addToast({ title: 'Erreur', description: error.message || 'Une erreur est survenue.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Mock time slots for demonstration
    const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
            {/* Step Indicator */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex justify-between items-center">
                <div className="flex gap-4">
                    {steps.map(s => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${step >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-300'}`}>
                                {step > s.id ? <Check size={18} /> : s.id}
                            </div>
                            <span className={`text-sm font-bold hidden sm:block ${step >= s.id ? 'text-slate-800' : 'text-slate-300'}`}>{s.label}</span>
                            {s.id < 3 && <ChevronRight size={14} className="text-slate-200 hidden sm:block" />}
                        </div>
                    ))}
                </div>

                {selectedService && (
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sélection actuelle</p>
                        <p className="font-black text-indigo-600 uppercase tracking-tighter">{selectedService.title}</p>
                    </div>
                )}
            </div>

            <div className="p-8 md:p-12">
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight">Choisissez un service</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${selectedService?.id === service.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-indigo-200 bg-white'}`}
                                >
                                    <div className="text-left">
                                        <p className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{service.title}</p>
                                        <p className="text-slate-500 font-medium">{service.serviceDetails?.durationMin || 30} min • <span className="text-indigo-600 font-bold">{service.price} HTG</span></p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${selectedService?.id === service.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-400'}`}>
                                        <ChevronRight size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-12 animate-in slide-in-from-right duration-300 text-center">
                        <div className="flex flex-col items-center">
                            <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight">Quand souhaitez-vous venir ?</h2>
                            {/* Simplified Date Picker for demonstration */}
                            <div className="flex gap-4 overflow-x-auto pb-6 w-full max-w-2xl scrollbar-hide">
                                {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + offset);
                                    const isActive = selectedDate.toDateString() === date.toDateString();
                                    return (
                                        <button
                                            key={offset}
                                            onClick={() => setSelectedDate(date)}
                                            className={`min-w-[5rem] p-4 rounded-3xl flex flex-col items-center gap-1 transition-all border-2 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xl font-black">{date.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => handleTimeSelect(time)}
                                    className={`py-4 rounded-2xl font-bold transition-all border-2 ${selectedTime === time ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'}`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-slate-600 text-sm underline underline-offset-4">
                            Retour aux services
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight text-center">Récapitulatif & Confirmation</h2>

                        <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Service</span>
                                <span className="font-black text-slate-800 uppercase">{selectedService?.title}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Date & Heure</span>
                                <span className="font-black text-slate-800 uppercase">
                                    {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {selectedTime}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase tracking-widest">Durée</span>
                                <span className="font-black text-slate-800 uppercase">{selectedService?.serviceDetails?.durationMin || 30} minutes</span>
                            </div>
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Total à payer</span>
                                <span className="text-2xl font-black text-indigo-600 tracking-tighter">{selectedService?.price} HTG</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleConfirmBooking}
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Confirmer la réservation'}
                            </button>

                            <button onClick={() => setStep(2)} className="w-full text-slate-400 font-bold hover:text-slate-600 py-2 transition-all text-sm uppercase tracking-widest">
                                Modifier la date/heure
                            </button>
                        </div>

                        <p className="text-center text-[10px] text-slate-400 font-medium px-8 italic">
                            En confirmant, vous acceptez les politiques d'annulation du salon et les conditions d'utilisation d'Union Digitale.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingWizard;
