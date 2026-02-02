import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Upload, Eye, EyeOff, Loader, CheckCircle, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import RegistrationSteps from '../components/RegistrationSteps';

const SellerRegister = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Personal Info
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phone: '',
        // Step 2: Address
        street: '',
        city: '',
        state: '',
        zipCode: '',
        // Step 3: Shop Info
        shopName: '',
        shopDescription: '',
        // Step 4: KYC
        idDoc1: null,
        idDoc2: null,
        // Step 5: Security
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
        acceptSellerPolicies: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const steps = ['Identité', 'Adresse', 'Boutique', 'Vérification', 'Sécurité'];

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
            if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
            if (!formData.dateOfBirth) {
                newErrors.dateOfBirth = 'Date de naissance requise';
            } else {
                const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
                if (age < 18) newErrors.dateOfBirth = 'Vous devez avoir au moins 18 ans';
            }
            if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
        }

        if (step === 2) {
            if (!formData.street.trim()) newErrors.street = 'Rue requise';
            if (!formData.city.trim()) newErrors.city = 'Ville requise';
            if (!formData.state.trim()) newErrors.state = 'Département requis';
        }

        if (step === 3) {
            if (!formData.shopName.trim()) newErrors.shopName = 'Nom de boutique requis';
        }

        if (step === 4) {
            if (!formData.idDoc1) newErrors.idDoc1 = 'Document 1 requis';
            if (!formData.idDoc2) newErrors.idDoc2 = 'Document 2 requis';
        }

        if (step === 5) {
            if (!formData.email.trim()) {
                newErrors.email = 'Email requis';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email invalide';
            }
            if (!formData.password) {
                newErrors.password = 'Mot de passe requis';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Minimum 6 caractères';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
            }
            if (!formData.acceptTerms) newErrors.acceptTerms = 'Acceptation requise';
            if (!formData.acceptSellerPolicies) newErrors.acceptSellerPolicies = 'Acceptation requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const uploadDocuments = async (userId) => {
        const urls = {};
        if (formData.idDoc1) {
            const ref1 = ref(storage, `seller_documents/${userId}/id1_${formData.idDoc1.name}`);
            await uploadBytes(ref1, formData.idDoc1);
            urls.id1 = await getDownloadURL(ref1);
        }
        if (formData.idDoc2) {
            const ref2 = ref(storage, `seller_documents/${userId}/id2_${formData.idDoc2.name}`);
            await uploadBytes(ref2, formData.idDoc2);
            urls.id2 = await getDownloadURL(ref2);
        }
        return urls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(5)) return;

        setLoading(true);
        try {
            const userCredential = await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                role: 'seller'
            });

            const user = userCredential.user;
            const docUrls = await uploadDocuments(user.uid);

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: `${formData.firstName} ${formData.lastName}`,
                dateOfBirth: formData.dateOfBirth,
                phone: formData.phone,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode
                },
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                role: 'seller',
                verificationStatus: 'pending',
                documents: docUrls,
                createdAt: serverTimestamp(),
                wallet_balance: 0,
                currency: 'HTG'
            }, { merge: true });

            navigate('/seller/onboarding', { state: { newSeller: true } });
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO
                title="Inscription Vendeur - Union Digitale"
                description="Créez votre boutique et commencez à vendre en ligne"
            />

            <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-600 rounded-full mb-4">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                            Devenir Vendeur
                        </h1>
                        <p className="text-neutral-600">
                            Créez votre boutique en quelques étapes
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <RegistrationSteps
                        currentStep={currentStep}
                        totalSteps={5}
                        steps={steps}
                    />

                    {/* Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Personal Info */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                        Informations Personnelles
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Prénom *
                                            </label>
                                            <Input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="Jean"
                                                error={errors.firstName}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Nom *
                                            </label>
                                            <Input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Dupont"
                                                error={errors.lastName}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Date de naissance * (18 ans minimum)
                                        </label>
                                        <Input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            error={errors.dateOfBirth}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Téléphone *
                                        </label>
                                        <Input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+509 3712 3456"
                                            error={errors.phone}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Address */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                        Adresse
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Rue *
                                        </label>
                                        <Input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            placeholder="123 Rue de la Paix"
                                            error={errors.street}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Ville *
                                            </label>
                                            <Input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="Port-au-Prince"
                                                error={errors.city}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Dép. *
                                            </label>
                                            <Input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                placeholder="Ouest"
                                                error={errors.state}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Code Postal
                                            </label>
                                            <Input
                                                type="text"
                                                name="zipCode"
                                                value={formData.zipCode}
                                                onChange={handleChange}
                                                placeholder="HT6110"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Shop Info */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                        Votre Boutique
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Nom de la boutique *
                                        </label>
                                        <Input
                                            type="text"
                                            name="shopName"
                                            value={formData.shopName}
                                            onChange={handleChange}
                                            placeholder="Ma Super Boutique"
                                            error={errors.shopName}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Description (optionnel)
                                        </label>
                                        <textarea
                                            name="shopDescription"
                                            value={formData.shopDescription}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Décrivez votre boutique et vos produits..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: KYC */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                        Vérification d'Identité (KYC)
                                    </h3>
                                    <p className="text-sm text-neutral-600 mb-4">
                                        🔒 Requis pour la sécurité de la marketplace
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Pièce d'Identité #1 * (Passeport ou CIN)
                                        </label>
                                        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                            <input
                                                type="file"
                                                name="idDoc1"
                                                onChange={handleChange}
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                id="idDoc1"
                                            />
                                            <label htmlFor="idDoc1" className="cursor-pointer">
                                                <span className="text-primary-600 font-medium">Cliquez pour télécharger</span>
                                                <p className="text-sm text-neutral-500 mt-1">
                                                    {formData.idDoc1 ? formData.idDoc1.name : 'JPG, PNG ou PDF (max 5MB)'}
                                                </p>
                                            </label>
                                        </div>
                                        {errors.idDoc1 && <p className="text-red-500 text-sm mt-1">{errors.idDoc1}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Pièce d'Identité #2 * (Permis ou autre)
                                        </label>
                                        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                            <input
                                                type="file"
                                                name="idDoc2"
                                                onChange={handleChange}
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                id="idDoc2"
                                            />
                                            <label htmlFor="idDoc2" className="cursor-pointer">
                                                <span className="text-primary-600 font-medium">Cliquez pour télécharger</span>
                                                <p className="text-sm text-neutral-500 mt-1">
                                                    {formData.idDoc2 ? formData.idDoc2.name : 'JPG, PNG ou PDF (max 5MB)'}
                                                </p>
                                            </label>
                                        </div>
                                        {errors.idDoc2 && <p className="text-red-500 text-sm mt-1">{errors.idDoc2}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Security */}
                            {currentStep === 5 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                                        Sécurité du Compte
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Email *
                                        </label>
                                        <Input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="vendeur@example.com"
                                            error={errors.email}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Mot de passe *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                error={errors.password}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Confirmer le mot de passe *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                error={errors.confirmPassword}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="acceptTerms"
                                                checked={formData.acceptTerms}
                                                onChange={handleChange}
                                                className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded"
                                            />
                                            <span className="text-sm text-neutral-700">
                                                J'accepte les <Link to="/policies" className="text-primary-600 hover:underline">Conditions d'Utilisation</Link>
                                            </span>
                                        </label>
                                        {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="acceptSellerPolicies"
                                                checked={formData.acceptSellerPolicies}
                                                onChange={handleChange}
                                                className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded"
                                            />
                                            <span className="text-sm text-neutral-700">
                                                J'accepte les <Link to="/policies" className="text-primary-600 hover:underline">Politiques Vendeur</Link>
                                            </span>
                                        </label>
                                        {errors.acceptSellerPolicies && <p className="text-red-500 text-sm">{errors.acceptSellerPolicies}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                                    {errors.submit}
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 pt-6">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={prevStep}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        Retour
                                    </Button>
                                )}

                                {currentStep < 5 ? (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={nextStep}
                                        className="flex-1"
                                    >
                                        Suivant
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Création...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Créer mon Compte Vendeur
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-neutral-600">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                    Connectez-vous
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SellerRegister;
