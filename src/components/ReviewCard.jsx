import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, AlertCircle, X } from 'lucide-react';
import { voteHelpful, reportReview } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';

const ReviewCard = ({ review, onVoteSuccess }) => {
    const { currentUser } = useAuth();
    const [voting, setVoting] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    const hasVoted = currentUser && review.votedBy?.includes(currentUser.uid);

    const handleVote = async (isHelpful) => {
        if (!currentUser) {
            alert('Vous devez être connecté pour voter');
            return;
        }

        if (hasVoted) {
            alert('Vous avez déjà voté pour cet avis');
            return;
        }

        setVoting(true);
        try {
            await voteHelpful(review.id, isHelpful);
            if (onVoteSuccess) onVoteSuccess();
        } catch (error) {
            alert(error.message);
        } finally {
            setVoting(false);
        }
    };

    const handleReport = async (reason) => {
        if (!currentUser) {
            alert('Vous devez être connecté pour signaler');
            return;
        }

        try {
            await reportReview(review.id, reason);
            alert('Avis signalé. Merci pour votre contribution.');
            setShowReportModal(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                        {review.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {/* User Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900">
                                {review.userName || 'Utilisateur'}
                            </span>
                            {review.verified && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Achat Vérifié
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500">
                            {formatDate(review.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Report Button */}
                <button
                    onClick={() => setShowReportModal(true)}
                    className="text-neutral-400 hover:text-neutral-600 text-sm"
                >
                    <AlertCircle className="w-4 h-4" />
                </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                            }`}
                    />
                ))}
            </div>

            {/* Title */}
            <h4 className="font-bold text-neutral-900 mb-2">{review.title}</h4>

            {/* Content */}
            <p className="text-neutral-700 mb-4 whitespace-pre-wrap">{review.content}</p>

            {/* Images */}
            {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    {review.images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setSelectedImage(image);
                                setShowImageModal(true);
                            }}
                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-500 transition-colors"
                        >
                            <img
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Seller Response */}
            {review.sellerResponse && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                    <p className="font-semibold text-blue-900 text-sm mb-1">
                        Réponse du vendeur
                    </p>
                    <p className="text-blue-800 text-sm">{review.sellerResponse.content}</p>
                </div>
            )}

            {/* Helpful Votes */}
            <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
                <span className="text-sm text-neutral-600">Cet avis vous a-t-il été utile ?</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={voting || hasVoted}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${hasVoted
                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                : 'border-neutral-300 hover:bg-green-50 hover:border-green-500 hover:text-green-700'
                            }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{review.helpful || 0}</span>
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={voting || hasVoted}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${hasVoted
                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                : 'border-neutral-300 hover:bg-red-50 hover:border-red-500 hover:text-red-700'
                            }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm font-medium">{review.notHelpful || 0}</span>
                    </button>
                </div>
            </div>

            {/* Image Modal */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute -top-12 right-0 text-white hover:text-neutral-300"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Review"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="font-bold text-lg mb-4">Signaler cet avis</h3>
                        <div className="space-y-2">
                            {['spam', 'inappropriate', 'fake', 'other'].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => handleReport(reason)}
                                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
                                >
                                    {reason === 'spam' && 'Spam ou publicité'}
                                    {reason === 'inappropriate' && 'Contenu inapproprié'}
                                    {reason === 'fake' && 'Faux avis'}
                                    {reason === 'other' && 'Autre raison'}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="w-full mt-4 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewCard;
