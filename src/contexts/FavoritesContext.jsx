import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load favorites when user logs in
    useEffect(() => {
        const loadFavorites = async () => {
            if (!currentUser) {
                setFavorites([]);
                setLoading(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setFavorites(userDoc.data().favorites || []);
                }
            } catch (error) {
                console.error("Error loading favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [currentUser]);

    const toggleFavorite = async (productId) => {
        if (!currentUser) {
            alert("Veuillez vous connecter pour ajouter des favoris.");
            return;
        }

        const isFavorite = favorites.includes(productId);
        const userRef = doc(db, 'users', currentUser.uid);

        try {
            if (isFavorite) {
                // Remove
                await updateDoc(userRef, {
                    favorites: arrayRemove(productId)
                });
                setFavorites(prev => prev.filter(id => id !== productId));
            } else {
                // Add
                await updateDoc(userRef, {
                    favorites: arrayUnion(productId)
                });
                setFavorites(prev => [...prev, productId]);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            // If error is "document not found", try creating it (edge case)
            if (error.code === 'not-found') {
                await setDoc(userRef, { favorites: [productId] }, { merge: true });
                setFavorites([productId]);
            }
        }
    };

    const isFavorite = (productId) => {
        return favorites.includes(productId);
    };

    const value = {
        favorites,
        toggleFavorite,
        isFavorite,
        loading
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
