import React, { useState } from 'react';
import SEO from '../../components/common/SEO';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Shield, Clock, CheckCircle, Hash, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logTransaction, TRANSACTION_TYPES } from '../../utils/transactionLogger';
import './ServicePage.css';

const PaiementEDH = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        numeroCompteur: '',
        mois: '',
        montant: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoadingAmount, setIsLoadingAmount] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            // Log transaction to Firestore
            if (currentUser) {
                await logTransaction({
                    userId: currentUser.uid,
                    type: TRANSACTION_TYPES.PAYMENT_EDH,
                    amount: formData.montant,
                    accountNumber: formData.numeroCompteur,
                    metadata: {
                        service: 'EDH Payment',
                        billingMonth: formData.mois,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Simulate processing
            setTimeout(() => {
                setIsProcessing(false);
                setShowSuccess(true);
                setTransactionRef(`EDH${Date.now().toString().slice(-8)}`);

                setTimeout(() => {
                    navigate('/services');
                }, 3000);
            }, 2000);
        } catch (error) {
            console.error('Transaction error:', error);
            setIsProcessing(false);
            alert('Erreur lors du paiement. Veuillez réessayer.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Simuler le chargement automatique du montant
        if (name === 'numeroCompteur' && value.length >= 8) {
            setIsLoadingAmount(true);
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    montant: Math.floor(Math.random() * 2000 + 500).toString()
                }));
                setIsLoadingAmount(false);
            }, 1000);
        }
    };

    if (showSuccess) {
        return (
            <div className="service-page">
                <div className="service-container">
                    <div className="success-animation">
                        <div className="success-checkmark">
                            <CheckCircle size={80} />
                        </div>
                        <h2>Paiement EDH réussi !</h2>
                        <p>Votre facture d'électricité a été payée</p>
                        <div className="success-details">
                            <p><strong>Compteur:</strong> {formData.numeroCompteur}</p>
                            <p><strong>Mois:</strong> {formData.mois}</p>
                            <p><strong>Montant:</strong> {formData.montant} HTG</p>
                            <p><strong>Référence:</strong> {transactionRef}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="service-page">
            <SEO title="Paiement EDH" description="Payer vos factures EDH rapidement et en toute sécurité." />
            <div className="service-container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <button onClick={() => navigate('/services')} className="breadcrumb-link">
                        Services
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <button onClick={() => navigate('/services')} className="breadcrumb-link">
                        Financier
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">Paiement EDH</span>
                </nav>

                {/* Back Button */}
                <button onClick={() => navigate('/services')} className="back-button">
                    <ArrowLeft size={20} />
                    Retour aux services
                </button>

                {/* Service Header */}
                <div className="service-header">
                    <div className="service-icon-wrapper edh-icon">
                        <Zap className="service-icon" size={48} />
                    </div>
                    <div className="service-header-content">
                        <h1 className="service-title">Paiement EDH</h1>
                        <div className="service-provider">
                            <span>Fournisseur : Union Digitale</span>
                            <span className="verified-badge">✓ Vérifié</span>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="quick-info">
                    <div className="info-item">
                        <Clock size={20} />
                        <div>
                            <div className="info-label">Durée</div>
                            <div className="info-value">Instantané</div>
                        </div>
                    </div>
                    <div className="info-item">
                        <Zap size={20} />
                        <div>
                            <div className="info-label">Mode</div>
                            <div className="info-value">En ligne</div>
                        </div>
                    </div>
                    <div className="info-item">
                        <Shield size={20} />
                        <div>
                            <div className="info-label">Sécurité</div>
                            <div className="info-value">Cryptée</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="service-description">
                    <p>Payez votre facture d'électricité EDH en ligne sans déplacement.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label htmlFor="numeroCompteur">
                            <Hash size={18} />
                            Numéro de compteur
                        </label>
                        <input
                            type="text"
                            id="numeroCompteur"
                            name="numeroCompteur"
                            value={formData.numeroCompteur}
                            onChange={handleChange}
                            placeholder="Ex: 12345678"
                            pattern="[0-9]{8,12}"
                            required
                            className="form-input"
                        />
                        <small className="form-hint">8 à 12 chiffres</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="mois">
                            <Calendar size={18} />
                            Mois de facturation
                        </label>
                        <input
                            type="month"
                            id="mois"
                            name="mois"
                            value={formData.mois}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="montant">
                            <DollarSign size={18} />
                            Montant (HTG)
                        </label>
                        <input
                            type="number"
                            id="montant"
                            name="montant"
                            value={formData.montant}
                            onChange={handleChange}
                            placeholder={isLoadingAmount ? "Chargement..." : "Montant automatique"}
                            readOnly
                            required
                            className="form-input"
                        />
                        <small className="form-hint">Le montant est calculé automatiquement</small>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isProcessing || !formData.montant}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner"></div>
                                Traitement en cours...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                Payer EDH
                            </>
                        )}
                    </button>
                </form>

                {/* Security Notice */}
                <div className="security-notice">
                    <Shield size={20} />
                    <p>Paiement sécurisé. Votre facture sera mise à jour instantanément.</p>
                </div>
            </div>
        </div>
    );
};

export default PaiementEDH;
