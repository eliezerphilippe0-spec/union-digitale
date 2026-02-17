import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { logVerifiedSellerBadgeImpression } from '../../services/marketAnalytics';

const VerifiedSellerBadge = ({ storeId, location, productId }) => {
  const { t } = useLanguage();

  useEffect(() => {
    logVerifiedSellerBadgeImpression({ storeId, location, productId });
  }, [storeId, location, productId]);

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full"
      title={t('verified_seller_tooltip') || 'Identité et contact vérifiés par Union Digitale'}
    >
      <ShieldCheck className="w-3 h-3" />
      {t('verified_seller_badge') || 'Vendeur vérifié'}
    </span>
  );
};

export default VerifiedSellerBadge;
