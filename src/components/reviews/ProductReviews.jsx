/**
 * Product Reviews Component
 * Displays reviews with ratings, sorting, and submission form
 */

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.config';

export default function ProductReviews({ productId, currentUserId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [productId, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const getProductReviews = httpsCallable(functions, 'getProductReviews');
      const result = await getProductReviews({ productId, sortBy });
      setReviews(result.data.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!rating || !comment.trim()) {
      alert('Veuillez fournir une note et un commentaire');
      return;
    }

    try {
      setSubmitting(true);
      const submitProductReview = httpsCallable(functions, 'submitProductReview');
      await submitProductReview({
        productId,
        rating,
        title,
        comment
      });

      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      setShowReviewForm(false);

      // Reload reviews
      loadReviews();
      alert('Merci pour votre avis !');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      const markReviewHelpful = httpsCallable(functions, 'markReviewHelpful');
      await markReviewHelpful({ reviewId });
      loadReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
      alert(error.message || 'Erreur');
    }
  };

  const handleReportReview = async (reviewId) => {
    const reason = prompt('Raison du signalement:');
    if (!reason) return;

    try {
      const reportReview = httpsCallable(functions, 'reportReview');
      await reportReview({ reviewId, reason });
      alert('Avis signalé avec succès');
    } catch (error) {
      console.error('Error reporting:', error);
      alert(error.message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avis clients</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Écrire un avis
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('recent')}
          className={`px-3 py-1 rounded-lg ${sortBy === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Plus récents
        </button>
        <button
          onClick={() => setSortBy('highest')}
          className={`px-3 py-1 rounded-lg ${sortBy === 'highest' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Meilleures notes
        </button>
        <button
          onClick={() => setSortBy('helpful')}
          className={`px-3 py-1 rounded-lg ${sortBy === 'helpful' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Plus utiles
        </button>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Écrire un avis</h3>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Note *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre (optionnel)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Résumez votre expérience"
                  className="w-full px-4 py-2 border rounded-lg"
                  maxLength={100}
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Commentaire *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre expérience avec ce produit"
                  className="w-full px-4 py-2 border rounded-lg h-32"
                  required
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">{comment.length}/1000</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Publier l\'avis'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun avis pour l'instant. Soyez le premier à donner votre avis !
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {review.userPhoto && (
                    <img
                      src={review.userPhoto}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{review.userName}</p>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Achat vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt?.toDate()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h4 className="font-semibold">{review.title}</h4>
              )}

              {/* Comment */}
              <p className="text-gray-700">{review.comment}</p>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Review"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 text-sm">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Utile ({review.helpful || 0})
                </button>
                <button
                  onClick={() => handleReportReview(review.id)}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                >
                  <Flag className="w-4 h-4" />
                  Signaler
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
