/**
 * Shipping & Logistics Service
 * Integrates with local Haitian carriers and provides tracking
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const db = admin.firestore();

// Haitian shipping providers configuration
const SHIPPING_PROVIDERS = {
  // Local carriers
  unitrans: {
    name: 'Unitrans Haiti',
    trackingUrl: 'https://unitranshaiti.com/track/',
    apiUrl: process.env.UNITRANS_API_URL,
    apiKey: process.env.UNITRANS_API_KEY,
    zones: ['Port-au-Prince', 'Cap-Haïtien', 'Les Cayes', 'Gonaïves'],
  },
  tortugExpress: {
    name: 'Tortug Express',
    trackingUrl: 'https://tortugexpress.ht/suivi/',
    apiUrl: process.env.TORTUG_API_URL,
    apiKey: process.env.TORTUG_API_KEY,
    zones: ['Nationwide'],
  },
  // Moto/bike delivery for urban areas
  motoLivrezon: {
    name: 'Moto Livrezon',
    trackingUrl: null,
    apiUrl: null,
    zones: ['Port-au-Prince', 'Pétion-Ville', 'Delmas'],
    type: 'express',
  },
  // Self pickup
  pickup: {
    name: 'Retrait en magasin',
    trackingUrl: null,
    zones: ['all'],
    type: 'pickup',
  },
};

// Shipping zones and rates (in HTG)
const SHIPPING_RATES = {
  'Port-au-Prince': { standard: 250, express: 500 },
  'Pétion-Ville': { standard: 250, express: 500 },
  'Delmas': { standard: 250, express: 500 },
  'Cap-Haïtien': { standard: 750, express: 1500 },
  'Les Cayes': { standard: 800, express: 1600 },
  'Gonaïves': { standard: 600, express: 1200 },
  'Jacmel': { standard: 700, express: 1400 },
  'Jérémie': { standard: 1000, express: 2000 },
  'default': { standard: 1000, express: 2000 },
};

interface ShippingQuote {
  provider: string;
  providerName: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  type: 'standard' | 'express' | 'pickup';
}

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  trackingNumber: string;
  provider: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: Date;
  currentLocation?: string;
}

/**
 * Get shipping quotes for an order
 */
export const getShippingQuotes = functions.https.onCall(
  async (data: { 
    city: string; 
    weight?: number; 
    items?: number;
  }): Promise<{ success: boolean; quotes?: ShippingQuote[]; error?: string }> => {
    const { city, weight = 1, items = 1 } = data;

    if (!city) {
      return { success: false, error: 'City required' };
    }

    try {
      const normalizedCity = city.trim();
      const rates = SHIPPING_RATES[normalizedCity as keyof typeof SHIPPING_RATES] || SHIPPING_RATES.default;

      // Weight multiplier (simplified)
      const weightMultiplier = Math.max(1, Math.ceil(weight / 5));
      
      const quotes: ShippingQuote[] = [];

      // Standard shipping
      quotes.push({
        provider: 'standard',
        providerName: 'Livraison Standard',
        rate: rates.standard * weightMultiplier,
        currency: 'HTG',
        estimatedDays: normalizedCity === 'Port-au-Prince' ? 2 : 5,
        type: 'standard',
      });

      // Express shipping (urban areas only)
      if (['Port-au-Prince', 'Pétion-Ville', 'Delmas', 'Cap-Haïtien'].includes(normalizedCity)) {
        quotes.push({
          provider: 'express',
          providerName: 'Livraison Express (24h)',
          rate: rates.express * weightMultiplier,
          currency: 'HTG',
          estimatedDays: 1,
          type: 'express',
        });
      }

      // Moto delivery for Port-au-Prince metro
      if (['Port-au-Prince', 'Pétion-Ville', 'Delmas'].includes(normalizedCity) && weight <= 10) {
        quotes.push({
          provider: 'moto',
          providerName: 'Moto Express (2-4h)',
          rate: 350,
          currency: 'HTG',
          estimatedDays: 0,
          type: 'express',
        });
      }

      // Pickup option
      quotes.push({
        provider: 'pickup',
        providerName: 'Retrait en point relais',
        rate: 0,
        currency: 'HTG',
        estimatedDays: 1,
        type: 'pickup',
      });

      return { success: true, quotes };
    } catch (error: any) {
      console.error('Error getting shipping quotes:', error);
      return { success: false, error: 'Failed to get shipping quotes' };
    }
  }
);

/**
 * Create shipment for an order
 */
export const createShipment = functions.https.onCall(
  async (data: {
    orderId: string;
    provider: string;
    address: any;
  }, context): Promise<{ success: boolean; shipment?: any; error?: string }> => {
    if (!context.auth) {
      return { success: false, error: 'Authentication required' };
    }

    const { orderId, provider, address } = data;

    // Only sellers/admins can create shipments
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userRole = context.auth.token.role || userDoc.data()?.role;

    if (!['seller', 'admin'].includes(userRole)) {
      return { success: false, error: 'Only sellers can create shipments' };
    }

    try {
      // Verify order exists
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderDoc.data()!;

      // Generate tracking number
      const trackingNumber = generateTrackingNumber(provider);

      // Create shipment record
      const shipment = {
        orderId,
        provider,
        trackingNumber,
        status: 'created',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
        address: address || order.shippingAddress,
        events: [
          {
            timestamp: new Date(),
            status: 'created',
            location: 'Vendor',
            description: 'Colis préparé pour expédition',
          },
        ],
        estimatedDelivery: calculateEstimatedDelivery(provider, address?.city),
      };

      const shipmentRef = await db.collection('shipments').add(shipment);

      // Update order with tracking info
      await db.collection('orders').doc(orderId).update({
        status: 'shipped',
        trackingNumber,
        shippingProvider: provider,
        shipmentId: shipmentRef.id,
        shippedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send notification to buyer
      const buyerDoc = await db.collection('users').doc(order.userId).get();
      if (buyerDoc.exists) {
        await db.collection('notifications').add({
          userId: order.userId,
          type: 'order_shipped',
          title: 'Votre commande a été expédiée! 📦',
          message: `Numéro de suivi: ${trackingNumber}`,
          orderId,
          trackingNumber,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return {
        success: true,
        shipment: {
          id: shipmentRef.id,
          trackingNumber,
          ...shipment,
        },
      };
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      return { success: false, error: 'Failed to create shipment' };
    }
  }
);

/**
 * Track a shipment
 */
export const trackShipment = functions.https.onCall(
  async (data: { trackingNumber: string }): Promise<{ success: boolean; tracking?: TrackingInfo; error?: string }> => {
    const { trackingNumber } = data;

    if (!trackingNumber) {
      return { success: false, error: 'Tracking number required' };
    }

    try {
      // Look up in our database
      const shipmentQuery = await db
        .collection('shipments')
        .where('trackingNumber', '==', trackingNumber)
        .limit(1)
        .get();

      if (shipmentQuery.empty) {
        return { success: false, error: 'Shipment not found' };
      }

      const shipment = shipmentQuery.docs[0].data();

      // Try to get external tracking if API available
      let externalEvents: TrackingEvent[] = [];
      const provider = SHIPPING_PROVIDERS[shipment.provider as keyof typeof SHIPPING_PROVIDERS];

      if (provider?.apiUrl && provider?.apiKey) {
        try {
          const response = await axios.get(`${provider.apiUrl}/track/${trackingNumber}`, {
            headers: { Authorization: `Bearer ${provider.apiKey}` },
            timeout: 5000,
          });
          externalEvents = response.data.events || [];
        } catch (e) {
          // External API failed, use internal events
          console.log('External tracking API unavailable, using internal events');
        }
      }

      const events = externalEvents.length > 0 ? externalEvents : (shipment.events || []);

      const tracking: TrackingInfo = {
        trackingNumber,
        provider: provider?.name || shipment.provider,
        status: shipment.status,
        events: events.map((e: any) => ({
          timestamp: e.timestamp?.toDate?.() || new Date(e.timestamp),
          status: e.status,
          location: e.location,
          description: e.description,
        })),
        estimatedDelivery: shipment.estimatedDelivery?.toDate?.() || shipment.estimatedDelivery,
        currentLocation: events[events.length - 1]?.location,
      };

      return { success: true, tracking };
    } catch (error: any) {
      console.error('Error tracking shipment:', error);
      return { success: false, error: 'Failed to track shipment' };
    }
  }
);

/**
 * Update shipment status (webhook or manual)
 */
export const updateShipmentStatus = functions.https.onCall(
  async (data: {
    trackingNumber: string;
    status: string;
    location?: string;
    description?: string;
  }, context): Promise<{ success: boolean; error?: string }> => {
    // Verify caller is admin/seller or system
    if (!context.auth) {
      return { success: false, error: 'Authentication required' };
    }

    const { trackingNumber, status, location, description } = data;

    try {
      const shipmentQuery = await db
        .collection('shipments')
        .where('trackingNumber', '==', trackingNumber)
        .limit(1)
        .get();

      if (shipmentQuery.empty) {
        return { success: false, error: 'Shipment not found' };
      }

      const shipmentRef = shipmentQuery.docs[0].ref;
      const shipment = shipmentQuery.docs[0].data();

      const newEvent = {
        timestamp: new Date(),
        status,
        location: location || 'En transit',
        description: description || getStatusDescription(status),
      };

      await shipmentRef.update({
        status,
        events: admin.firestore.FieldValue.arrayUnion(newEvent),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update order status if delivered
      if (status === 'delivered') {
        await db.collection('orders').doc(shipment.orderId).update({
          status: 'delivered',
          deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Notify buyer
        const orderDoc = await db.collection('orders').doc(shipment.orderId).get();
        if (orderDoc.exists) {
          await db.collection('notifications').add({
            userId: orderDoc.data()!.userId,
            type: 'order_delivered',
            title: 'Commande livrée! 🎉',
            message: 'Votre commande a été livrée avec succès.',
            orderId: shipment.orderId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      return { success: false, error: 'Failed to update shipment' };
    }
  }
);

// Helper functions
function generateTrackingNumber(provider: string): string {
  const prefix = provider.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `UD${prefix}${timestamp}${random}`;
}

function calculateEstimatedDelivery(provider: string, city?: string): Date {
  const days = provider === 'express' || provider === 'moto' ? 1 :
               city && ['Port-au-Prince', 'Pétion-Ville', 'Delmas'].includes(city) ? 2 : 5;
  
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    created: 'Colis préparé pour expédition',
    picked_up: 'Colis récupéré par le transporteur',
    in_transit: 'Colis en transit',
    out_for_delivery: 'Colis en cours de livraison',
    delivered: 'Colis livré',
    failed: 'Tentative de livraison échouée',
    returned: 'Colis retourné à l\'expéditeur',
  };
  return descriptions[status] || status;
}
