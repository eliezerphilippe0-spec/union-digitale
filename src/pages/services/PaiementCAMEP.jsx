import React, { useState } from 'react';
import SEO from '../../components/common/SEO';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplet, Shield, Clock, CheckCircle, Hash, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logTransaction, TRANSACTION_TYPES } from '../../utils/transactionLogger';
import './ServicePage.css';

const PaiementCAMEP = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        numeroClient: '',
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
                    type: TRANSACTION_TYPES.PAYMENT_CAMEP,
                    amount: formData.montant,
                    accountNumber: formData.numeroClient,
                    metadata: {
                        service: 'CAMEP Payment',
                        billingMonth: formData.mois,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Simulate processing
            setTimeout(() => {
                setIsProcessing(false);
                setShowSuccess(true);
                setTransactionRef(`CAM${Date.now().toString().slice(-8)}`);

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
        if (name === 'numeroClient' && value.length >= 6) {
            setIsLoadingAmount(true);
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    montant: Math.floor(Math.random() * 1500 + 300).toString()
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
                        <h2>Paiement CAMEP réussi !</h2>
                        <p>Votre facture d'eau a été payée</p>
                        <div className="success-details">
                            <p><strong>Client:</strong> {formData.numeroClient}</p>
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
            <SEO title="Paiement CAMEP" description="Payer vos factures CAMEP rapidement et en toute sécurité." />
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
                    <span className="breadcrumb-current">Paiement CAMEP</span>
                </nav>

                {/* Back Button */}
                <button onClick={() => navigate('/services')} className="back-button">
                    <ArrowLeft size={20} />
                    Retour aux services
                </button>

                {/* Service Header */}
                <div className="service-header">
                    <div className="service-icon-wrapper camep-icon">
                        <Droplet className="service-icon" size={48} />
                    </div>
                    <div className="service-header-content">
                        <h1 className="service-title">Paiement CAMEP</h1>
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
                        <Droplet size={20} />
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
                    <p>Payez votre facture d'eau CAMEP sans déplacement, rapidement et en toute sécurité.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label htmlFor="numeroClient">
                            <Hash size={18} />
                            Numéro client CAMEP
                        </label>
                        <input
                            type="text"
                            id="numeroClient"
                            name="numeroClient"
                            value={formData.numeroClient}
                            onChange={handleChange}
                            placeholder="Ex: 123456"
                            pattern="[0-9]{6,10}"
                            required
                            className="form-input"
                        />
                        <small className="form-hint">6 à 10 chiffres</small>
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
                                <Droplet size={20} />
                                Payer CAMEP
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

export default PaiementCAMEP;
