import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, functions } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';

const AmbassadorContext = createContext();

export const useAmbassador = () => useContext(AmbassadorContext);

export const AmbassadorProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [ambassadorData, setAmbassadorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) {
            setAmbassadorData(null);
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, 'ambassadors', currentUser.uid), (doc) => {
            if (doc.exists()) {
                setAmbassadorData(doc.data());
            } else {
                setAmbassadorData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Ambassador listener error:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    const registerAmbassador = async (preferredCode) => {
        try {
            const generateCodeFn = httpsCallable(functions, 'generateAmbassadorCode');
            const result = await generateCodeFn({ preferredCode });
            return result.data;
        } catch (err) {
            console.error("Registration error:", err);
            throw err;
        }
    };

    const requestPayout = async () => {
        if (!ambassadorData || ambassadorData.totalEarnings < 2500) {
            throw new Error("Solde minimum de 2500 G requis.");
        }
        try {
            // Simplified: Direct Firestore write. In production, use a Callable Function for validation.
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            await addDoc(collection(db, 'payouts'), {
                ambassadorId: currentUser.uid,
                amount: ambassadorData.totalEarnings, // Requesting full balance for now
                status: 'pending',
                method: 'moncash',
                requestedAt: serverTimestamp()
            });
            return true;
        } catch (err) {
            console.error("Payout error:", err);
            throw new Error("Impossible de demander le paiement.");
        }
    };

    const value = {
        ambassadorData,
        loading,
        error,
        registerAmbassador,
        requestPayout,
        isAmbassador: !!ambassadorData
    };

    return (
        <AmbassadorContext.Provider value={value}>
            {children}
        </AmbassadorContext.Provider>
    );
};
