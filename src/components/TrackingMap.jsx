import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite/XML/Webpack
// The default icons are sometimes interpreted incorrectly by bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create a custom icon instance
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Set it as default for all markers
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to center map when coordinates change
const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

const TrackingMap = ({ route, currentPosition }) => {
    // Default to Port-au-Prince, Haiti if no route
    const defaultCenter = [18.5392, -72.3364];

    // Safety checks
    const hasRoute = route && route.length > 0;
    const startPoint = hasRoute ? route[0] : defaultCenter;
    const endPoint = hasRoute ? route[route.length - 1] : defaultCenter;

    // Use currentPosition if available, otherwise middle of route, otherwise default
    const centerPoint = currentPosition || (hasRoute ? route[Math.floor(route.length / 2)] : defaultCenter);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative isolate">
            <MapContainer
                center={centerPoint}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hasRoute && (
                    <>
                        <Marker position={startPoint}>
                            <Popup>
                                <div className="text-center font-bold text-gray-800">
                                    Entrepôt<br /><span className="text-xs font-normal">Départ</span>
                                </div>
                            </Popup>
                        </Marker>

                        <Marker position={endPoint}>
                            <Popup>
                                <div className="text-center font-bold text-gray-800">
                                    Vous<br /><span className="text-xs font-normal">Destination</span>
                                </div>
                            </Popup>
                        </Marker>

                        <Polyline
                            positions={route}
                            color="#f97316" // Orange/Gold for Union Digitale
                            weight={5}
                            opacity={0.8}
                            dashArray="10, 10"
                        />
                    </>
                )}

                {currentPosition && (
                    <Marker position={currentPosition} opacity={0.9}>
                        <Popup>
                            <div className="text-center font-bold text-primary-600">
                                Camion<br /><span className="text-xs font-normal">En mouvement...</span>
                            </div>
                        </Popup>
                    </Marker>
                )}

                <ChangeView center={centerPoint} />
            </MapContainer>
        </div>
    );
};

export default TrackingMap;
