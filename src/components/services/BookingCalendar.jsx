import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const BookingCalendar = ({ onSlotSelect }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);

    // Helper to get next 7 days
    const getNextDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    // Helper to generate slots (Simplified: 9am-5pm)
    const generateSlots = () => {
        return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(date);
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        if (onSlotSelect) {
            onSlotSelect({ date: selectedDate, time });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Choisir un créneau</h3>

            {/* Date Picker (Horizontal Scroll) */}
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-2 rounded-lg">
                <button className="p-1 hover:bg-white rounded-full shadow-sm">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2">
                    {getNextDays().map((day, idx) => {
                        const isSelected = day.toDateString() === selectedDate.toDateString();
                        return (
                            <button
                                key={idx}
                                onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                                className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl transition-all shrink-0
                                    ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200'}
                                `}
                            >
                                <span className="text-xs font-medium uppercase">{formatDate(day).split(' ')[0]}</span>
                                <span className="text-lg font-bold">{day.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
                <button className="p-1 hover:bg-white rounded-full shadow-sm">
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {generateSlots().map((time, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleTimeSelect(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1
                            ${selectedTime === time
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'}
                        `}
                    >
                        <Clock className="w-3 h-3" /> {time}
                    </button>
                ))}
            </div>

            {/* Summary */}
            {selectedTime && (
                <div className="mt-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-gray-500 mb-1">Date sélectionnée :</p>
                    <p className="font-bold text-indigo-900 flex items-center gap-2">
                        {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)} à {selectedTime}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookingCalendar;
