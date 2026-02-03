/**
 * Affiliate Service - Frontend
 * Calls Cloud Functions for affiliate operations
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageCount?: number;
}

export interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  currentMonthEarnings: number;
  referralsCount: number;
  clicksCount: number;
  conversionRate: number;
  level: string;
  code: string;
}

export interface CommissionLog {
  id: string;
  orderId: string;
  orderTotal: number;
  commission: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

/**
 * Generate a promo code for the affiliate
 */
export async function generatePromoCode(
  preferredCode?: string,
  discountType: 'percentage' | 'fixed' = 'percentage',
  discountValue: number = 10
): Promise<PromoCode> {
  const generate = httpsCallable<
    { preferredCode?: string; discountType: string; discountValue: number },
    { success: boolean; promoCode?: PromoCode; error?: string }
  >(functions, 'generateAffiliatePromoCode');

  const result = await generate({ preferredCode, discountType, discountValue });

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to generate promo code');
  }

  return result.data.promoCode!;
}

/**
 * Validate a promo code
 */
export async function validatePromoCode(
  code: string,
  cartTotal: number
): Promise<{
  valid: boolean;
  discount?: number;
  promoId?: string;
  affiliateId?: string;
  error?: string;
}> {
  const validate = httpsCallable<
    { code: string; cartTotal: number },
    {
      valid: boolean;
      discount?: number;
      promoId?: string;
      affiliateId?: string;
      error?: string;
    }
  >(functions, 'validatePromoCode');

  const result = await validate({ code, cartTotal });
  return result.data;
}

/**
 * Get affiliate dashboard stats
 */
export async function getAffiliateStats(): Promise<{
  stats: AffiliateStats;
  recentCommissions: CommissionLog[];
  promoCodes: PromoCode[];
}> {
  const getStats = httpsCallable<
    {},
    {
      success: boolean;
      stats?: AffiliateStats;
      recentCommissions?: any[];
      promoCodes?: PromoCode[];
      error?: string;
    }
  >(functions, 'getAffiliateStats');

  const result = await getStats({});

  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to get stats');
  }

  return {
    stats: result.data.stats!,
    recentCommissions: result.data.recentCommissions || [],
    promoCodes: result.data.promoCodes || [],
  };
}

/**
 * Get commission rate for a product
 */
export async function getCommissionRate(
  productId?: string,
  categoryId?: string,
  vendorId?: string
): Promise<{ rate: number; source: string }> {
  const getRate = httpsCallable<
    { productId?: string; categoryId?: string; vendorId?: string },
    { rate: number; source: string }
  >(functions, 'getAffiliateCommissionRate');

  const result = await getRate({ productId, categoryId, vendorId });
  return result.data;
}

/**
 * Process affiliate commission for an order
 */
export async function processOrderCommission(
  orderId: string,
  affiliateData: {
    affiliateId: string;
    affiliateCode: string;
    promoCode?: string;
    campaign?: string;
    source?: string;
  }
): Promise<{
  success: boolean;
  commission?: number;
  breakdown?: any[];
}> {
  const process = httpsCallable<
    { orderId: string; affiliateData: any },
    { success: boolean; commission?: number; breakdown?: any[]; error?: string }
  >(functions, 'processAffiliateCommission');

  const result = await process({ orderId, affiliateData });

  if (!result.data.success) {
    console.error('Failed to process commission:', result.data.error);
  }

  return result.data;
}

/**
 * Format currency for display
 */
export function formatCommission(amount: number): string {
  return `${Math.round(amount).toLocaleString()} G`;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(clicks: number, conversions: number): string {
  if (clicks === 0) return '0%';
  return `${((conversions / clicks) * 100).toFixed(1)}%`;
}

/**
 * Get level badge color
 */
export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    Bronze: 'bg-amber-100 text-amber-800',
    Silver: 'bg-gray-100 text-gray-800',
    Gold: 'bg-yellow-100 text-yellow-800',
    Platinum: 'bg-purple-100 text-purple-800',
    Diamond: 'bg-blue-100 text-blue-800',
  };
  return colors[level] || colors.Bronze;
}
