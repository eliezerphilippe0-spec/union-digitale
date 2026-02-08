import React from 'react';
import { X } from 'lucide-react';
import { getMeasurementInstructions } from '../../utils/measurementUtils';

const MeasurementGuide = ({ measurementType, onClose }) => {
    const instructions = getMeasurementInstructions(measurementType);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{instructions.image}</span>
                        <div>
                            <h3 className="text-xl font-bold">{instructions.title}</h3>
                            <p className="text-sm text-indigo-100">Guide de mesure</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        {instructions.steps.map((step, index) => (
                            <div key={index} className="flex gap-3">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {index + 1}
                                </div>
                                <p className="text-neutral-700 pt-1">{step}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tip */}
                    {instructions.tip && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <span className="text-xl">💡</span>
                                <div>
                                    <h4 className="font-semibold text-amber-900 mb-1">Conseil</h4>
                                    <p className="text-sm text-amber-700">{instructions.tip}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-200 p-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Compris !
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeasurementGuide;
