import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import TrustpilotWidget from './ui/TrustpilotWidget';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-gradient-to-b from-primary-900 to-primary-950 text-white mt-auto">
            <div className="bg-gradient-to-r from-primary-800 to-primary-700 hover:from-primary-700 hover:to-primary-600 transition-all py-4 text-center cursor-pointer shadow-lg border-t-2 border-gold-500/30" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span className="font-bold text-white flex items-center justify-center gap-2">
                    <span className="text-gold-400">↑</span>
                    {t('back_to_top') || 'Retour en haut'}
                </span>
            </div>

            <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
                <div>
                    <h3 className="font-bold mb-4 text-lg text-gold-400">
                        {t('get_to_know_us') || 'Mieux nous connaître'}
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <Link to="/about-us" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('about_us') || 'À propos d\'Union Digitale'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/careers" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('careers') || 'Carrières'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/sustainability" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('sustainability') || 'Durabilité'}
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold mb-4 text-lg text-gold-400">
                        {t('make_money') || 'Gagnez de l\'argent avec nous'}
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <Link to="/sell-on-union" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('sell_on_union') || 'Vendez sur Union Digitale'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/sell-business" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('sell_business') || 'Vendez sur Union Digitale Business'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/ambassador" className="text-gold-300 hover:text-gold-200 transition-colors font-bold">
                                {t('ambassador_program') || 'Programme Ambassadeur'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/shipping-policy" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('shipping_rates') || 'Tarifs et politiques d\'expédition'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/returns-replacements" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('returns_replacements') || 'Retours et remplacements'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/policies" className="text-white hover:text-gold-400 transition-colors font-bold">
                                {t('official_policies') || 'Politiques officielles'}
                            </Link>
                        </li>
                        <li>
                            <Link to="/help" className="text-neutral-200 hover:text-gold-400 transition-colors font-medium">
                                {t('help') || 'Aide'}
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-primary-700 py-8 text-center bg-primary-950">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <span className="text-3xl font-bold tracking-tight">
                        <span className="text-white">Union</span>
                        <span className="text-gold-400">Digitale</span>
                    </span>
                </div>

                {/* Payment Methods */}
                <div className="flex justify-center items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/MonCash_Logo.png/640px-MonCash_Logo.png" alt="MonCash" className="h-6" />
                        <span className="text-red-600 font-bold text-sm">MonCash</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Natcom_Logo.png/220px-Natcom_Logo.png" alt="Natcash" className="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Natcom_Logo.png/220px-Natcom_Logo.png" className="h-6" />
                        <span className="text-blue-600 font-bold text-sm">Natcash</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow text-gray-800">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-bold text-sm">Cartes</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    {/* Trustpilot Placeholder in Footer */}
                    <div className="transform scale-90 opacity-90 hover:opacity-100 transition-opacity">
                        <TrustpilotWidget theme="dark" />
                    </div>

                    <p className="text-sm text-white font-medium">
                        {t('copyright') || '© 2024 Union Digitale. Tous droits réservés.'}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
