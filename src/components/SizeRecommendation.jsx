import React from 'react';
import { Check, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

const SizeRecommendation = ({ recommendation, selectedSize, onSizeSelect, sizeChart }) => {
    if (!recommendation) return null;

    const { recommendedSize, confidence, fit, alternatives, reasoning, tips, sizeDetails } = recommendation;

    // Confidence color
    const getConfidenceColor = (conf) => {
        if (conf >= 90) return 'text-green-600 bg-green-50';
        if (conf >= 75) return 'text-blue-600 bg-blue-50';
        if (conf >= 60) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    // Fit icon
    const getFitIcon = (fitType) => {
        if (fitType === 'perfect') return <Check className="w-5 h-5 text-green-600" />;
        if (fitType === 'good') return <TrendingUp className="w-5 h-5 text-blue-600" />;
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    };

    return (
        <div className="space-y-4">
            {/* Main Recommendation */}
            <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-3">
                        {getFitIcon(fit)}
                        <h3 className="text-lg font-bold text-primary-900">
                            Taille Recommandée
                        </h3>
                    </div>

                    {/* Size Display */}
                    <div className="mb-4">
                        <div className="inline-block">
                            <div className="bg-white border-4 border-primary-600 rounded-2xl px-8 py-6 shadow-lg">
                                <div className="text-6xl font-extrabold text-primary-900">
                                    {recommendedSize}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Confidence Score */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getConfidenceColor(confidence)}`}>
                        <span className="text-2xl">{confidence}%</span>
                        <span className="text-sm">de confiance</span>
                    </div>
                </div>

                {/* Reasoning */}
                <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-neutral-700 text-center">
                        {reasoning}
                    </p>
                </div>

                {/* Size Details */}
                {sizeDetails && (
                    <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-neutral-900 mb-2 text-sm">
                            Mesures de la taille {recommendedSize}:
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {sizeDetails.chest && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Poitrine:</span>
                                    <span className="font-semibold">{sizeDetails.chest} cm</span>
                                </div>
                            )}
                            {sizeDetails.waist && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Taille:</span>
                                    <span className="font-semibold">{sizeDetails.waist} cm</span>
                                </div>
                            )}
                            {sizeDetails.hips && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Hanches:</span>
                                    <span className="font-semibold">{sizeDetails.hips} cm</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tips */}
                {tips && tips.length > 0 && (
                    <div className="space-y-2">
                        {tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                                <span className="text-primary-600 mt-0.5">•</span>
                                <span className="text-neutral-700">{tip}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Alternative Sizes */}
            {alternatives && alternatives.length > 0 && (
                <Card padding="md">
                    <h4 className="font-semibold text-neutral-900 mb-3">
                        Autres tailles disponibles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(sizeChart).map(size => (
                            <button
                                key={size}
                                onClick={() => onSizeSelect(size)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${size === selectedSize
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : size === recommendedSize
                                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                            >
                                {size}
                                {size === recommendedSize && (
                                    <Badge variant="success" size="sm" className="ml-2">
                                        Recommandé
                                    </Badge>
                                )}
                            </button>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SizeRecommendation;
