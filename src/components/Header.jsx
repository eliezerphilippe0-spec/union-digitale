/**
 * Header Component - Union Digitale
 * With Haiti branding and improved UX
 */

import React from 'react';
import { Search, ShoppingCart, Globe, Heart, Moon, Sun, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import CatalogMenu from './nav/CatalogMenu';

const Header = () => {
    const { currentUser, logout } = useAuth();
    const { cartCount } = useCart();
    const { language, setLanguage, t } = useLanguage();
    const { toggleTheme, isDark } = useTheme();

    const languages = [
        { code: 'fr', label: '🇫🇷 Français' },
        { code: 'ht', label: '🇭🇹 Kreyòl' },
        { code: 'en', label: '🇺🇸 English' },
        { code: 'es', label: '🇪🇸 Español' }
    ];

    return (
        <header className="bg-primary-800 text-white sticky top-0 z-50">
            {/* Top Announcement Bar */}
            <div className="bg-gold-500 text-primary-900 py-1.5 px-4 text-center text-sm font-medium">
                <span className="hidden sm:inline">🚚 Livraison GRATUITE dès 2,000 HTG • </span>
                <span>🇭🇹 La Marketplace #1 en Haïti</span>
                <span className="hidden md:inline"> • ✅ Paiement MonCash & NatCash</span>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Logo & Mobile Menu */}
                <div className="flex items-center gap-3">
                    <CatalogMenu />
                    <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <span className="text-2xl">🇭🇹</span>
                        <span className="text-xl md:text-2xl font-bold tracking-tight">
                            Union<span className="text-gold-400">Digitale</span>
                        </span>
                    </Link>
                </div>

                {/* Search Bar (Desktop) */}
                <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
                    <div className="flex w-full rounded-lg overflow-hidden bg-white shadow-lg">
                        <div className="bg-gray-100 px-3 py-2.5 text-gray-600 text-sm border-r border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors font-medium">
                            Catégories ▾
                        </div>
                        <input
                            type="text"
                            className="flex-1 px-4 py-2.5 text-gray-900 outline-none text-sm"
                            placeholder="Rechercher des produits, marques, vendeurs..."
                        />
                        <button 
                            className="bg-gold-500 hover:bg-gold-400 px-5 flex items-center justify-center transition-colors"
                            aria-label="Rechercher"
                        >
                            <Search className="w-5 h-5 text-primary-900" />
                        </button>
                    </div>
                </div>

                {/* Right Navigation */}
                <div className="flex items-center gap-2 md:gap-4 text-sm">
                    {/* Location - Haiti Focus */}
                    <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
                        <MapPin className="w-4 h-4 text-gold-400" />
                        <div>
                            <div className="text-[10px] text-gray-300">Livraison à</div>
                            <div className="font-bold text-xs">🇭🇹 Haïti</div>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="relative group cursor-pointer hidden md:flex items-center gap-1 hover:bg-white/10 p-2 rounded transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="font-bold uppercase text-xs">{language}</span>
                        <div className="absolute top-full right-0 pt-2 w-36 hidden group-hover:block z-50">
                            <div className="bg-white rounded-lg shadow-xl py-1 text-gray-800 border border-gray-100">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                            language === lang.code ? 'font-bold text-primary-600 bg-primary-50' : ''
                                        }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dark Mode */}
                    <button
                        onClick={toggleTheme}
                        className="hidden md:flex items-center p-2 rounded hover:bg-white/10 transition-colors"
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-gold-400" />
                        ) : (
                            <Moon className="w-5 h-5 text-gold-400" />
                        )}
                    </button>

                    {/* Account */}
                    {currentUser ? (
                        <div className="hidden lg:block cursor-pointer hover:bg-white/10 p-2 rounded group relative transition-colors">
                            <div className="text-[10px] text-gold-300">Bonjour, {currentUser.displayName?.split(' ')[0] || 'Client'}</div>
                            <div className="font-bold text-xs">Mon Compte ▾</div>
                            <div className="absolute top-full right-0 pt-2 w-48 hidden group-hover:block z-50">
                                <div className="bg-white rounded-lg shadow-xl py-1 text-gray-800 border border-gray-100">
                                    <Link to="/wallet" className="block px-4 py-2 hover:bg-gray-50 font-bold text-primary-600">
                                        💰 Mon Portefeuille
                                    </Link>
                                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-50">
                                        📦 Mes Commandes
                                    </Link>
                                    <Link to="/favorites" className="block px-4 py-2 hover:bg-gray-50">
                                        ❤️ Mes Favoris
                                    </Link>
                                    <hr className="my-1" />
                                    <button 
                                        onClick={logout} 
                                        className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link 
                            to="/login" 
                            className="hidden lg:block cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                        >
                            <div className="text-[10px] text-gold-300">Bonjour</div>
                            <div className="font-bold text-xs">Connexion ▾</div>
                        </Link>
                    )}

                    {/* Favorites */}
                    <Link 
                        to="/favorites" 
                        className="hidden lg:flex p-2 rounded hover:bg-white/10 transition-colors relative"
                        aria-label="Mes favoris"
                    >
                        <Heart className="w-6 h-6" />
                    </Link>

                    {/* Cart - Always Visible */}
                    <Link 
                        to="/cart" 
                        className="flex items-center gap-1 p-2 rounded hover:bg-white/10 transition-colors relative"
                        aria-label={`Panier avec ${cartCount} articles`}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-7 h-7" />
                            <span className="absolute -top-2 -right-2 bg-gold-500 text-primary-900 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                                {cartCount}
                            </span>
                        </div>
                        <span className="font-bold hidden lg:block text-sm">Panier</span>
                    </Link>
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="lg:hidden px-4 pb-3">
                <div className="flex w-full rounded-lg overflow-hidden bg-white shadow">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2.5 text-gray-900 outline-none text-sm"
                        placeholder="Rechercher..."
                    />
                    <button 
                        className="bg-gold-500 hover:bg-gold-400 px-4 flex items-center justify-center"
                        aria-label="Rechercher"
                    >
                        <Search className="w-5 h-5 text-primary-900" />
                    </button>
                </div>
            </div>

            {/* Category Navigation Bar */}
            <CatalogMenu variant="nav-bar" />
        </header>
    );
};

export default Header;
