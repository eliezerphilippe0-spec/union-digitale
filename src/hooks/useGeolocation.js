import { useState } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState(null); // Added: human readable address
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.address) {
                setAddress({
                    street: data.address.road || data.address.suburb || data.address.neighbourhood || '',
                    city: data.address.city || data.address.town || data.address.village || '',
                    state: data.address.state || data.address.region || '',
                    zip: data.address.postcode || '',
                    full: data.display_name
                });
            }
        } catch (err) {
            console.error("Reverse geocoding failed:", err);
        }
    };

    const getLocation = () => {
        setLoading(true);
        setError(null);
        setAddress(null);

        if (!navigator.geolocation) {
            setError("La géolocalisation n'est pas supportée par votre navigateur.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setLocation({
                    lat,
                    lng,
                    accuracy: position.coords.accuracy
                });

                // Trigger reverse geocoding
                await reverseGeocode(lat, lng);
                setLoading(false);
            },
            (err) => {
                let errorMessage = "Impossible de récupérer votre position.";
                if (err.code === 1) errorMessage = "Vous avez refusé la géolocalisation.";
                if (err.code === 2) errorMessage = "Position indisponible.";
                if (err.code === 3) errorMessage = "Délai d'attente dépassé.";

                setError(errorMessage);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return { location, address, error, loading, getLocation };
};

export default useGeolocation;
