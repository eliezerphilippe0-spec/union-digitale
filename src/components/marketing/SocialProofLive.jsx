import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin } from 'lucide-react';

// Sample Haitian names and cities for realistic social proof
const firstNames = [
    'Jean', 'Marie', 'Pierre', 'Joseph', 'Rose', 'Frantz', 'Claudette', 'Michel',
    'Carline', 'Emmanuel', 'Guerline', 'Patrick', 'Yolande', 'Rony', 'Martine',
    'Stanley', 'Widline', 'Robenson', 'Natacha', 'Dieudonne'
];

const cities = [
    'Port-au-Prince', 'Pétion-Ville', 'Delmas', 'Cap-Haïtien', 'Gonaïves',
    'Les Cayes', 'Jacmel', 'Carrefour', 'Port-de-Paix', 'Saint-Marc'
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomMinutes = () => Math.floor(Math.random() * 30) + 1;

const SocialProofLive = ({ products = [] }) => {
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (products.length === 0) return;

        const showNotification = () => {
            const product = getRandomItem(products);
            const name = getRandomItem(firstNames);
            const city = getRandomItem(cities);
            const minutes = getRandomMinutes();

            setNotification({
                name,
                city,
                product: product.title,
                productId: product.id,
                minutes,
                image: product.image
            });
            setIsVisible(true);

            // Hide after 5 seconds
            setTimeout(() => {
                setIsVisible(false);
            }, 5000);
        };

        // Show first notification after 10-20 seconds
        const initialDelay = Math.random() * 10000 + 10000;
        const initialTimer = setTimeout(showNotification, initialDelay);

        // Then show every 30-60 seconds
        const interval = setInterval(() => {
            showNotification();
        }, Math.random() * 30000 + 30000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [products]);

    if (!notification || !isVisible) return null;

    return (
        <div 
            className={`fixed bottom-20 left-4 z-40 max-w-xs transition-all duration-500 ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
            }`}
        >
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 p-3 flex gap-3">
                {/* Product Image */}
                <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {notification.image && (notification.image.startsWith('http') || notification.image.startsWith('/')) ? (
                        <img src={notification.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                        <span className="font-bold">{notification.name}</span> vient d'acheter
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {notification.product}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {notification.city} • il y a {notification.minutes} min
                    </p>
                </div>

                {/* Close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 dark:bg-neutral-600 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 text-xs"
                >
                    ✕
                </button>
            </div>

            {/* Pulse animation */}
            <div className="absolute -bottom-1 left-4 flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En direct
            </div>
        </div>
    );
};

export default SocialProofLive;
