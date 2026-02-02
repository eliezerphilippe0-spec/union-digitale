import React, { useState, useEffect } from 'react';
import { X, Ruler, TrendingUp, AlertCircle, Check, ChevronRight } from 'lucide-react';
import { useFittingRoom } from '../contexts/FittingRoomContext';
import { recommendSize } from '../services/sizeRecommendationService';
import { determineBodyType, getBodyTypeRecommendations } from '../utils/measurementUtils';
import BodyMeasurementForm from './BodyMeasurementForm';
import SizeRecommendation from './SizeRecommendation';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

const VirtualFittingRoom = ({ product, onClose, onAddToCart }) => {
    const { measurements, hasMeasurements, saveMeasurements } = useFittingRoom();
    const [step, setStep] = useState(hasMeasurements() ? 'recommendation' : 'measurements');
    const [recommendation, setRecommendation] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    // Calculate recommendation when measurements are available
    useEffect(() => {
        if (measurements && product && step === 'recommendation') {
            const rec = recommendSize(measurements, {
                sizeChart: product.sizeChart,
                fitType: product.fitType,
                fabricElasticity: product.fabricElasticity
            });
            setRecommendation(rec);
            setSelectedSize(rec.recommendedSize);
        }
    }, [measurements, product, step]);

    const handleMeasurementsSaved = async (newMeasurements) => {
        await saveMeasurements(newMeasurements);
        setStep('recommendation');
    };

    const handleAddToCart = () => {
        if (selectedSize && onAddToCart) {
            onAddToCart(product, selectedSize);
            onClose();
        }
    };

    const bodyType = measurements ? determineBodyType(measurements) : null;
    const bodyTypeInfo = bodyType ? getBodyTypeRecommendations(bodyType) : null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Ruler className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Essayage Virtuel</h2>
                            <p className="text-sm text-white/80">Trouvez votre taille parfaite</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step === 'measurements' ? 'text-primary-600' : 'text-neutral-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'measurements' ? 'bg-primary-600 text-white' : 'bg-neutral-200'}`}>
                                {hasMeasurements() ? <Check className="w-5 h-5" /> : '1'}
                            </div>
                            <span className="font-medium hidden sm:inline">Mesures</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300" />
                        <div className={`flex items-center gap-2 ${step === 'recommendation' ? 'text-primary-600' : 'text-neutral-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'recommendation' ? 'bg-primary-600 text-white' : 'bg-neutral-200'}`}>
                                2
                            </div>
                            <span className="font-medium hidden sm:inline">Recommandation</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'measurements' ? (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-primary-900 mb-2">
                                    Entrez vos mensurations
                                </h3>
                                <p className="text-neutral-600">
                                    Nous utiliserons ces informations pour vous recommander la taille parfaite.
                                    Vos données sont privées et sécurisées.
                                </p>
                            </div>

                            <BodyMeasurementForm
                                initialMeasurements={measurements}
                                onSave={handleMeasurementsSaved}
                                onCancel={hasMeasurements() ? () => setStep('recommendation') : null}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Product Info */}
                            <Card padding="md" className="bg-neutral-50">
                                <div className="flex gap-4">
                                    {product.images && product.images[0] && (
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-primary-900 mb-1">
                                            {product.title}
                                        </h3>
                                        <p className="text-2xl font-bold text-accent-600">
                                            {product.price?.toLocaleString()} HTG
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            {product.fitType && (
                                                <Badge variant="secondary" size="sm">
                                                    {product.fitType === 'slim' ? 'Ajusté' : product.fitType === 'oversized' ? 'Ample' : 'Normal'}
                                                </Badge>
                                            )}
                                            {product.fabricElasticity && (
                                                <Badge variant="secondary" size="sm">
                                                    {product.fabricElasticity === 'high' ? 'Extensible' : product.fabricElasticity === 'low' ? 'Rigide' : 'Standard'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Body Type Info */}
                            {bodyTypeInfo && bodyTypeInfo.label !== 'Morphologie Non Déterminée' && (
                                <Card padding="md" className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-purple-900 mb-2">
                                                {bodyTypeInfo.label}
                                            </h4>
                                            <ul className="text-sm text-purple-700 space-y-1">
                                                {bodyTypeInfo.tips.map((tip, index) => (
                                                    <li key={index} className="flex items-start gap-2">
                                                        <span className="text-purple-400 mt-0.5">•</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Size Recommendation */}
                            {recommendation && (
                                <SizeRecommendation
                                    recommendation={recommendation}
                                    selectedSize={selectedSize}
                                    onSizeSelect={setSelectedSize}
                                    sizeChart={product.sizeChart}
                                />
                            )}

                            {/* No Recommendation Warning */}
                            {!recommendation && (
                                <Card padding="md" className="bg-amber-50 border-amber-200">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-amber-900 mb-1">
                                                Impossible de calculer une recommandation
                                            </h4>
                                            <p className="text-sm text-amber-700">
                                                Le guide des tailles n'est pas disponible pour ce produit.
                                                Contactez le vendeur pour plus d'informations.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Update Measurements Link */}
                            <div className="text-center">
                                <button
                                    onClick={() => setStep('measurements')}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm underline"
                                >
                                    Modifier mes mensurations
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {step === 'recommendation' && (
                    <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleAddToCart}
                                disabled={!selectedSize}
                                className="min-w-[200px]"
                            >
                                Ajouter au panier - Taille {selectedSize}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VirtualFittingRoom;
