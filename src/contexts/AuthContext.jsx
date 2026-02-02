import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    signInWithPhoneNumber,
    RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign Up with Email
    const signup = async (email, password, fullName, role = 'buyer') => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Create User Document in Firestore (standardized schema)
        await setDoc(doc(db, 'users', result.user.uid), {
            email: email,
            displayName: fullName,
            role: role, // 'admin', 'seller', or 'buyer'
            createdAt: serverTimestamp(),
            balance: {
                available: 0,
                pending: 0,
                total: 0
            },
            points: 0,
            currency: 'HTG'
        });
        // Update Auth Profile
        await updateProfile(result.user, { displayName: fullName });
        return result;
    };

    // Login with Email
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Login with Google
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Check if user exists, if not create doc
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                displayName: result.user.displayName,
                role: 'buyer',
                createdAt: serverTimestamp(),
                balance: {
                    available: 0,
                    pending: 0,
                    total: 0
                },
                points: 0,
                currency: 'HTG'
            });
        }
        return result;
    };

    // Setup Recaptcha
    const setupRecaptcha = (elementId) => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved
                }
            });
        }
        return window.recaptchaVerifier;
    };

    // Login with Phone (Step 1: Send OTP)
    const loginWithPhone = (phoneNumber, appVerifier) => {
        return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    };

    // Logout
    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        let unsubscribeFirestore = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            // Unsubscribe from previous user's data if exists
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            if (user) {
                // Get custom claims (role, sellerId)
                const idTokenResult = await user.getIdTokenResult();
                const customClaims = idTokenResult.claims;

                // User is signed in, listen to Firestore modifications
                const userRef = doc(db, 'users', user.uid);
                unsubscribeFirestore = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setCurrentUser({
                            ...user,
                            ...doc.data(),
                            // Add custom claims to user object
                            customClaims: {
                                role: customClaims.role || 'buyer',
                                sellerId: customClaims.sellerId || null
                            }
                        });
                    } else {
                        // Fallback if firestore doc doesn't exist yet
                        setCurrentUser({
                            ...user,
                            customClaims: {
                                role: customClaims.role || 'buyer',
                                sellerId: customClaims.sellerId || null
                            }
                        });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user data:", error);
                    setCurrentUser(user);
                    setLoading(false);
                });
            } else {
                // User is signed out
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        loginWithPhone,
        setupRecaptcha,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
