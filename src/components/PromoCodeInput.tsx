/**
 * Promo Code Input Component
 * For checkout - validates and applies affiliate promo codes
 */

import React, { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { useAffiliation } from '../contexts/AffiliationContext';

interface PromoCodeInputProps {
  cartTotal: number;
  onApply: (discount: number, promoData: any) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export default function PromoCodeInput({
  cartTotal,
  onApply,
  onRemove,
  disabled = false,
}: PromoCodeInputProps) {
  const { promoCode, applyPromoCode, clearReferral } = useAffiliation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<any>(promoCode);

  async function handleApply() {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await applyPromoCode(code.trim());

      if (result.success) {
        setAppliedCode(result.promo);
        setCode('');

        // Calculate discount
        let discount = 0;
        if (result.promo.discountType === 'percentage') {
          discount = cartTotal * (result.promo.discountValue / 100);
        } else {
          discount = Math.min(result.promo.discountValue, cartTotal);
        }

        onApply(discount, result.promo);
      } else {
        setError(result.error || 'Code invalide');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    setAppliedCode(null);
    clearReferral();
    onRemove();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  }

  // Already has an applied code
  if (appliedCode) {
    const discount =
      appliedCode.discountType === 'percentage'
        ? cartTotal * (appliedCode.discountValue / 100)
        : Math.min(appliedCode.discountValue, cartTotal);

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                Code appliqué: <span className="font-mono">{appliedCode.code}</span>
              </p>
              <p className="text-sm text-green-600">
                {appliedCode.discountType === 'percentage'
                  ? `-${appliedCode.discountValue}%`
                  : `-${appliedCode.discountValue} G`}
                {' '}
                = <span className="font-semibold">-{Math.round(discount).toLocaleString()} G</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            title="Retirer le code"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Code promo ou parrain
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Entrez votre code"
            disabled={disabled || loading}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase font-mono ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || disabled || loading}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>...</span>
            </>
          ) : (
            'Appliquer'
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for cart sidebar
 */
export function PromoCodeInputCompact({
  cartTotal,
  onApply,
  onRemove,
}: PromoCodeInputProps) {
  const { promoCode, applyPromoCode, clearReferral } = useAffiliation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<any>(promoCode);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleApply() {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await applyPromoCode(code.trim());

      if (result.success) {
        setAppliedCode(result.promo);
        setCode('');

        let discount = 0;
        if (result.promo.discountType === 'percentage') {
          discount = cartTotal * (result.promo.discountValue / 100);
        } else {
          discount = Math.min(result.promo.discountValue, cartTotal);
        }

        onApply(discount, result.promo);
        setIsExpanded(false);
      } else {
        setError(result.error || 'Code invalide');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg text-sm">
        <span className="text-green-700">
          <Check className="w-4 h-4 inline mr-1" />
          {appliedCode.code}
        </span>
        <button
          onClick={() => {
            setAppliedCode(null);
            clearReferral();
            onRemove();
          }}
          className="text-green-600 hover:text-green-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
      >
        <Tag className="w-4 h-4" />
        Ajouter un code promo
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="CODE"
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm uppercase font-mono"
          autoFocus
        />
        <button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-3 py-2 bg-gray-900 text-white rounded text-sm disabled:bg-gray-300"
        >
          {loading ? '...' : 'OK'}
        </button>
        <button
          onClick={() => setIsExpanded(false)}
          className="px-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
