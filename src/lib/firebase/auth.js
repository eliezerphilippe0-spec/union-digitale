import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    sendEmailVerification,
    signOut,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Multi-Vendor Marketplace Authentication Service
 * Supports: Admin, Seller (Vendor), Buyer roles
 * Features: Email verification, Phone auth, Custom claims
 */

export const authService = {
    /**
     * Register a new user with role-based access
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} role - User role: 'admin' | 'seller' | 'buyer'
     * @param {Object} userData - Additional user data (name, phone, address, etc.)
     * @returns {Promise<Object>} - User object with role
     */
    async registerUser(email, password, role = 'buyer', userData = {}) {
        try {
            // Validate role
            const validRoles = ['admin', 'seller', 'buyer'];
            if (!validRoles.includes(role)) {
                throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
            }

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name if provided
            if (userData.displayName) {
                await updateProfile(user, {
                    displayName: userData.displayName
                });
            }

            // Create Firestore user document with role
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: role,
                displayName: userData.displayName || '',
                phoneNumber: userData.phoneNumber || '',
                address: userData.address || {},
                country: userData.country || 'HT', // Default to Haiti
                emailVerified: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Seller-specific fields
                ...(role === 'seller' && {
                    storeName: userData.storeName || '',
                    storeDescription: userData.storeDescription || '',
                    businessType: userData.businessType || '',
                    taxId: userData.taxId || '',
                    bankAccount: userData.bankAccount || {},
                    commissionRate: 0.15, // 15% platform commission
                    balance: {
                        available: 0,
                        pending: 0,
                        total: 0
                    }
                }),
                // Buyer-specific fields
                ...(role === 'buyer' && {
                    wishlist: [],
                    orderHistory: [],
                    wallet: {
                        balance: 0,
                        cashback: 0
                    }
                })
            });

            // Initialize vendor balance if seller
            if (role === 'seller') {
                await setDoc(doc(db, 'balances', user.uid), {
                    vendorId: user.uid,
                    available: 0,
                    pending: 0,
                    total: 0,
                    currency: 'HTG',
                    lastUpdated: serverTimestamp()
                });
            }

            // Send email verification
            await sendEmailVerification(user);

            console.log(`✅ User registered successfully: ${email} (${role})`);

            return {
                uid: user.uid,
                email: user.email,
                role: role,
                emailVerified: user.emailVerified,
                displayName: userData.displayName || ''
            };

        } catch (error) {
            console.error('Registration error:', error);
            
            // User-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('Cet email est déjà utilisé. Veuillez vous connecter.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Adresse email invalide.');
            }
            
            throw error;
        }
    },

    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User object with role
     */
    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                throw new Error('Profil utilisateur introuvable.');
            }

            const userData = userDoc.data();

            console.log(`✅ User logged in: ${email} (${userData.role})`);

            return {
                uid: user.uid,
                email: user.email,
                role: userData.role,
                emailVerified: user.emailVerified,
                displayName: user.displayName || userData.displayName,
                phoneNumber: userData.phoneNumber
            };

        } catch (error) {
            console.error('Login error:', error);
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                throw new Error('Email ou mot de passe incorrect.');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Trop de tentatives. Veuillez réessayer plus tard.');
            }
            
            throw error;
        }
    },

    /**
     * Login with phone number (for Haitian users)
     * @param {string} phoneNumber - Phone number in E.164 format (+509...)
     * @param {string} recaptchaContainerId - DOM element ID for reCAPTCHA
     * @returns {Promise<Object>} - Confirmation result for OTP verification
     */
    async loginWithPhone(phoneNumber, recaptchaContainerId = 'recaptcha-container') {
        try {
            // Validate Haitian phone number format
            if (!phoneNumber.startsWith('+509')) {
                throw new Error('Numéro de téléphone haïtien invalide. Format: +509XXXXXXXX');
            }

            // Initialize reCAPTCHA verifier
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                    size: 'invisible',
                    callback: (response) => {
                        console.log('reCAPTCHA verified');
                    }
                });
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

            console.log('📱 OTP sent to:', phoneNumber);

            return confirmationResult;

        } catch (error) {
            console.error('Phone login error:', error);
            
            if (error.code === 'auth/invalid-phone-number') {
                throw new Error('Numéro de téléphone invalide.');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Trop de tentatives. Veuillez réessayer plus tard.');
            }
            
            throw error;
        }
    },

    /**
     * Verify OTP code from phone authentication
     * @param {Object} confirmationResult - Result from loginWithPhone
     * @param {string} code - 6-digit OTP code
     * @param {string} role - User role if new user
     * @returns {Promise<Object>} - User object
     */
    async verifyPhoneOTP(confirmationResult, code, role = 'buyer') {
        try {
            const result = await confirmationResult.confirm(code);
            const user = result.user;

            // Check if user document exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // New user - create profile
                await setDoc(doc(db, 'users', user.uid), {
                    phoneNumber: user.phoneNumber,
                    role: role,
                    emailVerified: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    country: 'HT',
                    ...(role === 'buyer' && {
                        wishlist: [],
                        wallet: { balance: 0, cashback: 0 }
                    })
                });
            }

            const userData = userDoc.exists() ? userDoc.data() : { role };

            console.log('✅ Phone verified:', user.phoneNumber);

            return {
                uid: user.uid,
                phoneNumber: user.phoneNumber,
                role: userData.role,
                isNewUser: !userDoc.exists()
            };

        } catch (error) {
            console.error('OTP verification error:', error);
            
            if (error.code === 'auth/invalid-verification-code') {
                throw new Error('Code de vérification invalide.');
            } else if (error.code === 'auth/code-expired') {
                throw new Error('Code expiré. Veuillez demander un nouveau code.');
            }
            
            throw error;
        }
    },

    /**
     * Send email verification to current user
     * @param {Object} user - Firebase user object
     * @returns {Promise<void>}
     */
    async verifyEmail(user = auth.currentUser) {
        try {
            if (!user) {
                throw new Error('Aucun utilisateur connecté.');
            }

            if (user.emailVerified) {
                console.log('Email already verified');
                return;
            }

            await sendEmailVerification(user);
            console.log('📧 Verification email sent to:', user.email);

        } catch (error) {
            console.error('Email verification error:', error);
            throw new Error('Erreur lors de l\'envoi de l\'email de vérification.');
        }
    },

    /**
     * Update user role (Admin only)
     * @param {string} uid - User ID to update
     * @param {string} newRole - New role: 'admin' | 'seller' | 'buyer'
     * @param {Object} currentUser - Current authenticated user
     * @returns {Promise<void>}
     */
    async updateUserRole(uid, newRole, currentUser) {
        try {
            // Verify current user is admin
            const currentUserRole = await this.checkUserRole(currentUser);
            if (currentUserRole !== 'admin') {
                throw new Error('Accès refusé. Seuls les administrateurs peuvent modifier les rôles.');
            }

            const validRoles = ['admin', 'seller', 'buyer'];
            if (!validRoles.includes(newRole)) {
                throw new Error(`Rôle invalide: ${newRole}`);
            }

            await updateDoc(doc(db, 'users', uid), {
                role: newRole,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ User role updated: ${uid} -> ${newRole}`);

        } catch (error) {
            console.error('Update role error:', error);
            throw error;
        }
    },

    /**
     * Check user role from Firestore
     * @param {Object} user - Firebase user object
     * @returns {Promise<string>} - User role: 'admin' | 'seller' | 'buyer'
     */
    async checkUserRole(user = auth.currentUser) {
        try {
            if (!user) {
                return null;
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                console.warn('User document not found for:', user.uid);
                return 'buyer'; // Default role
            }

            return userDoc.data().role || 'buyer';

        } catch (error) {
            console.error('Check role error:', error);
            return 'buyer'; // Fallback to buyer role
        }
    },

    /**
     * Check if user is a seller/vendor
     * @param {Object} user - Firebase user object
     * @returns {Promise<boolean>}
     */
    async isSeller(user = auth.currentUser) {
        const role = await this.checkUserRole(user);
        return role === 'seller' || role === 'admin';
    },

    /**
     * Check if user is an admin
     * @param {Object} user - Firebase user object
     * @returns {Promise<boolean>}
     */
    async isAdmin(user = auth.currentUser) {
        const role = await this.checkUserRole(user);
        return role === 'admin';
    },

    /**
     * Check if email is verified (required for MonCash transactions)
     * @param {Object} user - Firebase user object
     * @returns {boolean}
     */
    isEmailVerified(user = auth.currentUser) {
        return user?.emailVerified || false;
    },

    /**
     * Logout current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await signOut(auth);
            console.log('✅ User logged out');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    /**
     * Listen to authentication state changes
     * @param {Function} callback - Callback function with user object
     * @returns {Function} - Unsubscribe function
     */
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const role = await this.checkUserRole(user);
                callback({
                    uid: user.uid,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    displayName: user.displayName,
                    emailVerified: user.emailVerified,
                    role: role
                });
            } else {
                callback(null);
            }
        });
    }
};

export default authService;
