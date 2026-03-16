import React from 'react';
import { Eye, Truck, CheckCircle, Smartphone, Navigation } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { whatsappService } from '../../services/whatsappService';
import { createMissionFromOrder } from '../../services/deliveryService';

const AdminOrders = () => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for orders
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Handle timestamps safely
                date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : 'N/A'
            }));
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'shipped': return 'bg-blue-100 text-blue-700';
            case 'out_for_delivery': return 'bg-indigo-100 text-indigo-700';
            case 'delivered':
            case 'delivered_paid': return 'bg-green-100 text-green-700';
            case 'processing': return 'bg-orange-100 text-orange-700';
            case 'paid':
            case 'confirmed': return 'bg-purple-100 text-purple-700';
            case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
            case 'refused':
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            const order = orders.find(o => o.id === orderId);

            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date()
            });

            // Send notification
            const userRef = doc(db, 'users', order.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                await whatsappService.sendStatusUpdate(orderId, newStatus, { ...userData, uid: order.userId });
            }

            console.log(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Erreur lors de la mise à jour du statut.");
        }
    };

    const handleRefusal = async (orderId, userId) => {
        if (!window.confirm("Confirmer le refus de livraison ? Cela augmentera le score de fraude de l'utilisateur.")) return;

        try {
            // 1. Update Order Status
            await updateStatus(orderId, 'refused');

            // 2. Update User Fraud Score
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentRefusals = (userSnap.data().codRefusalCount || 0) + 1;
                await updateDoc(userRef, {
                    codRefusalCount: increment(1),
                    codBlocked: currentRefusals >= 2
                });
            }
        } catch (error) {
            console.error("Error handling refusal:", error);
        }
    };

    const requestConfirmation = async (orderId) => {
        try {
            const order = orders.find(o => o.id === orderId);
            const userRef = doc(db, 'users', order.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                await whatsappService.sendCODConfirmationRequest(order, { ...userData, uid: order.userId });

                const orderRef = doc(db, 'orders', orderId);
                await updateDoc(orderRef, { confirmationSent: true });
            }
            alert("Demande de confirmation envoyée !");
        } catch (error) {
            console.error("Error requesting confirmation:", error);
            alert("Erreur lors de l'envoi de la confirmation.");
        }
    };

    const handleConvertToMission = async (orderId) => {
        try {
            const order = orders.find(o => o.id === orderId);
            const missionId = await createMissionFromOrder(orderId, order);

            if (missionId) {
                const orderRef = doc(db, 'orders', orderId);
                await updateDoc(orderRef, {
                    missionCreated: true,
                    missionId: missionId,
                    status: 'processing' // Move to processing if not already
                });
                alert("Mission UD Solution créée ! Elle est maintenant visible par les chauffeurs.");
            }
        } catch (error) {
            console.error("Error converting to mission:", error);
            alert("Erreur lors de la création de la mission.");
        }
    };

    const depositChangeToWallet = async (orderId, amount) => {
        if (!amount || amount <= 0) return;
        try {
            const order = orders.find(o => o.id === orderId);
            const walletRef = doc(db, 'wallets', order.userId);

            await updateDoc(walletRef, {
                balance: increment(Number(amount)),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, 'transactions'), {
                userId: order.userId,
                type: 'cash_change_deposit',
                amount: Number(amount),
                status: 'completed',
                description: `Reliquat (monnaie) de la commande #${orderId}`,
                relatedOrderId: orderId,
                createdAt: serverTimestamp()
            });

            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                changeDeposited: amount,
                updatedAt: serverTimestamp()
            });

            alert(`Monnaie de ${amount} G déposée sur le portefeuille du client.`);
        } catch (error) {
            console.error("Error depositing change:", error);
            alert("Erreur lors du dépôt de la monnaie.");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">{t('latest_orders')}</h3>
                <div className="text-sm text-gray-500">{orders.length} commandes</div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                        <tr>
                            <th className="p-4">{t('order_id_header')}</th>
                            <th className="p-4">{t('order_customer')}</th>
                            <th className="p-4">{t('order_date')}</th>
                            <th className="p-4">{t('total_header')}</th>
                            <th className="p-4">{t('order_payment')}</th>
                            <th className="p-4">{t('status_header')}</th>
                            <th className="p-4 text-right">{t('table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Chargement...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Aucune commande trouvée.</td></tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-gray-700 text-xs">{order.id}</td>
                                <td className="p-4 font-medium text-gray-900">
                                    {order.shippingAddress?.name || 'Client'}
                                </td>
                                <td className="p-4 text-gray-500">{order.date}</td>
                                <td className="p-4 font-bold text-gray-900">{(order.totalAmount || order.total || 0).toLocaleString()} G</td>
                                <td className="p-4 text-gray-500 capitalize">{order.paymentMethod}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                                        {(order.status === 'delivered' || order.status === 'delivered_paid') && <CheckCircle className="w-3 h-3" />}
                                        {(order.status === 'shipped' || order.status === 'out_for_delivery') && <Truck className="w-3 h-3" />}
                                        {t(`status_${order.status}`) || order.status}
                                    </span>
                                    {order.paymentMethod === 'COD_HT' && (
                                        <div className="text-[10px] mt-1 text-gray-400">
                                            Acompte: {order.depositAmount} G | Reste: {order.remainingCOD} G
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {order.status === 'confirmed' && (
                                            <>
                                                <button
                                                    onClick={() => requestConfirmation(order.id)}
                                                    className={`px-2 py-1 rounded text-[10px] items-center flex gap-1 ${order.confirmationSent ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                                >
                                                    <Smartphone className="w-3 h-3" /> {order.confirmationSent ? 'Confirm. Envoyée' : 'Demander Confirm.'}
                                                </button>
                                                {!order.missionCreated ? (
                                                    <button
                                                        onClick={() => handleConvertToMission(order.id)}
                                                        className="bg-secondary text-white px-2 py-1 rounded text-[10px] items-center flex gap-1 shadow-sm hover:scale-105 transition-transform"
                                                    >
                                                        <Navigation className="w-3 h-3" /> UD Solution
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-secondary font-bold border border-secondary/20 bg-secondary/10 px-2 py-1 rounded">
                                                        Mission Active
                                                    </span>
                                                )}
                                                <button onClick={() => updateStatus(order.id, 'out_for_delivery')} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] items-center flex gap-1">
                                                    <Truck className="w-3 h-3" /> En route
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'out_for_delivery' && (
                                            <>
                                                <button onClick={() => updateStatus(order.id, 'delivered_paid')} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] items-center flex gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Payé
                                                </button>
                                                <button onClick={() => handleRefusal(order.id, order.userId)} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] items-center flex gap-1">
                                                    Refusé
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'delivered_paid' && order.paymentMethod === 'COD_HT' && !order.changeDeposited && (
                                            <div className="flex items-center gap-1 border border-primary-200 rounded p-1 bg-primary-50">
                                                <input
                                                    type="number"
                                                    placeholder="Monnaie (G)"
                                                    id={`change-${order.id}`}
                                                    className="w-16 text-[10px] border-none bg-transparent focus:ring-0"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const amount = document.getElementById(`change-${order.id}`).value;
                                                        depositChangeToWallet(order.id, amount);
                                                    }}
                                                    className="bg-primary-600 text-white px-2 py-1 rounded text-[10px] items-center flex gap-1 whitespace-nowrap"
                                                >
                                                    Déposer Monnaie
                                                </button>
                                            </div>
                                        )}
                                        {order.changeDeposited && (
                                            <span className="text-[10px] text-green-600 font-bold border border-green-200 bg-green-50 px-2 py-1 rounded">
                                                Monnaie déposée ({order.changeDeposited} G)
                                            </span>
                                        )}
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> {t('details_label') || 'Détails'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrders;
