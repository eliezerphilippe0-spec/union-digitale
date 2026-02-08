import { useState, useEffect } from 'react';
import { Zap, Gift, Sparkles } from 'lucide-react';
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
            <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 min-w-[48px] text-center border border-white/30 shadow-lg">
                    <span className="text-xl font-bold font-mono tracking-wider text-white drop-shadow-lg">
                        {value < 10 ? `0${value}` : value}
                    </span>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 rounded-lg blur-md -z-10"></div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-white/80 mt-1 font-medium">{label}</span>
        </div>
    );

    return (
        <div className="relative overflow-hidden min-h-[56px]">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 animate-gradient-x"></div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-fast"></div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Sparkles className="absolute top-2 left-[10%] w-4 h-4 text-white/40 animate-float" style={{ animationDelay: '0s' }} />
                <Sparkles className="absolute top-3 left-[30%] w-3 h-3 text-yellow-300/50 animate-float" style={{ animationDelay: '1s' }} />
                <Gift className="absolute top-2 right-[20%] w-4 h-4 text-white/30 animate-float" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="absolute top-1 right-[40%] w-3 h-3 text-pink-200/40 animate-float" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 py-3 px-4 flex items-center justify-center gap-6 flex-wrap">
                {/* Flash icon with pulse */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                        <div className="absolute inset-0 bg-yellow-400 blur-md opacity-50 animate-ping"></div>
                    </div>
                    <span className="font-bold text-white uppercase tracking-widest text-sm drop-shadow-lg">
                        {t('flash_sale_label') || 'VENTE FLASH'}
                    </span>
                </div>

                {/* Separator */}
                <div className="hidden sm:block w-px h-8 bg-white/30"></div>

                {/* Countdown */}
                <div className="flex items-center gap-2">
                    <TimeBlock value={timeLeft.hours} label="hrs" />
                    <span className="text-white/60 text-xl font-bold animate-pulse">:</span>
                    <TimeBlock value={timeLeft.minutes} label="min" />
                    <span className="text-white/60 text-xl font-bold animate-pulse">:</span>
                    <TimeBlock value={timeLeft.seconds} label="sec" />
                </div>

                {/* Separator */}
                <div className="hidden md:block w-px h-8 bg-white/30"></div>

                {/* End message */}
                <div className="hidden md:flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Gift className="w-4 h-4" />
                    <span>{t('before_end') || 'avant la fin des promotions !'}</span>
                </div>
            </div>

            {/* Bottom glow line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </div>
    );
};

export default FlashSaleCountdown;
