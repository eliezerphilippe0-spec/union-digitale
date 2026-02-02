import Spline from '@splinetool/react-spline';

export default function SplineBackground({ sceneUrl, className = "" }) {
    // Fallback if no URL is provided, though usually it should be passed.
    // Using a generic abstract shape scene as a reliable placeholder.
    // Replace this URL with your "Blue Earth" scene URL from Spline (Export -> Code -> URL).
    const url = sceneUrl || "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

    return (
        <div className={`w-full h-full pointer-events-none ${className}`}>
            <Spline scene={url} />
            {/* Overlay to ensure text readability if the scene is too bright/busy */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
        </div>
    );
}
