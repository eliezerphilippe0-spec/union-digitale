import React from 'react';
import { Truck, MapPin, Globe, Package, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';

const ShippingPolicy = () => {
    const { t } = useLanguage();

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <SEO title={t('shipping_policy_title')} description="Politique de livraison Union Digitale: délais, zones et conditions." />
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shipping_policy_title')}</h1>
                    <p className="text-gray-500 mb-8">{t('shipping_policy_version')}</p>

                    <div className="space-y-12">
                        {/* 1. Introduction */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <Package className="text-secondary" /> {t('sp_intro_title')}
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                {t('sp_intro_text')}
                            </p>
                        </section>

                        {/* 2. Livraison Nationale */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <span className="text-2xl">🇭🇹</span> {t('sp_national_title')}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-2">{t('sp_urban_zones')}</h3>
                                    <p className="text-sm text-blue-800 mb-2">{t('sp_door_to_door')}</p>
                                    <ul className="list-disc list-inside text-sm text-blue-700 mb-4">
                                        <li>Port-au-Prince</li>
                                        <li>Cap-Haïtien</li>
                                        <li>Gonaïves</li>
                                        <li>Les Cayes</li>
                                        <li>Jacmel</li>
                                        <li>Hinche</li>
                                    </ul>
                                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                                        <Clock className="w-4 h-4" /> {t('sp_1_3_days')}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-2">{t('sp_rest_of_country')}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{t('sp_delivery_other_zones')}</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                        <Clock className="w-4 h-4" /> {t('sp_3_5_days')}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                <p className="font-bold mb-1">{t('sp_national_specifics')}</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>{t('sp_specific_1')}</li>
                                    <li>{t('sp_specific_2')}</li>
                                    <li>{t('sp_specific_3')}</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. Livraison Internationale */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <Globe className="text-secondary" /> {t('sp_intl_title')}
                            </h2>
                            <p className="text-gray-700 mb-4">{t('sp_intl_text')}</p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="font-medium">{t('sp_us_ca_ht')}</span>
                                    <span className="font-bold text-gray-900">{t('sp_7_14_days')}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="font-medium">{t('sp_dr_ht')}</span>
                                    <span className="font-bold text-gray-900">{t('sp_3_7_days')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{t('sp_other_countries')}</span>
                                    <span className="text-gray-500 italic">{t('sp_variable_carrier')}</span>
                                </div>
                            </div>
                        </section>

                        {/* 4. Expédition depuis Haïti */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <Package className="text-secondary" /> {t('sp_export_title')}
                            </h2>
                            <p className="text-gray-700 mb-4">{t('sp_export_text')}</p>
                            <div className="bg-gray-100 p-4 rounded flex items-center justify-between">
                                <span className="font-medium">{t('sp_avg_delays')}</span>
                                <span className="font-bold">{t('sp_7_15_days')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{t('sp_carrier_dependency')}</p>
                        </section>

                        {/* 5. Suivi et Confirmation */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <MapPin className="text-secondary" /> {t('sp_tracking_title')}
                            </h2>
                            <p className="text-gray-700 mb-4">{t('sp_tracking_text')}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                                <div className="bg-green-50 text-green-800 p-3 rounded font-medium">{t('sp_status_validated')}</div>
                                <div className="bg-blue-50 text-blue-800 p-3 rounded font-medium">{t('sp_status_shipped')}</div>
                                <div className="bg-orange-50 text-orange-800 p-3 rounded font-medium">{t('sp_status_in_progress')}</div>
                                <div className="bg-gray-100 text-gray-800 p-3 rounded font-medium">{t('sp_status_delivered')}</div>
                            </div>
                        </section>

                        {/* 6. Frais de Livraison */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <Truck className="text-secondary" /> {t('sp_fees_title')}
                            </h2>
                            <p className="text-gray-700 mb-4">{t('sp_fees_text')}</p>
                            <div className="bg-secondary/10 text-secondary-dark p-4 rounded font-medium text-center border border-secondary/20">
                                {t('sp_no_hidden_fees')}
                            </div>
                        </section>

                        {/* 7. Retards */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <AlertTriangle className="text-secondary" /> {t('sp_delays_title')}
                            </h2>
                            <p className="text-gray-700 mb-2">{t('sp_delays_text')}</p>
                            <p className="text-sm text-gray-500">{t('sp_delays_help')}</p>
                        </section>

                        {/* 8. Politique de Retour */}
                        <section>
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
                                <HelpCircle className="text-secondary" /> {t('sp_returns_title')}
                            </h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>{t('sp_return_1')}</li>
                                <li>{t('sp_return_2')}</li>
                                <li>{t('sp_return_3')}</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
