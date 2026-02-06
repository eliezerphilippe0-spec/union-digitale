import React, { useState } from 'react';
import { 
  DollarSign, Clock, CheckCircle, AlertCircle,
  TrendingUp, FileText, ArrowRight, Shield,
  Percent, Calendar, CreditCard
} from 'lucide-react';

const creditOffers = [
  {
    id: 'starter',
    name: 'Crédit Démarrage',
    amount: 50000,
    currency: 'FCFA',
    duration: '3 mois',
    rate: 5,
    monthlyPayment: 17500,
    requirements: ['3 mois d\'activité', '10 ventes minimum'],
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'growth',
    name: 'Crédit Croissance',
    amount: 200000,
    currency: 'FCFA',
    duration: '6 mois',
    rate: 8,
    monthlyPayment: 36000,
    requirements: ['6 mois d\'activité', '50 ventes minimum', 'Score vendeur > 4.0'],
    color: 'from-primary-500 to-primary-600',
    popular: true
  },
  {
    id: 'expansion',
    name: 'Crédit Expansion',
    amount: 500000,
    currency: 'FCFA',
    duration: '12 mois',
    rate: 10,
    monthlyPayment: 46000,
    requirements: ['12 mois d\'activité', '200 ventes minimum', 'Score vendeur > 4.5', 'Chiffre d\'affaires > 2M'],
    color: 'from-purple-500 to-purple-600'
  }
];

const sellerStats = {
  eligibility: 85,
  monthsActive: 8,
  totalSales: 127,
  rating: 4.6,
  revenue: 1850000,
  activeLoans: 0,
  creditLimit: 300000
};

const loanHistory = [
  {
    id: 1,
    amount: 100000,
    date: '2024-06-15',
    status: 'paid',
    paidDate: '2024-09-15'
  }
];

export default function SellerCredit() {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationStep, setApplicationStep] = useState(1);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const handleApply = (offer) => {
    setSelectedOffer(offer);
    setShowApplication(true);
    setApplicationStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Crédit Vendeur</h1>
        <p className="text-green-100 text-sm">
          Financez votre croissance avec des conditions avantageuses
        </p>
      </div>

      {/* Eligibility Score */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Votre éligibilité</p>
              <p className="text-2xl font-bold text-gray-900">{sellerStats.eligibility}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#22c55e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${sellerStats.eligibility * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <Shield className="absolute inset-0 m-auto text-green-600" size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" />
              <span>{sellerStats.monthsActive} mois d'activité</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-gray-400" />
              <span>{sellerStats.totalSales} ventes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              <span>Note: {sellerStats.rating}/5</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="text-gray-400" />
              <span>{formatCurrency(sellerStats.revenue)} FCFA</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Limite de crédit disponible</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(sellerStats.creditLimit)} FCFA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Offers */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Offres de crédit</h2>
        
        <div className="space-y-4">
          {creditOffers.map(offer => {
            const isEligible = offer.amount <= sellerStats.creditLimit;
            return (
              <div 
                key={offer.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm border ${
                  offer.popular ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'
                }`}
              >
                {offer.popular && (
                  <div className="bg-primary-600 text-white text-xs text-center py-1">
                    ⭐ Le plus populaire
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{offer.name}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(offer.amount)} <span className="text-sm font-normal">{offer.currency}</span>
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${offer.color} flex items-center justify-center text-white`}>
                      <CreditCard size={20} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <Calendar className="mx-auto text-gray-400 mb-1" size={16} />
                      <p className="text-xs text-gray-600">Durée</p>
                      <p className="text-sm font-semibold">{offer.duration}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <Percent className="mx-auto text-gray-400 mb-1" size={16} />
                      <p className="text-xs text-gray-600">Taux</p>
                      <p className="text-sm font-semibold">{offer.rate}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <DollarSign className="mx-auto text-gray-400 mb-1" size={16} />
                      <p className="text-xs text-gray-600">Mensualité</p>
                      <p className="text-sm font-semibold">{formatCurrency(offer.monthlyPayment)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Conditions requises:</p>
                    <div className="flex flex-wrap gap-1">
                      {offer.requirements.map((req, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleApply(offer)}
                    disabled={!isEligible}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      isEligible
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isEligible ? (
                      <>
                        Demander ce crédit
                        <ArrowRight />
                      </>
                    ) : (
                      <>
                        <AlertCircle />
                        Non éligible
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loan History */}
      {loanHistory.length > 0 && (
        <div className="px-4 mt-8">
          <h2 className="text-lg font-semibold mb-4">Historique des crédits</h2>
          
          <div className="space-y-3">
            {loanHistory.map(loan => (
              <div 
                key={loan.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(loan.amount)} FCFA
                    </p>
                    <p className="text-sm text-gray-500">
                      Demandé le {new Date(loan.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    loan.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {loan.status === 'paid' ? '✓ Remboursé' : 'En cours'}
                  </span>
                </div>
                {loan.paidDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    Remboursé le {new Date(loan.paidDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplication && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between">
              <h3 className="font-semibold">Demande de crédit</h3>
              <button 
                onClick={() => setShowApplication(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map(step => (
                  <React.Fragment key={step}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      applicationStep >= step 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {applicationStep > step ? <CheckCircle /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 rounded ${
                        applicationStep > step ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {applicationStep === 1 && (
                <div>
                  <h4 className="font-medium mb-4">Résumé de l'offre</h4>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Montant</span>
                      <span className="font-semibold">{formatCurrency(selectedOffer.amount)} FCFA</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Durée</span>
                      <span className="font-semibold">{selectedOffer.duration}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Taux d'intérêt</span>
                      <span className="font-semibold">{selectedOffer.rate}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="text-gray-600">Mensualité</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(selectedOffer.monthlyPayment)} FCFA
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setApplicationStep(2)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium"
                  >
                    Continuer
                  </button>
                </div>
              )}

              {applicationStep === 2 && (
                <div>
                  <h4 className="font-medium mb-4">Vérification d'identité</h4>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Pièce d'identité</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">Téléverser votre CNI ou passeport</p>
                        <button className="mt-2 text-sm text-primary-600 font-medium">
                          Choisir un fichier
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Numéro de téléphone</label>
                      <input
                        type="tel"
                        placeholder="+221 77 123 45 67"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setApplicationStep(1)}
                      className="flex-1 py-3 border rounded-lg font-medium"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setApplicationStep(3)}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium"
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              )}

              {applicationStep === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600" size={40} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Demande envoyée!</h4>
                  <p className="text-gray-600 mb-6">
                    Votre demande de crédit de {formatCurrency(selectedOffer.amount)} FCFA 
                    est en cours de traitement. Vous recevrez une réponse sous 24-48h.
                  </p>
                  <button
                    onClick={() => {
                      setShowApplication(false);
                      setApplicationStep(1);
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
