import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, serverTimestamp, increment, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { paymentService } from '../services/paymentService';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [balance, setBalance] = useState(0);
    const [creditLimit, setCreditLimit] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setBalance(0);
            setCreditLimit(0);
            setTransactions([]);
            setLoading(false);
            return;
        }

        // 1. Subscribe to Wallet Balance
        const walletRef = doc(db, 'wallets', currentUser.uid);
        const unsubscribeWallet = onSnapshot(walletRef, async (docSnap) => {
            if (docSnap.exists()) {
                setBalance(docSnap.data().balance || 0);
                setCreditLimit(docSnap.data().creditLimit || 50000);
            } else {
                // Create wallet if it doesn't exist
                await setDoc(walletRef, {
                    balance: 0,
                    creditLimit: 50000,
                    currency: 'HTG',
                    updatedAt: serverTimestamp()
                });
                setBalance(0);
                setCreditLimit(50000);
            }
            setLoading(false);
        });

        // 2. Subscribe to Recent Transactions
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txs);
        });

        return () => {
            unsubscribeWallet();
            unsubscribeTransactions();
        };
    }, [currentUser]);

    // --- Actions ---

    const deposit = async (amount) => {
        if (!currentUser) throw new Error("User not authenticated");

        // Use PaymentService to initiate real MonCash payment
        // This returns the MonCash redirect URL
        return await paymentService.initiateWalletRecharge(amount, currentUser);
    };

    const transfer = async (recipientEmail, amount) => {
        if (!currentUser) throw new Error("User not authenticated");
        if (balance < amount) throw new Error("Solde insuffisant");

        // 1. Find Recipient (Simulated lookup for now as we can't query users easily without index)
        // In a real app, you'd query the 'users' collection by email.
        // For this prototype, we'll just simulate a successful transfer if the email looks valid.

        // 2. Deduct from Sender
        const walletRef = doc(db, 'wallets', currentUser.uid);
        await updateDoc(walletRef, {
            balance: increment(-Number(amount)),
            updatedAt: serverTimestamp()
        });

        // 3. Create Transaction Record (Sender)
        await addDoc(collection(db, 'transactions'), {
            userId: currentUser.uid,
            type: 'transfer_out',
            amount: Number(amount),
            status: 'completed',
            description: `Transfert vers ${recipientEmail}`,
            toEmail: recipientEmail,
            createdAt: serverTimestamp()
        });

        // Note: In a real app, we would also update the recipient's wallet and create a 'transfer_in' transaction.
        // This should be done via a Cloud Function to ensure atomicity.
    };

    const pay = async (amount, orderId) => {
        if (!currentUser) throw new Error("User not authenticated");
        if (balance < amount) throw new Error("Solde insuffisant");

        // 1. Deduct from Wallet
        const walletRef = doc(db, 'wallets', currentUser.uid);
        await updateDoc(walletRef, {
            balance: increment(-Number(amount)),
            updatedAt: serverTimestamp()
        });

        // 2. Create Transaction Record
        await addDoc(collection(db, 'transactions'), {
            userId: currentUser.uid,
            type: 'payment',
            amount: Number(amount),
            status: 'completed',
            description: `Paiement commande #${orderId}`,
            relatedOrderId: orderId,
            createdAt: serverTimestamp()
        });
    };

    const value = {
        balance,
        transactions,
        loading,
        deposit,
        transfer,
        pay
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};
