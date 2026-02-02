import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Shield, Clock, CheckCircle, Phone, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logTransaction, TRANSACTION_TYPES } from '../../utils/transactionLogger';
import './ServicePage.css';

const RechargeMonCash = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        numeroMonCash: '',
        montant: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [transactionRef, setTransactionRef] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            // Log transaction to Firestore
            if (currentUser) {
                const transactionId = await logTransaction({
                    userId: currentUser.uid,
                    type: TRANSACTION_TYPES.RECHARGE_MONCASH,
                    amount: formData.montant,
                    phoneNumber: formData.numeroMonCash,
                    metadata: {
                        service: 'MonCash Recharge',
                        timestamp: new Date().toISOString()
                    }
                });

                // Simulate processing
                setTimeout(() => {
                    setIsProcessing(false);
                    setShowSuccess(true);
                    setTransactionRef(`MCH${Date.now().toString().slice(-8)}`);

                    setTimeout(() => {
                        navigate('/services');
                    }, 3000);
                }, 2000);
            } else {
                // Guest mode - just simulate
                setTimeout(() => {
                    setIsProcessing(false);
                    setShowSuccess(true);
                    setTransactionRef(`MCH${Date.now().toString().slice(-8)}`);

                    setTimeout(() => {
                        navigate('/services');
                    }, 3000);
                }, 2000);
            }
        } catch (error) {
            console.error('Transaction error:', error);
            setIsProcessing(false);
            alert('Erreur lors de la transaction. Veuillez réessayer.');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (showSuccess) {
        return (
            <div className="service-page">
                <div className="service-container">
                    <div className="success-animation">
                        <div className="success-checkmark">
                            <CheckCircle size={80} />
                        </div>
                        <h2>Recharge réussie !</h2>
                        <p>Votre compte MonCash a été rechargé</p>
                        <div className="success-details">
                            <p><strong>Numéro:</strong> {formData.numeroMonCash}</p>
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
                    <span className="breadcrumb-current">Recharge MonCash</span>
                </nav>

                {/* Back Button */}
                <button onClick={() => navigate('/services')} className="back-button">
                    <ArrowLeft size={20} />
                    Retour aux services
                </button>

                {/* Service Header */}
                <div className="service-header">
                    <div className="service-icon-wrapper">
                        <Smartphone className="service-icon" size={48} />
                    </div>
                    <div className="service-header-content">
                        <h1 className="service-title">Recharge MonCash</h1>
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
                        <Smartphone size={20} />
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
                    <p>Rechargez votre compte MonCash en quelques secondes de manière sécurisée.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label htmlFor="numeroMonCash">
                            <Phone size={18} />
                            Numéro MonCash
                        </label>
                        <input
                            type="tel"
                            id="numeroMonCash"
                            name="numeroMonCash"
                            value={formData.numeroMonCash}
                            onChange={handleChange}
                            placeholder="Ex: 3712-3456"
                            pattern="[0-9]{4}-[0-9]{4}"
                            required
                            className="form-input"
                        />
                        <small className="form-hint">Format: XXXX-XXXX</small>
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
                            placeholder="Ex: 500"
                            min="50"
                            max="50000"
                            required
                            className="form-input"
                        />
                        <small className="form-hint">Minimum: 50 HTG - Maximum: 50,000 HTG</small>
                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner"></div>
                                Traitement en cours...
                            </>
                        ) : (
                            <>
                                <Smartphone size={20} />
                                Recharger maintenant
                            </>
                        )}
                    </button>
                </form>

                {/* Security Notice */}
                <div className="security-notice">
                    <Shield size={20} />
                    <p>Toutes les transactions sont cryptées et sécurisées. Vos informations sont protégées.</p>
                </div>
            </div>
        </div>
    );
};

export default RechargeMonCash;
