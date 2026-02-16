import React from 'react';
import { useSellerTrust } from '../../hooks/useSellerTrust';
import TrustHeader from '../../components/seller/trust/TrustHeader';
import TrustInfluenceSection from '../../components/seller/trust/TrustInfluenceSection';
import TrustTimeline from '../../components/seller/trust/TrustTimeline';
import TrustBenefits from '../../components/seller/trust/TrustBenefits';
import TrustImprovementTips from '../../components/seller/trust/TrustImprovementTips';

const TrustPage = () => {
  const { data, loading, error } = useSellerTrust();

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-600">Impossible de charger le niveau de confiance.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <TrustHeader tier={data.tier} updatedAt={data.updatedAt} />
      <TrustInfluenceSection positives={data.positives || []} warnings={data.warnings || []} />
      <TrustTimeline timeline={data.timeline || []} />
      <TrustBenefits payoutDelayHours={data.benefits?.payoutDelayHours} listingBoostFactor={data.benefits?.listingBoostFactor} tier={data.tier} />
      <TrustImprovementTips tier={data.tier} warnings={data.warnings || []} />
    </div>
  );
};

export default TrustPage;
