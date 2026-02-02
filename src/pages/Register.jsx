import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Lock, User, AlertCircle, ShoppingBag, Store, Phone, ArrowRight, Check, Upload, FileText, Calendar, MapPin } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import useGeolocation from '../hooks/useGeolocation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const countries = [
    { code: 'HT', label: 'Haïti', dialCode: '+509', flag: '🇭🇹' },
    { code: 'US', label: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
    { code: 'CA', label: 'Canada', dialCode: '+1', flag: '🇨🇦' },
    { code: 'FR', label: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'DO', label: 'Rép. Dominicaine', dialCode: '+1', flag: '🇩🇴' },
    { code: 'BR', label: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'CL', label: 'Chili', dialCode: '+56', flag: '🇨🇱' },
];

const Register = () => {
    const [method, setMethod] = useState('email');

    // Enhanced Identity
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');

    // Enhanced Address
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: ''
    });

    const { location: geoData, loading: geoLoading, getLocation } = useGeolocation();

    React.useEffect(() => {
        if (geoData) {
            setAddress(prev => ({
                ...prev,
                lat: geoData.lat,
                lng: geoData.lng
                // In a real app, we would call a Reverse Geocoding API here to fill city/state
            }));
        }
    }, [geoData]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Seller Specific State
    const [shopName, setShopName] = useState('');
    const [idFiles, setIdFiles] = useState({ id1: null, id2: null });

    // Country & Phone State
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [localPhoneNumber, setLocalPhoneNumber] = useState('');

    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [searchParams] = useSearchParams();
    const [role, setRole] = useState(searchParams.get('role') === 'seller' ? 'seller' : 'customer');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const { signup, loginWithPhone, setupRecaptcha, loginWithGoogle } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleFileChange = (e, key) => {
        if (e.target.files[0]) {
            setIdFiles(prev => ({ ...prev, [key]: e.target.files[0] }));
        }
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!firstName || !lastName || !dob) {
            setError("Veuillez remplir toutes les informations d'identité.");
            return false;
        }

        // Age Verification (Simple 18+ check)
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 18) {
            setError("Vous devez avoir au moins 18 ans pour vous inscrire.");
            return false;
        }

        if (!address.street || !address.city || !address.state) {
            setError("Veuillez saisir votre adresse complète.");
            return false;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return false;
        }

        if (role === 'seller' && (!shopName || !idFiles.id1 || !idFiles.id2)) {
            setError("Les vendeurs doivent fournir un nom de boutique et deux pièces d'identité.");
            return false;
        }

        if (!termsAccepted) {
            setError("Vous devez accepter les Politiques Officielles pour continuer.");
            return false;
        }

        return true;
    };

    const uploadSellerDocuments = async (userId) => {
        const urls = {};
        for (const [key, file] of Object.entries(idFiles)) {
            if (file) {
                const storageRef = ref(storage, `seller_documents/${userId}/${key}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                urls[key] = url;
            }
        }
        return urls;
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setError('');
            setLoading(true);
            const displayName = `${firstName} ${lastName}`;
            const userCredential = await signup(email, password, displayName, role);
            const user = userCredential.user;

            let docData = {
                email: user.email,
                firstName,
                lastName,
                displayName,
                dob,
                address: {
                    ...address,
                    country: selectedCountry.code
                },
                role: role,
                country: selectedCountry.code,
                created_at: serverTimestamp(),
                wallet_balance: 0,
                currency: 'HTG'
            };

            if (role === 'seller') {
                const docUrls = await uploadSellerDocuments(user.uid);
                docData = {
                    ...docData,
                    shopName,
                    verificationStatus: 'pending',
                    documents: docUrls
                };
            }

            await setDoc(doc(db, 'users', user.uid), docData, { merge: true });
            navigate(role === 'seller' ? '/admin' : '/');
        } catch (err) {
            setError('Échec de la création du compte.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!firstName || !lastName || !dob) {
            return setError("Veuillez remplir vos informations personnelles avant de continuer.");
        }
        // Basic check before OTP, re-check later
        const fullPhoneNumber = `${selectedCountry.dialCode}${localPhoneNumber.replace(/\D/g, '')}`;
        if (fullPhoneNumber.length < 8) {
            setError("Numéro de téléphone invalide.");
            return;
        }

        try {
            setError('');
            setLoading(true);
            const appVerifier = setupRecaptcha('recaptcha-container-reg');
            const confirmation = await loginWithPhone(fullPhoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            alert(`Code SMS envoyé au ${fullPhoneNumber} !`);
        } catch (err) {
            setError("Erreur lors de l'envoi du SMS. Vérifiez le numéro.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!validateForm()) return; // Re-validate everything including address which might be in step 2 if we split UI, but here it's all one page

        try {
            setError('');
            setLoading(true);
            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const displayName = `${firstName} ${lastName}`;

            await updateProfile(user, { displayName: displayName });

            let docData = {
                email: null,
                phoneNumber: user.phoneNumber,
                firstName,
                lastName,
                displayName,
                dob,
                address: {
                    ...address,
                    country: selectedCountry.code
                },
                role: role,
                country: selectedCountry.code,
                created_at: serverTimestamp(),
                wallet_balance: 0,
                currency: 'HTG'
            };

            if (role === 'seller') {
                const docUrls = await uploadSellerDocuments(user.uid);
                docData = {
                    ...docData,
                    shopName,
                    verificationStatus: 'pending',
                    documents: docUrls
                };
            }

            await setDoc(doc(db, 'users', user.uid), docData, { merge: true });
            navigate(role === 'seller' ? '/admin' : '/');
        } catch (err) {
            setError("Code incorrect ou erreur lors de la création du compte.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t('create_account_title')} {selectedCountry.code !== 'HT' && <span className="text-secondary text-lg ml-2">({selectedCountry.label})</span>}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {t('already_member')} <Link to="/login" className="font-medium text-secondary hover:text-secondary-hover">{t('login_link')}</Link>
                    </p>
                </div>

                {/* Google Sign In */}
                <div className="mt-6">
                    <button
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await loginWithGoogle();
                                navigate('/');
                            } catch (error) {
                                console.error("Google Sign In Error", error);
                                setError("Erreur lors de la connexion Google.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary align-middle gap-2 transition-all"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        {t('continue_with_google')}
                    </button>

                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">{t('or_sign_up_with')}</span>
                        </div>
                    </div>
                </div>

                {/* Method Toggle */}
                {!otpSent && (
                    <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'email' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMethod('email')}
                        >
                            {t('email_label')}
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMethod('phone')}
                        >
                            {t('phone_label')}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="mt-8">
                    {/* Role Selection */}
                    {!otpSent && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div
                                className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === 'customer' ? 'border-secondary bg-blue-50 text-secondary' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                                onClick={() => setRole('customer')}
                            >
                                <ShoppingBag className="w-8 h-8" />
                                <span className="font-bold text-sm">{t('i_am_buyer')}</span>
                            </div>
                            <div
                                className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${role === 'seller' ? 'border-secondary bg-blue-50 text-secondary' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                                onClick={() => setRole('seller')}
                            >
                                <Store className="w-8 h-8" />
                                <span className="font-bold text-sm">{t('i_am_seller')}</span>
                            </div>
                        </div>
                    )}

                    {/* IDENTITY & ADDRESS FORM (Common to all) */}
                    {!otpSent && (
                        <div className="space-y-6 mb-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">{t('identity_address')}</h3>

                            {/* Identity Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('firstname')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('lastname')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('dob')}</label>
                                <div className="relative">
                                    <Calendar className="absolute top-2.5 left-3 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Address Logic */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-medium text-gray-500">{t('address_street')}</label>
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            disabled={geoLoading}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {geoLoading ? t('locating') : t('locate_me')}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute top-2.5 left-3 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            name="street"
                                            required
                                            className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                            value={address.street}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-6 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('city')}</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                            value={address.city}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('state_province')}</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                            value={address.state}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('zip_code')}</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            required
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                            value={address.zip}
                                            onChange={handleAddressChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Seller Specific Fields */}
                    {role === 'seller' && !otpSent && (
                        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100 animate-fadeIn">
                            <h3 className="text-md font-bold text-orange-900 mb-3 flex items-center gap-2">
                                <Store className="w-5 h-5" /> {t('shop_info')}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('shop_name')}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-4 py-2 border border-orange-200 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        placeholder="Ma Super Boutique"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {t('id_docs_required')}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('id_doc_1')}</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-orange-200 border-dashed rounded-lg cursor-pointer bg-white hover:bg-orange-50">
                                            <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                <Upload className="w-5 h-5 text-orange-400 mb-1" />
                                                <p className="text-xs text-gray-500">{idFiles.id1 ? idFiles.id1.name : t('click_to_upload')}</p>
                                            </div>
                                            <input type="file" required className="hidden" onChange={(e) => handleFileChange(e, 'id1')} accept="image/*,.pdf" />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">{t('id_doc_2')}</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-orange-200 border-dashed rounded-lg cursor-pointer bg-white hover:bg-orange-50">
                                            <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                <Upload className="w-5 h-5 text-orange-400 mb-1" />
                                                <p className="text-xs text-gray-500">{idFiles.id2 ? idFiles.id2.name : t('click_to_upload')}</p>
                                            </div>
                                            <input type="file" required className="hidden" onChange={(e) => handleFileChange(e, 'id2')} accept="image/*,.pdf" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terms & Conditions Checkbox */}
                    <div className="flex items-start mb-6">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="focus:ring-secondary h-4 w-4 text-secondary border-gray-300 rounded"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="font-medium text-gray-700">
                                {t('terms_agree')} <Link to="/policies" target="_blank" className="text-secondary hover:underline">{t('terms_link')}</Link> {t('terms_suffix')}
                            </label>
                            <p className="text-gray-500 text-xs mt-1">{t('terms_required')}</p>
                        </div>
                    </div>

                    {method === 'email' ? (
                        <form className="space-y-6" onSubmit={handleEmailSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div className="relative mb-3">
                                    <Mail className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        className="appearance-none block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        placeholder={t('email_label')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative mb-3">
                                    <Lock className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        placeholder={t('password')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute top-3 left-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        className="appearance-none block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                        placeholder={t('confirm_password')}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                                >
                                    {loading ? t('creating_account') : t('register_btn')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {!otpSent ? (
                                <form onSubmit={handleSendOtp}>
                                    <div className="space-y-4">
                                        {/* Country & Phone Input */}
                                        <div className="flex rounded-md shadow-sm">
                                            <div className="relative min-w-[120px]">
                                                <select
                                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-900 rounded-l-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm pr-8"
                                                    value={selectedCountry.code}
                                                    onChange={(e) => setSelectedCountry(countries.find(c => c.code === e.target.value))}
                                                >
                                                    {countries.map(country => (
                                                        <option key={country.code} value={country.code}>
                                                            {country.flag} {country.dialCode}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                </div>
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type="tel"
                                                    required
                                                    className="appearance-none block w-full px-4 py-3 border-t border-b border-r border-gray-300 placeholder-gray-500 text-gray-900 rounded-r-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                                                    placeholder={t('phone_number_label')}
                                                    value={localPhoneNumber}
                                                    onChange={(e) => setLocalPhoneNumber(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        {t('phone_selected_country')} <span className="font-bold">{selectedCountry.label}</span>. {t('sms_will_be_sent')}
                                    </p>

                                    <div id="recaptcha-container-reg" className="mt-4"></div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="mt-6 group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
                                    >
                                        {loading ? t('sending') : <span className="flex items-center gap-2">{t('send_code_btn')} <ArrowRight className="w-4 h-4" /></span>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('verification_code_label')}</label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 text-gray-400 font-mono text-sm">#</div>
                                            <input
                                                type="text"
                                                required
                                                className="appearance-none block w-full px-8 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm tracking-widest text-center text-lg letter-spacing-2"
                                                placeholder="XXXXXX"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                                    >
                                        {loading ? t('verifying') : <span className="flex items-center gap-2">{t('confirm_create_account')} <Check className="w-4 h-4" /></span>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        {t('change_number')}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
