import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { services as localServices } from '../data/services-data';

export const useServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();

    // Fetch all services (with optional filters)
    const fetchServices = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            let q = collection(db, 'services');

            // Basic filtering if needed, e.g. by category
            // if (filters.category && filters.category !== 'all') {
            //     q = query(q, where('category', '==', filters.category));
            // }

            const snapshot = await getDocs(q);
            const servicesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setServices(servicesData);
        } catch (err) {
            console.error("Error fetching services:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get Single Service
    const getServiceById = async (id) => {
        try {
            // First try Firebase
            const docRef = doc(db, 'services', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }

            // Fallback to local services data
            const localService = localServices.find(s => s.id === id);
            if (localService) {
                // Transform local service to match expected format
                const IconComponent = localService.icon;
                return {
                    id: localService.id,
                    title: localService.name,
                    description: localService.description,
                    category: localService.category,
                    image: IconComponent ? '📱' : '💼', // Use emoji as placeholder
                    price: 500, // Default price
                    currency: 'HTG',
                    duration: '30 min',
                    locationType: 'client_home',
                    rating: 4.5,
                    reviews: 42,
                    ownerName: 'Union Digitale'
                };
            }

            return null;
        } catch (err) {
            console.error("Error fetching service:", err);
            // On error, still try local fallback
            const localService = localServices.find(s => s.id === id);
            if (localService) {
                const IconComponent = localService.icon;
                return {
                    id: localService.id,
                    title: localService.name,
                    description: localService.description,
                    category: localService.category,
                    image: IconComponent ? '📱' : '💼',
                    price: 500,
                    currency: 'HTG',
                    duration: '30 min',
                    locationType: 'client_home',
                    rating: 4.5,
                    reviews: 42,
                    ownerName: 'Union Digitale'
                };
            }
            throw err;
        }
    };

    // Add New Service
    const addService = async (serviceData) => {
        if (!currentUser) throw new Error("Must be logged in");

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, 'services'), {
                ...serviceData,
                ownerId: currentUser.uid,
                ownerName: currentUser.displayName || 'Vendeur',
                createdAt: serverTimestamp(),
                rating: 0,
                reviews: 0,
                image: serviceData.image || '💼' // Default icon if no image
            });
            return docRef.id;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        services,
        loading,
        error,
        fetchServices,
        getServiceById,
        addService
    };
};
