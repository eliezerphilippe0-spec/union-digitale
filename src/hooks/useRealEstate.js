import { useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useRealEstate = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    // Add Listing (Land, House, Rental)
    const addListing = async (data) => {
        if (!currentUser) throw new Error("Must be logged in.");
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, 'realEstateListings'), {
                ...data,
                ownerId: currentUser.uid,
                ownerName: currentUser.displayName || 'Agence Partenaire',
                storeId: currentUser.storeId || null,
                status: 'pending_approval', // Admin validation required
                createdAt: serverTimestamp(),
                rating: 0,
                reviewCount: 0
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding listing:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Get Listings
    const fetchListings = useCallback(async (category = 'all') => {
        setLoading(true);
        try {
            let q = collection(db, 'realEstateListings');
            // Filtering can be added here
            // if (category !== 'all') q = query(q, where('type', '==', category));

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setListings(data);
            return data;
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get Single Listing
    const getListingById = async (id) => {
        setLoading(true);
        try {
            const docRef = doc(db, 'realEstateListings', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
            return null;
        } catch (error) {
            console.error("Error fetching listing:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Book Rental (Mock / Placeholder)
    const bookRental = async (listingId, bookingData) => {
        if (!currentUser) throw new Error("Login required");
        // Implementation for subcollection 'bookings' would go here
        console.log("Booking logic for:", listingId, bookingData);
        return true;
    };

    return {
        listings,
        loading,
        addListing,
        fetchListings,
        getListingById,
        bookRental
    };
};
