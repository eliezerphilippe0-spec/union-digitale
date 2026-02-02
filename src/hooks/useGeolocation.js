import { useState } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("La géolocalisation n'est pas supportée par votre navigateur.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
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

    return { location, error, loading, getLocation };
};

export default useGeolocation;
