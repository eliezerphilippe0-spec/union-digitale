import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const FittingRoomContext = createContext();

export const useFittingRoom = () => {
    const context = useContext(FittingRoomContext);
    if (!context) {
        throw new Error('useFittingRoom must be used within FittingRoomProvider');
    }
    return context;
};

export const FittingRoomProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [measurements, setMeasurements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        preferredFit: 'regular',
        unit: 'cm'
    });

    // Load user measurements from Firestore
    useEffect(() => {
        const loadMeasurements = async () => {
            if (!currentUser) {
                setMeasurements(null);
                setLoading(false);
                return;
            }

            try {
                const measurementsDoc = await getDoc(
                    doc(db, 'users', currentUser.uid, 'profile', 'measurements')
                );

                if (measurementsDoc.exists()) {
                    const data = measurementsDoc.data();
                    setMeasurements(data);
                    if (data.preferredFit) {
                        setPreferences(prev => ({
                            ...prev,
                            preferredFit: data.preferredFit
                        }));
                    }
                }
            } catch (error) {
                console.error('Error loading measurements:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMeasurements();
    }, [currentUser]);

    // Save measurements to Firestore
    const saveMeasurements = async (newMeasurements) => {
        if (!currentUser) {
            throw new Error('User must be logged in to save measurements');
        }

        try {
            const measurementsRef = doc(db, 'users', currentUser.uid, 'profile', 'measurements');
            const dataToSave = {
                ...newMeasurements,
                updatedAt: serverTimestamp(),
                createdAt: measurements?.createdAt || serverTimestamp()
            };

            await setDoc(measurementsRef, dataToSave, { merge: true });
            setMeasurements(dataToSave);
            return true;
        } catch (error) {
            console.error('Error saving measurements:', error);
            throw error;
        }
    };

    // Update specific measurement
    const updateMeasurement = async (key, value) => {
        if (!currentUser) return;

        const updated = {
            ...measurements,
            [key]: value
        };

        await saveMeasurements(updated);
    };

    // Save fitting history (for ML improvement)
    const saveFittingHistory = async (productId, recommendation, actualSize, feedback) => {
        if (!currentUser) return;

        try {
            const historyRef = doc(
                db,
                'users',
                currentUser.uid,
                'fittingHistory',
                `${productId}_${Date.now()}`
            );

            await setDoc(historyRef, {
                productId,
                recommendedSize: recommendation.recommendedSize,
                confidence: recommendation.confidence,
                actualSize,
                feedback, // 'perfect', 'tight', 'loose'
                timestamp: serverTimestamp(),
                userMeasurements: measurements
            });
        } catch (error) {
            console.error('Error saving fitting history:', error);
        }
    };

    // Check if user has measurements
    const hasMeasurements = () => {
        return measurements && (measurements.chest || measurements.waist || measurements.height);
    };

    // Update preferences
    const updatePreferences = async (newPreferences) => {
        setPreferences(prev => ({ ...prev, ...newPreferences }));

        if (currentUser && measurements) {
            await saveMeasurements({
                ...measurements,
                ...newPreferences
            });
        }
    };

    const value = {
        measurements,
        loading,
        preferences,
        saveMeasurements,
        updateMeasurement,
        saveFittingHistory,
        hasMeasurements,
        updatePreferences
    };

    return (
        <FittingRoomContext.Provider value={value}>
            {children}
        </FittingRoomContext.Provider>
    );
};

export default FittingRoomContext;
