import React from 'react';
import { Calendar, Clock, MapPin, MessageSquare, ExternalLink, ChevronRight, Scissors } from 'lucide-react';

const ClientBookingCard = ({ booking }) => {
    const {
        id,
        serviceName,
        startAt,
        durationMin,
        status,
        totalPrice,
        notes,
        salonId // In a real app, we'd fetch salon details or include them in the booking doc
    } = booking;

    const startDate = startAt.toDate();

    const statusColors = {
        'pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'completed': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
        'rejected': 'bg-red-100 text-red-700 border-red-200'
    };

    const statusLabels = {
        'pending': 'En attente',
        'confirmed': 'Confirmé',
        'completed': 'Terminé',
        'cancelled': 'Annulé',
        'rejected': 'Refusé'
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Date & Time Column */}
                <div className="flex items-center gap-4 md:border-r border-slate-50 md:pr-8">
                    <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 text-center min-w-[80px]">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                            {startDate.toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-black">{startDate.getDate()}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-slate-800 font-black text-lg">
                            <Clock size={16} className="text-slate-400" />
                            {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{durationMin} Minutes</p>
                    </div>
                </div>

                {/* Service Details Column */}
                <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[status] || statusColors.pending}`}>
                            {statusLabels[status] || status}
                        </span>
                        <span className="text-xs font-bold text-slate-300">#{id.substring(0, 8)}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors mb-1">
                        {serviceName}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm font-medium">
                        <div className="flex items-center gap-1">
                            <Scissors size={14} />
                            <span>Salon ID: {salonId?.substring(0, 8)}</span>
                        </div>
                        <div className="font-black text-indigo-600">{totalPrice} HTG</div>
                    </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-3">
                    <a
                        href={`https://wa.me/50931234567?text=Bonjour, je souhaite des informations sur ma réservation ${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Contacter par WhatsApp"
                    >
                        <MessageSquare size={20} />
                    </a>
                    <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {notes && (
                <div className="mt-6 pt-6 border-t border-dashed border-slate-100">
                    <p className="text-xs text-slate-400 font-medium italic">Note : {notes}</p>
                </div>
            )}
        </div>
    );
};

export default ClientBookingCard;
