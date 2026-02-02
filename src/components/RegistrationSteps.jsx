import React from 'react';
import { Check } from 'lucide-react';

const RegistrationSteps = ({ currentStep, totalSteps, steps }) => {
    return (
        <div className="mb-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            {/* Step Circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${index + 1 < currentStep
                                        ? 'bg-green-500 text-white'
                                        : index + 1 === currentStep
                                            ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                                            : 'bg-neutral-200 text-neutral-500'
                                    }`}
                            >
                                {index + 1 < currentStep ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            {/* Step Label */}
                            <span
                                className={`text-xs mt-2 text-center max-w-[80px] ${index + 1 === currentStep
                                        ? 'text-primary-900 font-semibold'
                                        : 'text-neutral-600'
                                    }`}
                            >
                                {step}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-1 mx-2 rounded transition-all ${index + 1 < currentStep
                                        ? 'bg-green-500'
                                        : 'bg-neutral-200'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Counter */}
            <div className="text-center text-sm text-neutral-600">
                Étape {currentStep} sur {totalSteps}
            </div>
        </div>
    );
};

export default RegistrationSteps;
