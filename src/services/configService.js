import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const CONFIG_PATH = 'global_config/app_settings';

/**
 * Fetches the current application settings.
 */
export const getAppSettings = async () => {
    try {
        const docRef = doc(db, CONFIG_PATH);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { maintenanceMode: false };
    } catch (error) {
        console.error('Error fetching app settings:', error);
        return { maintenanceMode: false };
    }
};

/**
 * Updates application settings.
 */
export const updateAppSettings = async (updates) => {
    try {
        const docRef = doc(db, CONFIG_PATH);
        await setDoc(docRef, updates, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating app settings:', error);
        throw error;
    }
};

/**
 * Subscribes to application settings changes.
 */
export const subscribeToAppSettings = (callback) => {
    const docRef = doc(db, CONFIG_PATH);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback({ maintenanceMode: false });
        }
    }, (error) => {
        console.error('Error subscribing to app settings:', error);
        callback({ maintenanceMode: false }); // Default to false on error
    });
};
