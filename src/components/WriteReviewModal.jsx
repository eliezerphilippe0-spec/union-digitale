import React, { useState, useEffect } from 'react';
import { X, Star, Upload, Loader } from 'lucide-react';
import { submitReview, canUserReview } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

const WriteReviewModal = ({ productId, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [canReview, setCanReview] = useState(null);
    const [formData, setFormData] = useState({
        rating: 0,
        title: '',
        content: '',
        images: []
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        checkCanReview();
    }, []);

    const checkCanReview = async () => {
        if (!currentUser) {
            setCanReview({ canReview: false, reason: 'not_logged_in' });
            return;
        }

        const result = await canUserReview(currentUser.uid, productId);
        setCanReview(result);
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + formData.images.length > 5) {
            alert('Maximum 5 images autorisées');
            return;
        }

        // Convert to base64 for preview
        const readers = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readers).then(images => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...images]
            }));
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (formData.rating === 0) {
            newErrors.rating = 'Veuillez sélectionner une note';
        }

        if (formData.title.length < 10 || formData.title.length > 100) {
            newErrors.title = 'Le titre doit contenir entre 10 et 100 caractères';
        }

        if (formData.content.length < 20 || formData.content.length > 5000) {
            newErrors.content = 'Le contenu doit contenir entre 20 et 5000 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await submitReview(productId, formData);
            alert('Avis soumis avec succès ! Il sera publié après modération.');
            if (onSuccess) onSuccess();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4">Connexion requise</h3>
                    <p className="text-neutral-600 mb-6">
                        Vous devez être connecté pour laisser un avis.
                    </p>
                    <Button variant="primary" onClick={onClose} className="w-full">
                        Fermer
                    </Button>
                </div>
            </div>
        );
    }

    if (canReview && !canReview.canReview) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4">Impossible de laisser un avis</h3>
                    <p className="text-neutral-600 mb-6">
                        {canReview.reason === 'already_reviewed'
                            ? 'Vous avez déjà laissé un avis pour ce produit.'
                            : 'Une erreur est survenue.'}
                    </p>
                    <Button variant="secondary" onClick={onClose} className="w-full">
                        Fermer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Écrire un avis</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Note *
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= formData.rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-neutral-300 hover:text-amber-200'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Titre * (10-100 caractères)
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Résumez votre expérience"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            maxLength={100}
                        />
                        <p className="text-xs text-neutral-500 mt-1">{formData.title.length}/100</p>
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Votre avis * (20-5000 caractères)
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Partagez votre expérience avec ce produit..."
                            rows={6}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            maxLength={5000}
                        />
                        <p className="text-xs text-neutral-500 mt-1">{formData.content.length}/5000</p>
                        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Photos (optionnel, max 5)
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {formData.images.map((image, index) => (
                                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-neutral-200">
                                    <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {formData.images.length < 5 && (
                                <label className="w-20 h-20 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                                    <Upload className="w-6 h-6 text-neutral-400" />
                                    <span className="text-xs text-neutral-500 mt-1">Ajouter</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Verified Badge */}
                    {canReview?.verified && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 text-sm">
                                ✓ Votre avis sera marqué comme "Achat Vérifié"
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-neutral-200">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Annuler
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                            {loading ? (
                                <><Loader className="w-4 h-4 animate-spin" /> Envoi...</>
                            ) : (
                                'Publier l\'avis'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WriteReviewModal;
