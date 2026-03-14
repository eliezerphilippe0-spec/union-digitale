import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';

/**
 * TestimonialCarousel Component
 * Auto-rotating carousel of customer testimonials
 * Features glassmorphism design and smooth transitions
 */
const TestimonialCarousel = ({ autoPlayInterval = 5000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const testimonials = [
        {
            id: 1,
            name: 'Marie Dupont',
            role: 'Cliente Fidèle',
            avatar: '👩🏾',
            rating: 5,
            text: 'Zabely a transformé ma façon de faire mes achats en ligne. Livraison rapide et produits de qualité !',
            location: 'Port-au-Prince'
        },
        {
            id: 2,
            name: 'Jean-Baptiste Pierre',
            role: 'Vendeur Vérifié',
            avatar: '👨🏿',
            rating: 5,
            text: 'En tant que vendeur, la plateforme est intuitive et les paiements sont sécurisés. Mes ventes ont doublé en 3 mois !',
            location: 'Cap-Haïtien'
        },
        {
            id: 3,
            name: 'Sophie Laurent',
            role: 'Acheteuse Régulière',
            avatar: '👩🏽',
            rating: 5,
            text: 'Le service client est exceptionnel. J\'ai toujours une réponse rapide à mes questions. Je recommande vivement !',
            location: 'Pétion-Ville'
        },
        {
            id: 4,
            name: 'Marc Antoine',
            role: 'Entrepreneur',
            avatar: '👨🏾',
            rating: 5,
            text: 'Zabely m\'a permis de lancer mon business en ligne sans complications. Interface claire et support au top !',
            location: 'Jacmel'
        }
    ];

    // Auto-play functionality
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [isPaused, autoPlayInterval, testimonials.length]);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const currentTestimonial = testimonials[currentIndex];

    return (
        <div
            className="relative w-full max-w-4xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <Card
                variant="glass"
                padding="xl"
                className="relative overflow-hidden bg-gradient-to-br from-primary-900/90 to-primary-800/90 backdrop-blur-xl border-white/10"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    {/* Stars Rating */}
                    <div className="flex items-center justify-center gap-1 mb-6">
                        {[...Array(currentTestimonial.rating)].map((_, i) => (
                            <Star
                                key={i}
                                className="w-6 h-6 fill-gold-400 text-gold-400"
                            />
                        ))}
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="text-center mb-8">
                        <p className="text-xl md:text-2xl text-white font-medium leading-relaxed italic">
                            "{currentTestimonial.text}"
                        </p>
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-4xl shadow-xl">
                            {currentTestimonial.avatar}
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg font-bold text-white mb-1">
                                {currentTestimonial.name}
                            </h4>
                            <p className="text-sm text-white/80">
                                {currentTestimonial.role} • {currentTestimonial.location}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="absolute top-1/2 left-4 right-4 flex justify-between items-center -translate-y-1/2 pointer-events-none">
                    <button
                        onClick={goToPrevious}
                        className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                        aria-label="Témoignage précédent"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="pointer-events-auto w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                        aria-label="Témoignage suivant"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </div>
            </Card>

            {/* Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'w-8 bg-gold-500'
                                : 'w-2 bg-neutral-400 hover:bg-neutral-300'
                            }`}
                        aria-label={`Aller au témoignage ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default TestimonialCarousel;
