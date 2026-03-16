import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';
import { Bell, DollarSign } from 'lucide-react';

const CHACHING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3';

const SaleNotificationListener = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const audioRef = useRef(null);
    const initialLoad = useRef(true);

    useEffect(() => {
        // Only run for sellers
        if (!currentUser) return;

        // Initialize audio
        audioRef.current = new Audio(CHACHING_SOUND_URL);
        audioRef.current.volume = 0.5;

        // Listen for new orders where current user is a seller
        // We look for 'paid' orders or pending ones depending on preference, 
        // usually a "sale" notification should be when it's confirmed.
        const q = query(
            collection(db, 'orders'),
            where('sellerIds', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (initialLoad.current) {
                initialLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const order = change.doc.data();

                    // Trigger alert
                    playSaleSound();
                    showNotification(order);
                }
            });
        }, (error) => {
            console.warn('Sale listener error:', error);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const playSaleSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(err => {
                console.warn('Audio play failed (user interaction required?):', err);
            });
        }
    };

    const showNotification = (order) => {
        if (!toast) return;

        toast.custom((t) => (
            <div className={`max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 animate-in slide-in-from-right-4 duration-500 overflow-hidden`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                Nouvelle Vente ! 🚀
                            </p>
                            <p className="mt-1 text-sm text-slate-600 font-medium">
                                Vous venez de recevoir une commande de {order.totalAmount?.toLocaleString()} {order.currency || 'HTG'}.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200">
                    <button
                        onClick={() => {
                            // Link to order detail would go here
                            navigate('/seller/dashboard');
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-indigo-600 hover:text-indigo-500 focus:outline-none uppercase tracking-widest"
                    >
                        Détails
                    </button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    return null; // This component doesn't render anything visible
};

export default SaleNotificationListener;
