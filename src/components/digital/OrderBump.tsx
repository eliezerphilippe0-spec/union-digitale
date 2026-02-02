import React, { useState } from 'react';

interface OrderBumpProps {
    product: {
        id: string;
        title: string;
        price: number;
        description: string;
        image?: string;
    };
    isChecked: boolean;
    onToggle: () => void;
}

const OrderBump: React.FC<OrderBumpProps> = ({ product, isChecked, onToggle }) => {
    return (
        <div className={`border-2 rounded-lg p-4 mt-6 transition-all duration-200 ${isChecked ? 'border-red-500 bg-red-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
            <div className="flex items-start gap-4">
                <div className="pt-1">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={onToggle}
                        className="w-6 h-6 accent-red-600 cursor-pointer"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                            {isChecked ? <span className="text-red-700">OUI ! Ajouté à la commande</span> : "OUI ! Ajouter cette offre spéciale"}
                        </h3>
                        <span className="font-bold text-red-600 text-lg whitespace-nowrap">
                            {product.price.toLocaleString()} HTG
                        </span>
                    </div>

                    <p className="text-gray-600 text-sm mt-1 mb-2">
                        {product.description || "Obtenez ce produit exclusif à prix réduit uniquement maintenant."}
                    </p>

                    {product.image && (
                        <div className="flex items-center gap-3 mt-2 bg-white p-2 rounded border border-gray-200">
                            <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded" />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Offre Unique</span>
                        </div>
                    )}

                    <div className="mt-2 text-xs text-red-500 font-medium animate-pulse">
                        ⚠️ Cette offre n'est pas disponible ailleurs.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderBump;
