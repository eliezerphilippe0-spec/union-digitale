import * as admin from 'firebase-admin';

const db = admin.firestore();

const hubs = [
  {
    id: 'hub_delmas_pharma',
    name: 'Pharmacie Delmas 33',
    address: 'Delmas 33, Port-au-Prince',
    city: 'Port-au-Prince',
    phone: '+509 37 00 0000',
    hours: '8:00-17:00',
    active: true,
    pilotEnabled: true,
  },
  {
    id: 'hub_pv_market',
    name: 'Market PV',
    address: 'Pétion-Ville',
    city: 'Pétion-Ville',
    phone: '+509 36 00 0000',
    hours: '8:00-17:00',
    active: true,
    pilotEnabled: true,
  },
  {
    id: 'hub_cap_hub',
    name: 'Cap Hub Central',
    address: 'Centre-ville, Cap-Haïtien',
    city: 'Cap-Haïtien',
    phone: '+509 35 00 0000',
    hours: '8:00-17:00',
    active: true,
    pilotEnabled: true,
  },
];

export const seedPickupHubs = async () => {
  const batch = db.batch();
  hubs.forEach((hub) => {
    const ref = db.collection('pickup_hubs').doc(hub.id);
    batch.set(ref, hub, { merge: true });
  });
  await batch.commit();
};
