/**
 * Affiliation Context - Enhanced
 * Persistent cookie tracking (30 days) + promo codes + category commissions
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, increment, updateDoc } from 'firebase/firestore';
import logger from '../utils/logger';

const AffiliationContext = createContext();

export const useAffiliation = () => {
  return useContext(AffiliationContext);
};

// Cookie utilities
const COOKIE_NAME = 'ud_affiliate';
const COOKIE_DAYS = 30;

function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export const AffiliationProvider = ({ children }) => {
  const [referralData, setReferralData] = useState(null);
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [promoCode, setPromoCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Load affiliate data from cookie or URL
  useEffect(() => {
    loadAffiliateData();
  }, [location]);

  async function loadAffiliateData() {
    try {
      const searchParams = new URLSearchParams(location.search);
      const refCode = searchParams.get('ref');
      const promoParam = searchParams.get('promo') || searchParams.get('code');
      const campaign = searchParams.get('campaign') || searchParams.get('utm_campaign');
      const source = searchParams.get('utm_source');

      // Priority: URL params > Cookie
      if (refCode) {
        // New referral from URL
        const affiliate = await lookupAffiliate(refCode);
        if (affiliate) {
          const data = {
            affiliateId: affiliate.id,
            affiliateCode: refCode,
            campaign: campaign || 'direct',
            source: source || 'link',
            timestamp: new Date().toISOString(),
            landingPage: window.location.pathname,
          };

          setCookie(COOKIE_NAME, data, COOKIE_DAYS);
          setReferralData(data);
          setAffiliateInfo(affiliate);

          // Track click
          await trackClick(affiliate.id, data);

          logger.info('Affiliate referral tracked:', data);
        }
      } else if (promoParam) {
        // Promo code entry
        const result = await lookupPromoCode(promoParam);
        if (result) {
          const data = {
            affiliateId: result.affiliateId,
            affiliateCode: result.affiliateCode,
            promoCode: promoParam,
            campaign: campaign || 'promo',
            source: 'promo_code',
            timestamp: new Date().toISOString(),
          };

          setCookie(COOKIE_NAME, data, COOKIE_DAYS);
          setReferralData(data);
          setPromoCode(result.promo);

          logger.info('Promo code tracked:', data);
        }
      } else {
        // Check for existing cookie
        const savedData = getCookie(COOKIE_NAME);
        if (savedData) {
          setReferralData(savedData);

          // Load affiliate info
          if (savedData.affiliateId) {
            const affiliate = await lookupAffiliateById(savedData.affiliateId);
            setAffiliateInfo(affiliate);
          }

          logger.info('Loaded affiliate from cookie:', savedData);
        }
      }
    } catch (error) {
      logger.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Lookup affiliate by code
  async function lookupAffiliate(code) {
    try {
      const q = query(
        collection(db, 'ambassadors'),
        where('code', '==', code.toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // Also check affiliates collection
      const q2 = query(
        collection(db, 'affiliates'),
        where('code', '==', code.toUpperCase())
      );
      const snapshot2 = await getDocs(q2);

      if (!snapshot2.empty) {
        const doc = snapshot2.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      return null;
    } catch (error) {
      logger.error('Error looking up affiliate:', error);
      return null;
    }
  }

  // Lookup affiliate by ID
  async function lookupAffiliateById(id) {
    try {
      let docRef = doc(db, 'ambassadors', id);
      let docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      docRef = doc(db, 'affiliates', id);
      docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      logger.error('Error looking up affiliate by ID:', error);
      return null;
    }
  }

  // Lookup promo code
  async function lookupPromoCode(code) {
    try {
      const q = query(
        collection(db, 'affiliate_promo_codes'),
        where('code', '==', code.toUpperCase()),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const promoDoc = snapshot.docs[0];
        const promo = promoDoc.data();

        // Check expiry
        if (promo.expiresAt && promo.expiresAt.toDate() < new Date()) {
          return null;
        }

        // Check usage limit
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
          return null;
        }

        return {
          promo: { id: promoDoc.id, ...promo },
          affiliateId: promo.affiliateId,
          affiliateCode: promo.affiliateCode,
        };
      }

      return null;
    } catch (error) {
      logger.error('Error looking up promo code:', error);
      return null;
    }
  }

  // Track affiliate click
  async function trackClick(affiliateId, data) {
    try {
      // Update click count
      const ambassadorRef = doc(db, 'ambassadors', affiliateId);
      await updateDoc(ambassadorRef, {
        clicksCount: increment(1),
        lastClickAt: new Date(),
      }).catch(() => {
        // Try affiliates collection
        const affiliateRef = doc(db, 'affiliates', affiliateId);
        return updateDoc(affiliateRef, {
          clicksCount: increment(1),
          lastClickAt: new Date(),
        });
      });

      // Log click event
      // Could add to affiliate_clicks collection for detailed analytics
    } catch (error) {
      logger.error('Error tracking click:', error);
    }
  }

  // Apply promo code manually
  const applyPromoCode = useCallback(async (code) => {
    const result = await lookupPromoCode(code);
    if (result) {
      const data = {
        affiliateId: result.affiliateId,
        affiliateCode: result.affiliateCode,
        promoCode: code,
        campaign: 'manual_promo',
        source: 'promo_code',
        timestamp: new Date().toISOString(),
      };

      setCookie(COOKIE_NAME, data, COOKIE_DAYS);
      setReferralData(data);
      setPromoCode(result.promo);

      return { success: true, promo: result.promo };
    }

    return { success: false, error: 'Code promo invalide ou expiré' };
  }, []);

  // Get commission rate for a product/category
  const getCommissionRate = useCallback(async (productId, categoryId, vendorId) => {
    try {
      // 1. Check product-specific commission
      if (productId) {
        const productCommissionDoc = await getDoc(
          doc(db, 'affiliate_commissions', `product_${productId}`)
        );
        if (productCommissionDoc.exists()) {
          return productCommissionDoc.data().rate;
        }
      }

      // 2. Check category commission
      if (categoryId) {
        const categoryCommissionDoc = await getDoc(
          doc(db, 'affiliate_commissions', `category_${categoryId}`)
        );
        if (categoryCommissionDoc.exists()) {
          return categoryCommissionDoc.data().rate;
        }
      }

      // 3. Check vendor-specific rate
      if (vendorId) {
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        if (vendorDoc.exists() && vendorDoc.data().affiliateCommissionRate) {
          return vendorDoc.data().affiliateCommissionRate;
        }
      }

      // 4. Check affiliate's custom rate
      if (affiliateInfo?.customCommissionRate) {
        return affiliateInfo.customCommissionRate;
      }

      // 5. Default rate
      return 0.05; // 5% default
    } catch (error) {
      logger.error('Error getting commission rate:', error);
      return 0.05;
    }
  }, [affiliateInfo]);

  // Calculate commission for an order
  const calculateOrderCommission = useCallback(async (items) => {
    if (!referralData?.affiliateId) {
      return { total: 0, breakdown: [] };
    }

    let total = 0;
    const breakdown = [];

    for (const item of items) {
      const rate = await getCommissionRate(
        item.productId,
        item.categoryId,
        item.vendorId
      );

      const itemTotal = item.price * item.quantity;
      const commission = itemTotal * rate;

      total += commission;
      breakdown.push({
        productId: item.productId,
        productName: item.name,
        amount: itemTotal,
        rate,
        commission,
      });
    }

    return { total, breakdown };
  }, [referralData, getCommissionRate]);

  // Clear referral (after order or manually)
  const clearReferral = useCallback(() => {
    deleteCookie(COOKIE_NAME);
    setReferralData(null);
    setAffiliateInfo(null);
    setPromoCode(null);
  }, []);

  // Get referral data for order
  const getReferralForOrder = useCallback(() => {
    if (!referralData) return null;

    return {
      affiliateId: referralData.affiliateId,
      affiliateCode: referralData.affiliateCode,
      promoCode: referralData.promoCode || null,
      campaign: referralData.campaign,
      source: referralData.source,
      referredAt: referralData.timestamp,
    };
  }, [referralData]);

  const value = {
    // State
    referralData,
    affiliateInfo,
    promoCode,
    loading,
    hasReferral: !!referralData,

    // Actions
    applyPromoCode,
    getCommissionRate,
    calculateOrderCommission,
    clearReferral,
    getReferralForOrder,
  };

  return (
    <AffiliationContext.Provider value={value}>
      {children}
    </AffiliationContext.Provider>
  );
};
