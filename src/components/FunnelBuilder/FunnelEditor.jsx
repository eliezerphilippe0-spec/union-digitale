import React, { useState } from 'react';
import { Plus, Trash2, Move, Settings, Eye } from 'lucide-react';

const FunnelEditor = () => {
    const [steps, setSteps] = useState([
        { id: 1, type: 'landing', name: 'Page de Vente', status: 'active' },
        { id: 2, type: 'checkout', name: 'Checkout', status: 'active' },
        { id: 3, type: 'upsell', name: 'Upsell (VIP)', status: 'draft' },
        { id: 4, type: 'thank_you', name: 'Merci / Livraison', status: 'active' },
    ]);

    const addStep = () => {
        const newStep = {
            id: Date.now(),
            type: 'generic',
            name: 'Nouvelle Étape',
            status: 'draft'
        };
        setSteps([...steps, newStep]);
    };

    const removeStep = (id) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Structure du Tunnel</h2>
                    <p className="text-sm text-gray-500">Organisez les étapes de votre parcours client.</p>
                </div>
                <button
                    onClick={addStep}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Ajouter une étape
                </button>
            </div>

            <div className="p-6 space-y-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="group flex items-center gap-4 bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-all">
                        <div className="text-gray-400 cursor-move">
                            <Move className="w-5 h-5" />
                        </div>

                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{step.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${step.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {step.type.toUpperCase()}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                                <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded">
                                <Settings className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => removeStep(step.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {steps.length === 0 && (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        Votre tunnel est vide. Ajoutez une étape pour commencer.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FunnelEditor;
