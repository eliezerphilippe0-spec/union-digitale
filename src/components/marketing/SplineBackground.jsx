import { lazy, Suspense } from 'react';

// PERFORMANCE : Spline charge ~2MB de JS (3D runtime).
// On ne le charge que sur desktop avec une connexion rapide.
// Sur mobile 3G haïtien → gradient CSS statique uniquement.
const SplineLazy = lazy(() => import('@splinetool/react-spline'));

function isFastConnection() {
    if (typeof navigator === 'undefined') return true;
    const conn = navigator.connection;
    if (!conn) return true; // Inconnu → on autorise
    return !['slow-2g', '2g', '3g'].includes(conn.effectiveType);
}

export default function SplineBackground({ sceneUrl, className = "" }) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isSlow = typeof window !== 'undefined' && !isFastConnection();

    // Sur mobile ou connexion lente → fond dégradé CSS (0 KB)
    if (isMobile || isSlow) {
        return (
            <div className={`w-full h-full pointer-events-none ${className} bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900`} />
        );
    }

    const url = sceneUrl || "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

    return (
        <div className={`w-full h-full pointer-events-none ${className}`}>
            <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900" />}>
                <SplineLazy scene={url} />
            </Suspense>
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>
    );
}
