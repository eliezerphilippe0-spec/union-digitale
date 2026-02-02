import React, { useState, useEffect } from 'react';
import { Loader, MessageSquare } from 'lucide-react';
import { getProductReviews, getReviewStats } from '../services/reviewService';
import ReviewStats from './ReviewStats';
import ReviewCard from './ReviewCard';
import WriteReviewModal from './WriteReviewModal';
import Button from './ui/Button';

const ReviewSection = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [filters, setFilters] = useState({
        rating: null,
        verified: false,
        withImages: false,
        sortBy: 'recent'
    });

    useEffect(() => {
        loadReviews();
        loadStats();
    }, [productId, filters]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await getProductReviews(productId, filters);
            setReviews(data);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await getReviewStats(productId);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleFilterByRating = (rating) => {
        setFilters(prev => ({
            ...prev,
            rating: prev.rating === rating ? null : rating
        }));
    };

    const handleReviewSubmitted = () => {
        setShowWriteModal(false);
        loadReviews();
        loadStats();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Avis Clients
                </h2>
                <Button
                    variant="primary"
                    onClick={() => setShowWriteModal(true)}
                >
                    Écrire un avis
                </Button>
            </div>

            {/* Stats */}
            <ReviewStats stats={stats} onFilterByRating={handleFilterByRating} />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium text-neutral-700">Filtrer :</span>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, verified: !prev.verified }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.verified
                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                >
                    ✓ Achats vérifiés
                </button>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, withImages: !prev.withImages }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.withImages
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                >
                    📷 Avec images
                </button>
                <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-700 border-none"
                >
                    <option value="recent">Plus récent</option>
                    <option value="helpful">Plus utile</option>
                    <option value="rating_high">Note haute</option>
                    <option value="rating_low">Note basse</option>
                </select>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-600">Aucun avis ne correspond à vos critères</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onVoteSuccess={loadReviews}
                        />
                    ))}
                </div>
            )}

            {/* Write Review Modal */}
            {showWriteModal && (
                <WriteReviewModal
                    productId={productId}
                    onClose={() => setShowWriteModal(false)}
                    onSuccess={handleReviewSubmitted}
                />
            )}
        </div>
    );
};

export default ReviewSection;
