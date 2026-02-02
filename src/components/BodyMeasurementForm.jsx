import React, { useState } from 'react';
import { Save, HelpCircle } from 'lucide-react';
import { validateMeasurements, MEASUREMENT_RANGES, getMeasurementInstructions } from '../utils/measurementUtils';
import Button from './ui/Button';
import MeasurementGuide from './MeasurementGuide';

const BodyMeasurementForm = ({ initialMeasurements = {}, onSave, onCancel }) => {
    const [measurements, setMeasurements] = useState({
        chest: initialMeasurements.chest || '',
        waist: initialMeasurements.waist || '',
        hips: initialMeasurements.hips || '',
        height: initialMeasurements.height || '',
        weight: initialMeasurements.weight || '',
        shoulders: initialMeasurements.shoulders || '',
        preferredFit: initialMeasurements.preferredFit || 'regular'
    });

    const [errors, setErrors] = useState({});
    const [showGuide, setShowGuide] = useState(false);
    const [guideFor, setGuideFor] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMeasurements(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleShowGuide = (measurementType) => {
        setGuideFor(measurementType);
        setShowGuide(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate measurements
        const validation = validateMeasurements(measurements);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Save measurements
        onSave(measurements);
    };

    const measurementFields = [
        { name: 'chest', label: 'Tour de Poitrine', required: true, icon: '👕' },
        { name: 'waist', label: 'Tour de Taille', required: true, icon: '📏' },
        { name: 'hips', label: 'Tour de Hanches', required: false, icon: '👖' },
        { name: 'height', label: 'Taille (Hauteur)', required: false, icon: '📐' },
        { name: 'weight', label: 'Poids', required: false, icon: '⚖️' },
        { name: 'shoulders', label: 'Largeur Épaules', required: false, icon: '👔' }
    ];

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Measurement Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {measurementFields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                <span className="mr-2">{field.icon}</span>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        name={field.name}
                                        value={measurements[field.name]}
                                        onChange={handleChange}
                                        placeholder={MEASUREMENT_RANGES[field.name]?.min + '-' + MEASUREMENT_RANGES[field.name]?.max}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors[field.name] ? 'border-red-500' : 'border-neutral-300'
                                            }`}
                                        step="0.1"
                                        required={field.required}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                                        cm
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleShowGuide(field.name)}
                                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Comment mesurer"
                                >
                                    <HelpCircle className="w-5 h-5" />
                                </button>
                            </div>
                            {errors[field.name] && (
                                <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Preferred Fit */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Préférence de Coupe
                    </label>
                    <select
                        name="preferredFit"
                        value={measurements.preferredFit}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="slim">Ajusté (Slim)</option>
                        <option value="regular">Normal (Regular)</option>
                        <option value="oversized">Ample (Oversized)</option>
                    </select>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils de mesure</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Mesurez-vous en sous-vêtements pour plus de précision</li>
                        <li>• Utilisez un mètre ruban souple</li>
                        <li>• Ne serrez pas trop le ruban</li>
                        <li>• Demandez de l'aide si possible</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200">
                    {onCancel && (
                        <Button variant="secondary" onClick={onCancel} type="button">
                            Annuler
                        </Button>
                    )}
                    <Button variant="primary" type="submit" icon={Save}>
                        Enregistrer mes mesures
                    </Button>
                </div>
            </form>

            {/* Measurement Guide Modal */}
            {showGuide && guideFor && (
                <MeasurementGuide
                    measurementType={guideFor}
                    onClose={() => setShowGuide(false)}
                />
            )}
        </div>
    );
};

export default BodyMeasurementForm;
