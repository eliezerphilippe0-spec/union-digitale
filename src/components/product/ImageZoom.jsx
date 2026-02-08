/**
 * ImageZoom - P2 Fix: Zoom on hover
 * Loupe effect like Amazon/Shopify
 */

import React, { useState, useRef } from 'react';
import { ZoomIn } from 'lucide-react';

const ImageZoom = ({ src, alt, placeholder, className = '' }) => {
    const [isZooming, setIsZooming] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setPosition({ x, y });
    };

    const isValidImage = src && (src.startsWith('http') || src.startsWith('/'));

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-hidden rounded-lg bg-gray-50 cursor-zoom-in ${className}`}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
        >
            {/* Main Image */}
            {isValidImage ? (
                <img 
                    src={src} 
                    alt={alt}
                    className="w-full h-full object-contain transition-transform duration-300"
                    style={{
                        transform: isZooming ? 'scale(1.1)' : 'scale(1)',
                    }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl text-gray-200">{placeholder || '📦'}</span>
                </div>
            )}

            {/* Zoom Lens Overlay */}
            {isZooming && isValidImage && (
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle 100px at ${position.x}% ${position.y}%, transparent 0%, rgba(0,0,0,0.3) 100%)`,
                    }}
                />
            )}

            {/* Zoom Indicator */}
            <div className={`absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-opacity ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
                <ZoomIn className="w-3 h-3" />
                Survoler pour zoomer
            </div>

            {/* Zoomed Preview Window (side panel on desktop) */}
            {isZooming && isValidImage && (
                <div 
                    className="hidden lg:block absolute left-full top-0 ml-4 w-[400px] h-[400px] border-2 border-gold-400 rounded-lg overflow-hidden shadow-2xl bg-white z-50"
                >
                    <img 
                        src={src} 
                        alt={alt}
                        className="w-[200%] h-[200%] object-cover"
                        style={{
                            transform: `translate(-${position.x}%, -${position.y}%)`,
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ImageZoom;
