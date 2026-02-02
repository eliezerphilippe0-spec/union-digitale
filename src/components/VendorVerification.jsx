import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import './VendorVerification.css';

export default function VendorVerification({ vendor, onVerificationSubmitted }) {
    const { currentUser } = useAuth();
    const [idCard, setIdCard] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [businessLicense, setBusinessLicense] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [idCardPreview, setIdCardPreview] = useState('');
    const [selfiePreview, setSelfiePreview] = useState('');

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Seules les images sont acceptées');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Taille maximale: 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'idCard') {
                setIdCardPreview(reader.result);
                setIdCard(file);
            } else if (type === 'selfie') {
                setSelfiePreview(reader.result);
                setSelfie(file);
            } else if (type === 'businessLicense') {
                setBusinessLicense(file);
            }
        };
        reader.readAsDataURL(file);
        setError('');
    };

    const uploadDocument = async (file, path) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!idCard || !selfie) {
            setError('Pièce d\'identité et selfie requis');
            return;
        }

        setUploading(true);

        try {
            // Upload documents
            const [idCardUrl, selfieUrl, businessLicenseUrl] = await Promise.all([
                uploadDocument(idCard, `vendors/${currentUser.uid}/id_card_${Date.now()}.jpg`),
                uploadDocument(selfie, `vendors/${currentUser.uid}/selfie_${Date.now()}.jpg`),
                businessLicense ? uploadDocument(businessLicense, `vendors/${currentUser.uid}/business_license_${Date.now()}.jpg`) : null
            ]);

            // Update vendor document
            const vendorRef = doc(db, 'vendors', currentUser.uid);
            await updateDoc(vendorRef, {
                verificationStatus: 'pending',
                verificationDocuments: {
                    idCard: {
                        url: idCardUrl,
                        status: 'pending',
                        uploadedAt: serverTimestamp()
                    },
                    selfie: {
                        url: selfieUrl,
                        status: 'pending',
                        uploadedAt: serverTimestamp()
                    },
                    ...(businessLicenseUrl && {
                        businessLicense: {
                            url: businessLicenseUrl,
                            status: 'pending',
                            uploadedAt: serverTimestamp()
                        }
                    })
                },
                updatedAt: serverTimestamp()
            });

            // Trigger verification workflow (Cloud Function)
            // This would call a Cloud Function to start auto-verification
            // await triggerVerification(currentUser.uid);

            if (onVerificationSubmitted) {
                onVerificationSubmitted();
            }

        } catch (err) {
            console.error('Verification submission error:', err);
            setError('Erreur lors de la soumission. Veuillez réessayer.');
        } finally {
            setUploading(false);
        }
    };

    // Show status if already submitted
    if (vendor?.verificationStatus === 'pending') {
        return (
            <div className="verification-pending">
                <div className="status-icon">⏳</div>
                <h2>Vérification en cours</h2>
                <p>Vos documents sont en cours de révision. Vous recevrez une notification sous 24-48h.</p>
                <div className="submitted-docs">
                    <h3>Documents soumis:</h3>
                    <ul>
                        <li>✅ Pièce d'identité</li>
                        <li>✅ Selfie</li>
                        {vendor.verificationDocuments?.businessLicense && <li>✅ Licence commerciale</li>}
                    </ul>
                </div>
            </div>
        );
    }

    if (vendor?.verificationStatus === 'rejected') {
        return (
            <div className="verification-rejected">
                <div className="status-icon">❌</div>
                <h2>Vérification refusée</h2>
                <p className="rejection-reason">
                    {vendor.verificationDocuments?.idCard?.rejectionReason ||
                        vendor.verificationDocuments?.selfie?.rejectionReason ||
                        'Documents non conformes'}
                </p>
                <button onClick={() => window.location.reload()} className="btn-primary">
                    Soumettre à nouveau
                </button>
            </div>
        );
    }

    return (
        <div className="vendor-verification">
            <div className="verification-header">
                <h2>Vérification Vendeur</h2>
                <p>Devenez un vendeur vérifié ✅ pour bénéficier de:</p>
                <ul className="benefits">
                    <li>🎯 Badge "Vérifié" visible</li>
                    <li>💰 Commission réduite (-2%)</li>
                    <li>📈 Limite de vente augmentée (100k HTG/mois)</li>
                    <li>⭐ Meilleur classement dans les recherches</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="verification-form">
                {/* ID Card Upload */}
                <div className="form-section">
                    <h3>1. Pièce d'identité <span className="required">*</span></h3>
                    <p className="hint">CIN, Passeport, ou Permis de conduire</p>

                    <div className="upload-area">
                        <input
                            type="file"
                            id="idCard"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'idCard')}
                            required
                        />
                        <label htmlFor="idCard" className="upload-label">
                            {idCardPreview ? (
                                <img src={idCardPreview} alt="ID Card Preview" className="preview" />
                            ) : (
                                <>
                                    <div className="upload-icon">📄</div>
                                    <span>Cliquez pour télécharger</span>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="requirements">
                        <p><strong>Exigences:</strong></p>
                        <ul>
                            <li>✓ Photo claire et lisible</li>
                            <li>✓ Tous les coins visibles</li>
                            <li>✓ Informations non masquées</li>
                            <li>✓ Document valide (non expiré)</li>
                        </ul>
                    </div>
                </div>

                {/* Selfie Upload */}
                <div className="form-section">
                    <h3>2. Selfie avec pièce d'identité <span className="required">*</span></h3>
                    <p className="hint">Tenez votre pièce d'identité à côté de votre visage</p>

                    <div className="upload-area">
                        <input
                            type="file"
                            id="selfie"
                            accept="image/*"
                            capture="user"
                            onChange={(e) => handleFileChange(e, 'selfie')}
                            required
                        />
                        <label htmlFor="selfie" className="upload-label">
                            {selfiePreview ? (
                                <img src={selfiePreview} alt="Selfie Preview" className="preview" />
                            ) : (
                                <>
                                    <div className="upload-icon">🤳</div>
                                    <span>Cliquez pour prendre un selfie</span>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="requirements">
                        <p><strong>Exigences:</strong></p>
                        <ul>
                            <li>✓ Visage clairement visible</li>
                            <li>✓ Pièce d'identité lisible</li>
                            <li>✓ Bon éclairage</li>
                            <li>✓ Pas de filtre ou modification</li>
                        </ul>
                    </div>
                </div>

                {/* Business License (Optional) */}
                <div className="form-section optional">
                    <h3>3. Licence commerciale <span className="optional-tag">(Optionnel)</span></h3>
                    <p className="hint">Pour les entreprises enregistrées</p>

                    <div className="upload-area">
                        <input
                            type="file"
                            id="businessLicense"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e, 'businessLicense')}
                        />
                        <label htmlFor="businessLicense" className="upload-label">
                            <div className="upload-icon">🏢</div>
                            <span>Cliquez pour télécharger</span>
                        </label>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                    <button type="submit" disabled={uploading || !idCard || !selfie} className="btn-primary">
                        {uploading ? (
                            <>
                                <span className="spinner"></span>
                                Téléchargement en cours...
                            </>
                        ) : (
                            'Soumettre pour vérification'
                        )}
                    </button>
                </div>

                <div className="privacy-notice">
                    <p>🔒 Vos documents sont sécurisés et utilisés uniquement pour la vérification. Ils ne seront jamais partagés avec des tiers.</p>
                </div>
            </form>
        </div>
    );
}
