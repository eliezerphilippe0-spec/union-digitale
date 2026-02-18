const admin = require('firebase-admin');

let firestoreDb = null;
let initialized = false;

const isEnabled = () => process.env.FIREBASE_ADMIN_ENABLED === 'true';

const initAdmin = () => {
  if (initialized) return;
  initialized = true;
  if (!isEnabled()) return;

  try {
    if (admin.apps?.length) {
      firestoreDb = admin.firestore();
      return;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: projectId || credentials.project_id,
      });
    } else {
      // ADC (Cloud Run / GCE) recommended
      admin.initializeApp({ projectId: projectId || undefined });
    }

    firestoreDb = admin.firestore();
  } catch (_err) {
    firestoreDb = null;
  }
};

const getFirestore = () => {
  if (!isEnabled()) return null;
  initAdmin();
  return firestoreDb;
};

module.exports = { getFirestore, isEnabled };
