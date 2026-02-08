/**
 * ProductVariants - Inspiré Shopify
 * Sélecteur de variants (taille, couleur) élégant
 */

import React from 'react';
import { Check } from 'lucide-react';

const ProductVariants = ({ 
    variants = {},
    selectedVariants = {},
    onVariantChange,
    className = ""
}) => {
    const colorNames = {
        'black': 'Noir',
        'white': 'Blanc',
        'red': 'Rouge',
        'blue': 'Bleu',
        'green': 'Vert',
        'yellow': 'Jaune',
        'pink': 'Rose',
        'purple': 'Violet',
        'orange': 'Orange',
        'gray': 'Gris',
        'brown': 'Marron',
        'navy': 'Marine',
        'beige': 'Beige',
    };

    const colorHex = {
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#EF4444',
        'blue': '#3B82F6',
        'green': '#22C55E',
        'yellow': '#EAB308',
        'pink': '#EC4899',
        'purple': '#8B5CF6',
        'orange': '#F97316',
        'gray': '#6B7280',
        'brown': '#92400E',
        'navy': '#1E3A5F',
        'beige': '#D4C4A8',
    };

    if (!variants || Object.keys(variants).length === 0) return null;

    return (
        <div className={`space-y-4 ${className}`}>
            {Object.entries(variants).map(([variantType, options]) => (
                <div key={variantType}>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 capitalize">
                            {variantType === 'color' ? 'Couleur' : variantType === 'size' ? 'Taille' : variantType}
                        </label>
                        {selectedVariants[variantType] && (
                            <span className="text-sm text-gray-500">
                                {variantType === 'color' 
                                    ? colorNames[selectedVariants[variantType]] || selectedVariants[variantType]
                                    : selectedVariants[variantType]
                                }
                            </span>
                        )}
                    </div>

                    {variantType === 'color' ? (
                        // Color Swatches
                        <div className="flex flex-wrap gap-2">
                            {options.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => onVariantChange(variantType, color)}
                                    className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                                        selectedVariants[variantType] === color
                                            ? 'border-gold-500 ring-2 ring-gold-500 ring-offset-2'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: colorHex[color] || color }}
                                    title={colorNames[color] || color}
                                >
                                    {selectedVariants[variantType] === color && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <Check className={`w-5 h-5 ${
                                                ['white', 'yellow', 'beige'].includes(color) 
                                                    ? 'text-gray-800' 
                                                    : 'text-white'
                                            }`} />
                                        </span>
                                    )}
                                    {color === 'white' && (
                                        <span className="absolute inset-0 rounded-full border border-gray-200" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : variantType === 'size' ? (
                        // Size Buttons
                        <div className="flex flex-wrap gap-2">
                            {options.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => onVariantChange(variantType, size)}
                                    className={`min-w-[3rem] px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                                        selectedVariants[variantType] === size
                                            ? 'border-gold-500 bg-gold-50 text-gold-700'
                                            : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    ) : (
                        // Generic Dropdown for other variants
                        <select
                            value={selectedVariants[variantType] || ''}
                            onChange={(e) => onVariantChange(variantType, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        >
                            <option value="">Sélectionner {variantType}</option>
                            {options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProductVariants;
