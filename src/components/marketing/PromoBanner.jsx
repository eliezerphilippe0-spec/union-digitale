/**
 * Promo Banner - First Purchase Discount
 * Sticky banner for new visitors
 */

import React, { useState, useEffect } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';

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
    <div className="bg-gray-900 text-white py-3 px-4 animate-slideDown border-b border-gray-800">
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap relative">
        <Gift className="w-4 h-4" />
        
        <span className="font-medium text-sm md:text-base">
          Bienvenue sur Zabely ! <strong className="text-green-400">-{discount}</strong> sur votre première commande avec le code:
        </span>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-white text-gray-900 px-3 py-1.5 rounded font-mono font-bold text-sm transition-colors hover:bg-gray-200"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copié !</span>
            </>
          ) : (
            <>
              <span>{promoCode}</span>
              <Copy className="w-4 h-4 opacity-70" />
            </>
          )}
        </button>

        <button
          onClick={handleClose}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
