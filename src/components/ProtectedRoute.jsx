import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * SECURITE : Protège les routes sensibles côté frontend.
 * La protection Firestore Rules reste la barrière principale côté backend.
 * Ce composant empêche l'affichage de l'UI aux utilisateurs non autorisés.
 *
 * @param {string} requiredRole - 'admin' | 'seller' | null (authentifié uniquement)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole) {
        const role = currentUser?.customClaims?.role;
        if (role !== requiredRole) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
