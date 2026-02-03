/**
 * Shipping Service - Frontend
 * Calls Cloud Functions for shipping operations
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export interface ShippingQuote {
  provider: string;
  providerName: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  type: 'standard' | 'express' | 'pickup';
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  provider: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: Date;
  currentLocation?: string;
}

/**
 * Get shipping quotes for a destination city
 */
export async function getShippingQuotes(
  city: string,
  weight?: number,
  items?: number
): Promise<ShippingQuote[]> {
  const getQuotes = httpsCallable<
    { city: string; weight?: number; items?: number },
    { success: boolean; quotes?: ShippingQuote[]; error?: string }
  >(functions, 'getShippingQuotes');

  const result = await getQuotes({ city, weight, items });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to get quotes');
  }

  return result.data.quotes || [];
}

/**
 * Track a shipment by tracking number
 */
export async function trackShipment(trackingNumber: string): Promise<TrackingInfo> {
  const track = httpsCallable<
    { trackingNumber: string },
    { success: boolean; tracking?: TrackingInfo; error?: string }
  >(functions, 'trackShipment');

  const result = await track({ trackingNumber });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to track shipment');
  }

  return result.data.tracking!;
}

/**
 * Create shipment for an order (seller only)
 */
export async function createShipment(
  orderId: string,
  provider: string,
  address?: any
): Promise<{ id: string; trackingNumber: string }> {
  const create = httpsCallable<
    { orderId: string; provider: string; address?: any },
    { success: boolean; shipment?: any; error?: string }
  >(functions, 'createShipment');

  const result = await create({ orderId, provider, address });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to create shipment');
  }

  return result.data.shipment;
}

/**
 * Format status for display
 */
export function formatShippingStatus(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    created: { label: 'Préparé', color: 'blue' },
    picked_up: { label: 'Récupéré', color: 'blue' },
    in_transit: { label: 'En transit', color: 'yellow' },
    out_for_delivery: { label: 'En livraison', color: 'orange' },
    delivered: { label: 'Livré', color: 'green' },
    failed: { label: 'Échec', color: 'red' },
    returned: { label: 'Retourné', color: 'gray' },
  };

  return statuses[status] || { label: status, color: 'gray' };
}
