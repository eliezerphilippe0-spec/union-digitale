import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Wrapper to call Cloud Functions
const callAdminFunction = async (functionName, data) => {
    try {
        const func = httpsCallable(functions, functionName);
        const result = await func(data);
        return result.data;
    } catch (error) {
        console.error(`Error calling ${functionName}:`, error);
        throw error;
    }
};

export const adminService = {
    suspendStore: (storeId, reason) => callAdminFunction('adminSuspendStore', { storeId, reason }),
    reactivateStore: (storeId, reason) => callAdminFunction('adminReactivateStore', { storeId, reason }),
    deleteStore: (storeId, reason) => callAdminFunction('adminDeleteStore', { storeId, reason }),
    investigateStore: (storeId, reason) => callAdminFunction('adminInvestigateStore', { storeId, reason }),

    // Placeholder for future expansion (e.g., getting specific audit logs if not via direct Firestore query)
    // getAuditLogs: (storeId) => ...
};
