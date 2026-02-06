import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const BottomNav = () => {
    const location = useLocation();
    const { cartCount } = useCart();
    const { currentUser } = useAuth();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Accueil' },
        { path: '/catalog', icon: Search, label: 'Explorer' },
        { path: '/favorites', icon: Heart, label: 'Favoris' },
        { path: '/cart', icon: ShoppingCart, label: 'Panier', badge: cartCount },
        { path: currentUser ? '/account' : '/login', icon: User, label: 'Compte' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 lg:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                                active 
                                    ? 'text-gold-600 dark:text-gold-400' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${active ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                            {active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
