import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Shield, Clock, CheckCircle, User, Phone, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logTransaction, TRANSACTION_TYPES } from '../../utils/transactionLogger';
import './ServicePage.css';

const TransfertArgent = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        beneficiaire: '',
        telephone: '',
        montant: '',
        methode: 'moncash'
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
                await logTransaction({
                    userId: currentUser.uid,
                    type: TRANSACTION_TYPES.TRANSFER,
                    amount: formData.montant,
                    recipient: formData.beneficiaire,
                    phoneNumber: formData.telephone,
                    metadata: {
                        service: 'Money Transfer',
                        paymentMethod: formData.methode,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // Simulate processing
            setTimeout(() => {
                setIsProcessing(false);
                setShowSuccess(true);
                setTransactionRef(`TRF${Date.now().toString().slice(-8)}`);

                setTimeout(() => {
                    navigate('/services');
                }, 3000);
            }, 2000);
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
                        <h2>Transfert réussi !</h2>
                        <p>Votre argent a été envoyé à {formData.beneficiaire}</p>
                        <div className="success-details">
                            <p><strong>Montant:</strong> {formData.montant} HTG</p>
                            <p><strong>Méthode:</strong> {formData.methode === 'moncash' ? 'MonCash' : 'NatCash'}</p>
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
                    <span className="breadcrumb-current">Transfert d'argent</span>
                </nav>

                {/* Back Button */}
                <button onClick={() => navigate('/services')} className="back-button">
                    <ArrowLeft size={20} />
                    Retour aux services
                </button>

                {/* Service Header */}
                <div className="service-header">
                    <div className="service-icon-wrapper">
                        <Send className="service-icon" size={48} />
                    </div>
                    <div className="service-header-content">
                        <h1 className="service-title">Transfert d'argent</h1>
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
                        <Send size={20} />
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
                    <p>Envoyez de l'argent instantanément partout en Haïti de manière sécurisée.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label htmlFor="beneficiaire">
                            <User size={18} />
                            Nom du bénéficiaire
                        </label>
                        <input
                            type="text"
                            id="beneficiaire"
                            name="beneficiaire"
                            value={formData.beneficiaire}
                            onChange={handleChange}
                            placeholder="Ex: Jean Baptiste"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="telephone">
                            <Phone size={18} />
                            Numéro de téléphone
                        </label>
                        <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
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

                    <div className="form-group">
                        <label htmlFor="methode">
                            <Shield size={18} />
                            Méthode de paiement
                        </label>
                        <select
                            id="methode"
                            name="methode"
                            value={formData.methode}
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            <option value="moncash">MonCash</option>
                            <option value="natcash">NatCash</option>
                        </select>
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
                                <Send size={20} />
                                Envoyer l'argent
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

export default TransfertArgent;
