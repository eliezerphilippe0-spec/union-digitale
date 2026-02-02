import React from 'react';
import { Search, ShoppingCart, Globe, Heart, Moon, Sun } from 'lucide-react';
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
        { code: 'fr', label: '🇫🇷 FR' },
        { code: 'ht', label: '🇭🇹 HT' },
        { code: 'en', label: '🇺🇸 EN' },
        { code: 'es', label: '🇪🇸 ES' }
    ];

    return (
        <header className="bg-primary-800 text-white sticky top-0 z-50">
            {/* Top Bar */}
            <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
                {/* Logo & Mobile Menu */}
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Button - handled by CatalogMenu */}
                    <CatalogMenu />
                    <Link to="/" className="text-2xl font-bold tracking-tight hover:text-gray-200">
                        Union<span className="text-secondary">Digitale</span>
                    </Link>
                </div>

                {/* Search Bar (Hidden on mobile, visible on lg) */}
                <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
                    <div className="flex w-full rounded-md overflow-hidden bg-white">
                        <div className="bg-gray-100 px-3 py-2 text-gray-600 text-sm border-r border-gray-300 cursor-pointer hover:bg-gray-200">
                            {t('all_catalog')}
                        </div>
                        <input
                            type="text"
                            className="flex-1 px-4 py-2 text-gray-900 outline-none"
                            placeholder={t('search_placeholder')}
                        />
                        <button className="bg-secondary hover:bg-secondary-hover px-4 flex items-center justify-center transition-colors" aria-label="Rechercher des produits">
                            <Search className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Right Navigation */}
                <div className="flex items-center gap-4 text-sm">
                    {/* Language Switcher - Hidden on mobile */}
                    <div className="relative group cursor-pointer hidden md:flex items-center gap-1 hover:outline outline-1 outline-white p-1 rounded">
                        <Globe className="w-4 h-4" />
                        <span className="font-bold uppercase">{language}</span>
                        <div className="absolute top-full right-0 pt-2 w-32 hidden group-hover:block z-50">
                            <div className="bg-white rounded-md shadow-lg py-1 text-gray-800 border border-gray-200">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${language === lang.code ? 'font-bold text-secondary' : ''}`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dark Mode Toggle - Hidden on mobile */}
                    <button
                        onClick={toggleTheme}
                        className="hidden md:flex items-center gap-1 hover:outline outline-1 outline-white p-1.5 rounded transition-all hover:bg-white/10"
                        aria-label="Toggle dark mode"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-gold-400 transition-transform hover:rotate-180 duration-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-gold-400 transition-transform hover:-rotate-12 duration-300" />
                        )}
                    </button>

                    {/* Account */}
                    {currentUser ? (
                        <div className="hidden lg:block cursor-pointer hover:outline outline-1 outline-white p-1 rounded group relative">
                            <div className="text-xs text-gold-300">{t('hello')}, {currentUser.displayName || 'Client'}</div>
                            <div className="font-bold leading-none text-white">{t('my_account')}</div>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 pt-2 w-48 hidden group-hover:block z-50">
                                <div className="bg-white rounded-md shadow-lg py-1 text-gray-800 border border-gray-200">
                                    <Link to="/wallet" className="block px-4 py-2 hover:bg-gray-100 font-bold text-secondary">{t('my_wallet')}</Link>
                                    <Link to="/library" className="block px-4 py-2 hover:bg-gray-100">{t('my_library')}</Link>
                                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">{t('my_orders')}</Link>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">{t('logout')}</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="hidden lg:block cursor-pointer hover:outline outline-1 outline-white p-1 rounded">
                            <div className="text-xs text-gold-300">{t('hello')}, identifiez-vous</div>
                            <div className="font-bold leading-none text-white">{t('account_lists')}</div>
                        </Link>
                    )}

                    {/* Orders */}
                    <Link to="/orders" className="hidden lg:block cursor-pointer hover:outline outline-1 outline-white p-1 rounded">
                        <div className="text-xs text-gold-300">{t('returns_orders').split(' ')[0]}</div>
                        <div className="font-bold leading-none text-white">{t('returns_orders').split(' ').slice(1).join(' ')}</div>
                    </Link>

                    {/* Favorites */}
                    <Link to="/favorites" className="hidden lg:flex flex-col justify-center cursor-pointer hover:outline outline-1 outline-white p-1 rounded relative" aria-label="Mes favoris">
                        <div className="relative">
                            <Heart className="w-6 h-6" />
                        </div>
                    </Link>

                    {/* Cart */}
                    <Link to="/cart" className="flex items-end gap-1 cursor-pointer hover:outline outline-1 outline-white p-1 rounded relative" aria-label={`Panier d'achat avec ${cartCount} articles`}>
                        <div className="relative">
                            <ShoppingCart className="w-8 h-8 text-white" />
                            <span className="absolute -top-1 -right-1 bg-gold-500 text-primary-900 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                                {cartCount}
                            </span>
                        </div>
                        <span className="font-bold hidden lg:block text-white">{t('cart')}</span>
                    </Link>
                </div>
            </div>

            {/* Mobile Search Bar (Visible only on mobile) */}
            <div className="lg:hidden px-4 pb-3">
                <div className="flex w-full rounded-md overflow-hidden bg-white">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2 text-gray-900 outline-none"
                        placeholder={t('search_placeholder')}
                    />
                    <button className="bg-secondary hover:bg-secondary-hover px-4 flex items-center justify-center" aria-label="Rechercher des produits">
                        <Search className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Secondary Navigation Bar */}
            <CatalogMenu variant="nav-bar" />
        </header>
    );
};

export default Header;
