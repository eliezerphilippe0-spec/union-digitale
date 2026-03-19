import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Rocket } from 'lucide-react';
import Celebration from '../components/marketing/Celebration';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { claimLicenseKey } from '../services/digitalService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';
import SEO from '../components/common/SEO';

const OrderConfirmation = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [delivering, setDelivering] = useState(false);
    const [orderNumber, setOrderNumber] = useState(null);

    useEffect(() => {
        const processDigitalItems = async () => {
            if (!orderId || !currentUser) return;

            try {
                setDelivering(true);
                const orderRef = doc(db, 'orders', orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();

                    // Afficher le numéro lisible (ZB-YYMMDD-XXXXXX) si disponible
                    setOrderNumber(orderData.orderNumber || null);

                    // Only process if status is paid and not already digitally delivered
                    if (orderData.status === 'paid' && !orderData.digitalDelivered) {
                        const digitalItems = orderData.items.filter(item => item.isDigital || item.type === 'digital');

                        if (digitalItems.length > 0) {
                            let updatedItems = [...orderData.items];
                            const deliveryResults = await Promise.all(digitalItems.map(async (item) => {
                                if (item.deliveryType === 'key_automated' || (item.isDigital && !item.filePath)) {
                                    const result = await claimLicenseKey(item.productId || item.id, orderId, currentUser.uid);
                                    if (result.success) {
                                        // Find index in updatedItems
                                        const idx = updatedItems.findIndex(i => (i.productId || i.id) === (item.productId || item.id));
                                        if (idx !== -1) {
                                            updatedItems[idx] = { ...updatedItems[idx], licensedKey: result.key };
                                        }
                                    }
                                    return result;
                                }
                                return null;
                            }));

                            // Mark order as digitally delivered and update items with keys
                            await updateDoc(orderRef, {
                                items: updatedItems,
                                digitalDelivered: true,
                                digitalDeliveredAt: new Date()
                            });

                            logger.success(`Digital access granted for order ${orderId}`);
                        }
                    }
                }
            } catch (error) {
                logger.error('Digital delivery failed in confirmation page', error);
            } finally {
                setDelivering(false);
            }
        };

        processDigitalItems();
    }, [orderId, currentUser]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <SEO title="Confirmation de commande" description="Votre commande Zabely est confirmée." />
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 relative">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <Celebration />

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    {t('order_confirmed_title')}
                </h2>
                <p className="text-gray-500 mb-6">
                    {t('payment_confirmed')}
                </p>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-center">
                    <div className="text-xs text-indigo-500 uppercase tracking-widest font-semibold mb-1">{t('order_number')}</div>
                    <div className="font-mono text-2xl font-bold text-indigo-700 tracking-wide">
                        {orderNumber || orderId}
                    </div>
                    {orderNumber && (
                        <div className="text-xs text-gray-400 mt-1">Référence : {orderId}</div>
                    )}
                </div>

                <div className="space-y-3">
                    {delivering ? (
                        <div className="flex items-center justify-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-lg animate-pulse">
                            <Rocket className="w-5 h-5 animate-bounce" />
                            <span className="font-bold">Préparation de vos produits digitaux...</span>
                        </div>
                    ) : (
                        <Link
                            to="/library"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors py-4 animate-glow"
                        >
                            <ArrowRight className="w-5 h-5" />
                            Accéder à ma Librairie
                        </Link>
                    )}

                    <Link
                        to="/orders"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-100 text-base font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 shadow-sm transition-colors"
                    >
                        <Package className="w-5 h-5" />
                        {t('view_orders')}
                    </Link>

                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {t('continue_shopping')} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
