/**
 * Promo Banner - First Purchase Discount
 * Sticky banner for new visitors
 */

import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check, Zap } from 'lucide-react';

const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const promoCode = 'BIENVENUE15';
  const discount = '15%';

  useEffect(() => {
    // Check if user has seen the banner before
    const hasSeenBanner = localStorage.getItem('promo_banner_seen');
    if (!hasSeenBanner) {
      // Show after 2 seconds
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('promo_banner_seen', 'true');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 text-primary-900 py-2.5 px-4 shadow-lg animate-slideDown">
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        <Gift className="w-5 h-5 animate-bounce" />
        
        <span className="font-bold text-sm md:text-base">
          🎉 Bienvenue! <span className="text-primary-800">-{discount}</span> sur votre 1ère commande
        </span>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-primary-900 text-white px-3 py-1.5 rounded-lg font-mono font-bold text-sm hover:bg-primary-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copié!
            </>
          ) : (
            <>
              <span>{promoCode}</span>
              <Copy className="w-4 h-4" />
            </>
          )}
        </button>

        <span className="hidden md:inline text-xs opacity-75">
          Valable 48h
        </span>

        <button
          onClick={handleClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
