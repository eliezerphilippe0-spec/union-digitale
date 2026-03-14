import { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const FlashSaleCountdown = () => {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState({
        hours: 4,
        minutes: 59,
        seconds: 59
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const TimeBlock = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white rounded-md px-2 py-1 min-w-[36px] text-center border border-red-700">
                <span className="text-lg font-bold font-mono text-red-600">
                    {value < 10 ? `0${value}` : value}
                </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white mt-1 font-bold">{label}</span>
        </div>
    );

    return (
        <div className="bg-red-600 border-b border-red-700">
            <div className="container mx-auto py-3 px-4 flex items-center justify-center sm:justify-between gap-4 flex-wrap">
                
                {/* Left Side: Title */}
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-white fill-white" />
                    <span className="font-bold text-white uppercase tracking-wide text-sm">
                        Ventes Flash du Jour
                    </span>
                    <span className="hidden sm:inline-block text-white text-xs ml-2 font-medium bg-red-700 px-2 py-0.5 rounded">Jusqu'à -50%</span>
                </div>

                {/* Right Side: Countdown */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1.5 text-white font-bold text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Se termine dans:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <TimeBlock value={timeLeft.hours} label="hrs" />
                        <span className="text-white text-lg font-bold pb-4">:</span>
                        <TimeBlock value={timeLeft.minutes} label="min" />
                        <span className="text-white text-lg font-bold pb-4">:</span>
                        <TimeBlock value={timeLeft.seconds} label="sec" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FlashSaleCountdown;
