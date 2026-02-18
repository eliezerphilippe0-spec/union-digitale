import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/common/SEO';
import TrackingMap from '../components/TrackingMap';
import { db } from '../lib/firebase';

const shouldLog = (key) => {
    if (typeof window === 'undefined') return false;
    try {
        if (sessionStorage.getItem(key)) return false;
        sessionStorage.setItem(key, '1');
        return true;
    } catch (e) {
        return false;
    }
};

const logTrackingEvent = async (eventName, orderId) => {
    if (!eventName || !orderId) return;
    const key = `tracking_${eventName}_${orderId}`;
    if (!shouldLog(key)) return;

    try {
        await addDoc(collection(db, 'analytics_events'), {
            eventName,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        // silent
    }
};

const TrackingPage = () => {
    const { orderId } = useParams();
    const { t } = useLanguage();

    // Mock Data for the simulation
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        const timer = setTimeout(() => {
            setTrackingData({
                orderId: orderId,
                status: 'in_transit',
                estimatedDelivery: 'Aujourd\'hui, 14:00 - 16:00',
                carrier: 'Union Express',
                currentLocation: [18.5200, -72.3000], // Near Delmas 65
                steps: [
                    {
                        id: 1,
                        title: t('order_placed') || 'Commande validée',
                        date: '26 Jan, 10:30',
                        completed: true,
                        icon: Package
                    },
                    {
                        id: 2,
                        title: t('shipped') || 'Expédié',
                        date: '27 Jan, 08:00',
                        completed: true,
                        icon: Truck
                    },
                    {
                        id: 3,
                        title: t('out_for_delivery') || 'En cours de livraison',
                        date: '27 Jan, 13:15',
                        completed: true,
                        icon: Clock // Usually a truck icon again or clock
                    },
                    {
                        id: 4,
                        title: t('delivered') || 'Livré',
                        date: '-',
                        completed: false,
                        icon: CheckCircle
                    },
                ],
                // Route: Port-au-Prince -> Delmas -> Petion-Ville
                route: [
                    [18.5392, -72.3364], // Port-au-Prince (Warehouse)
                    [18.5350, -72.3200],
                    [18.5280, -72.3100],
                    [18.5200, -72.3000], // Current (Delmas)
                    [18.5125, -72.2850]  // Petion-Ville (Customer)
                ]
            });
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [orderId, t]);

    useEffect(() => {
        if (!trackingData || !orderId) return;
        logTrackingEvent('tracking_summary_view', orderId);
        logTrackingEvent('eta_visible', orderId);
    }, [trackingData, orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <SEO title="Suivi de commande" description="Suivez vos livraisons Union Digitale en temps réel." />
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t('track_package') || 'Suivi de Colis'}</h1>
                        <p className="text-sm text-gray-500">Commande #{orderId}</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Above-the-fold summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                                {t('estimated_delivery') || 'Livraison estimée'}
                            </div>
                            <div className="flex items-center gap-2 text-lg md:text-2xl font-extrabold text-gray-900">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span>{trackingData.estimatedDelivery}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {t('tracking_number_label') || 'Commande'} #{orderId} • {trackingData.carrier}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/customer-service"
                                onClick={() => logTrackingEvent('tracking_support_cta_click', orderId)}
                                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:bg-secondary/90 transition-colors"
                            >
                                {t('contact_support') || 'Contacter le support'}
                            </Link>
                            <span className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">
                                {t('tracking_live') || 'Suivi en direct'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Status & Timeline */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
                                    <Clock className="w-4 h-4" />
                                    {trackingData.estimatedDelivery}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('arriving_today') || 'Arrive aujourd\'hui'}</h2>
                            <p className="text-gray-500 text-sm">Via {trackingData.carrier}</p>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6">{t('tracking_history') || 'Historique'}</h3>
                            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                                {trackingData.steps.map((step, index) => (
                                    <div key={step.id} className="relative">
                                        {/* Dot */}
                                        <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 ${step.completed ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                                            }`}></div>

                                        <div className={`${step.completed ? 'opacity-100' : 'opacity-40'}`}>
                                            <h4 className="font-bold text-gray-900 text-sm">{step.title}</h4>
                                            <p className="text-xs text-gray-500">{step.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[500px] flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-gold-500" />
                                    {t('live_map') || 'Carte en temps réel'}
                                </h3>
                                <span className="text-xs text-green-600 font-bold animate-pulse">● En direct</span>
                            </div>
                            <div className="flex-1 relative z-0">
                                <TrackingMap
                                    route={trackingData.route}
                                    currentPosition={trackingData.currentLocation}
                                />
                            </div>
                        </div>

                        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800">
                            <p><strong>Note:</strong> La position du livreur est mise à jour toutes les 5 minutes. En cas de problème, contactez le support.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;
