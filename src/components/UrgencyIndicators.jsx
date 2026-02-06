import React, { useState, useEffect } from 'react';
import { Eye, Package, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

// Stock Warning Badge
export const StockWarning = ({ stock }) => {
    if (!stock || stock > 10) return null;

    const urgencyLevel = stock <= 3 ? 'critical' : stock <= 5 ? 'warning' : 'low';

    const styles = {
        critical: 'bg-red-50 border-red-200 text-red-700',
        warning: 'bg-orange-50 border-orange-200 text-orange-700',
        low: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${styles[urgencyLevel]} text-sm font-medium animate-pulse`}>
            {urgencyLevel === 'critical' ? (
                <AlertTriangle className="w-4 h-4" />
            ) : (
                <Package className="w-4 h-4" />
            )}
            <span>
                {stock <= 3 
                    ? `Plus que ${stock} en stock !` 
                    : `Stock limité: ${stock} restants`
                }
            </span>
        </div>
    );
};

// Live Viewers Count
export const LiveViewers = ({ productId }) => {
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        // Simulate live viewers (in production, connect to real-time service)
        const baseViewers = Math.floor(Math.random() * 15) + 3;
        setViewers(baseViewers);

        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return Math.max(2, Math.min(25, prev + change));
            });
        }, 5000 + Math.random() * 10000);

        return () => clearInterval(interval);
    }, [productId]);

    if (viewers < 3) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="relative">
                <Eye className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span>
                <span className="font-semibold text-gray-900 dark:text-white">{viewers}</span> personnes regardent
            </span>
        </div>
    );
};

// Recent Sales Counter
export const RecentSales = ({ count = 0, hours = 24 }) => {
    if (count < 5) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>
                <span className="font-bold">{count}+</span> vendus ces dernières {hours}h
            </span>
        </div>
    );
};

// Countdown Timer (for flash sales)
export const FlashSaleTimer = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endTime) - new Date();
            if (difference > 0) {
                return {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / (1000 * 60)) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return { hours: 0, minutes: 0, seconds: 0 };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-white">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Offre expire dans:</span>
            <div className="flex gap-1 font-mono font-bold">
                <span className="bg-white/20 px-2 py-1 rounded">
                    {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-1 rounded">
                    {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-1 rounded">
                    {String(timeLeft.seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};

// Combined Urgency Block
const UrgencyIndicators = ({ product }) => {
    return (
        <div className="space-y-3">
            <StockWarning stock={product.stock} />
            <LiveViewers productId={product.id} />
            <RecentSales count={product.recentSales} />
            {product.flashSaleEnd && <FlashSaleTimer endTime={product.flashSaleEnd} />}
        </div>
    );
};

export default UrgencyIndicators;
