import React from 'react';
import { ShoppingBag, Truck, CreditCard, ArrowRight } from 'lucide-react';
import Button from './ui/Button';

/**
 * Full-Width CTA Section
 * Harmonized with dark modern theme - Premium design
 */

const FullWidthCTA = () => {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 py-20">
            {/* Background Effects - Matching Hero */}
            <div className="absolute inset-0">
                {/* Glowing orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Grid pattern - Subtle */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
            }}></div>

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}></div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                {/* Main Heading */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fadeIn">
                    Prêt à découvrir{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-300">
                        Union Digitale
                    </span> ?
                </h2>

                {/* Subheading */}
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto font-medium animate-fadeIn leading-relaxed" style={{ animationDelay: '0.1s' }}>
                    Rejoignez des milliers d'Haïtiens qui font confiance à notre marketplace.
                    <br />
                    L'inscription est gratuite et prend moins de 2 minutes.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <Button
                        variant="primary"
                        size="lg"
                        icon={ShoppingBag}
                        onClick={() => window.location.href = '/register'}
                        className="group relative overflow-hidden bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-primary-900 font-bold shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all duration-300 text-lg px-8 py-4"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Commencer maintenant
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => window.location.href = '/catalog'}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all duration-300 text-lg px-8 py-4 font-semibold"
                    >
                        Voir le catalogue
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-center gap-3 text-white">
                        <div className="w-12 h-12 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Truck className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg">Livraison rapide</p>
                            <p className="text-sm font-medium text-gray-400">Partout en Haïti</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-white">
                        <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/20">
                            <CreditCard className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg">Paiement sécurisé</p>
                            <p className="text-sm font-medium text-gray-400">MonCash & cartes</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-white">
                        <div className="w-12 h-12 bg-gold-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-gold-500/20">
                            <ShoppingBag className="w-6 h-6 text-gold-400" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg">+10,000 produits</p>
                            <p className="text-sm font-medium text-gray-400">Vendeurs vérifiés</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FullWidthCTA;
