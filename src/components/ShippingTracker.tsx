/**
 * Shipping Tracker Component
 * Displays real-time tracking information for shipments
 */

import React, { useState, useEffect } from 'react';
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { trackShipment, TrackingInfo, formatShippingStatus } from '../services/shippingService';

interface ShippingTrackerProps {
  trackingNumber: string;
  compact?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  created: <Package className="w-5 h-5" />,
  picked_up: <Package className="w-5 h-5" />,
  in_transit: <Truck className="w-5 h-5" />,
  out_for_delivery: <Truck className="w-5 h-5" />,
  delivered: <CheckCircle className="w-5 h-5" />,
  failed: <AlertCircle className="w-5 h-5" />,
  returned: <AlertCircle className="w-5 h-5" />,
};

const statusColors: Record<string, string> = {
  created: 'bg-blue-100 text-blue-600',
  picked_up: 'bg-blue-100 text-blue-600',
  in_transit: 'bg-yellow-100 text-yellow-600',
  out_for_delivery: 'bg-orange-100 text-orange-600',
  delivered: 'bg-green-100 text-green-600',
  failed: 'bg-red-100 text-red-600',
  returned: 'bg-gray-100 text-gray-600',
};

export default function ShippingTracker({ trackingNumber, compact = false }: ShippingTrackerProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTracking();
  }, [trackingNumber]);

  async function loadTracking() {
    try {
      setLoading(true);
      setError(null);
      const data = await trackShipment(trackingNumber);
      setTracking(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le suivi');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
        <button onClick={loadTracking} className="ml-auto text-sm underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (!tracking) return null;

  const { label, color } = formatShippingStatus(tracking.status);

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusColors[tracking.status] || 'bg-gray-100'}`}>
              {statusIcons[tracking.status] || <Package className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{tracking.trackingNumber}</p>
            </div>
          </div>
          {tracking.estimatedDelivery && tracking.status !== 'delivered' && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Livraison prévue</p>
              <p className="font-medium text-gray-900">
                {new Date(tracking.estimatedDelivery).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Numéro de suivi</p>
            <p className="text-xl font-mono font-bold">{tracking.trackingNumber}</p>
          </div>
          <div className={`px-4 py-2 rounded-full bg-white/20 backdrop-blur`}>
            <span className="font-medium">{label}</span>
          </div>
        </div>
        
        {tracking.estimatedDelivery && tracking.status !== 'delivered' && (
          <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            <span>
              Livraison prévue le{' '}
              {new Date(tracking.estimatedDelivery).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="p-6">
        <div className="flex justify-between mb-8">
          {['created', 'in_transit', 'out_for_delivery', 'delivered'].map((step, index) => {
            const steps = ['created', 'in_transit', 'out_for_delivery', 'delivered'];
            const currentIndex = steps.indexOf(tracking.status);
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                >
                  {statusIcons[step]}
                </div>
                <p className={`text-xs mt-2 text-center ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {formatShippingStatus(step).label}
                </p>
                {index < 3 && (
                  <div
                    className={`absolute h-1 w-full top-5 -z-10 ${
                      index < currentIndex ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                    style={{ left: '50%' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Events Timeline */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Historique</h3>
          <div className="space-y-4">
            {tracking.events
              .slice()
              .reverse()
              .map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                    {index < tracking.events.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                      <span>•</span>
                      <span>
                        {new Date(event.timestamp).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Provider Info */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <p className="text-sm text-gray-500">
          Transporteur: <span className="text-gray-900">{tracking.provider}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Simple tracking input component
 */
export function TrackingInput() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTracker, setShowTracker] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setShowTracker(true);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Entrez votre numéro de suivi"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Suivre
        </button>
      </form>

      {showTracker && <ShippingTracker trackingNumber={trackingNumber} />}
    </div>
  );
}
