/**
 * DigitalProductFeatures - Inspiré Gumroad/Udemy
 * Features spécifiques aux produits numériques
 */

import React from 'react';
import { 
    Download, Clock, RefreshCcw, Infinity, Shield, 
    FileText, Video, Music, Image, Code, BookOpen,
    Smartphone, Monitor, Tablet, Globe, Lock, Zap
} from 'lucide-react';

const DigitalProductFeatures = ({ product }) => {
    // Determine product sub-type
    const getProductIcon = () => {
        const type = product.digitalType || product.category;
        const icons = {
            'course': Video,
            'ebook': BookOpen,
            'template': Code,
            'audio': Music,
            'video': Video,
            'software': Monitor,
            'graphic': Image,
            'document': FileText,
        };
        return icons[type] || FileText;
    };

    const ProductIcon = getProductIcon();

    // File info
    const fileInfo = product.fileInfo || {
        format: 'PDF, EPUB',
        size: '45 MB',
        pages: 250,
        duration: null,
        language: 'Français',
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <ProductIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Produit Numérique</h3>
                    <p className="text-sm text-blue-600">Téléchargement instantané après paiement</p>
                </div>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Accès immédiat</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <Infinity className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Accès à vie</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <RefreshCcw className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Mises à jour gratuites</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Garantie 30 jours</span>
                </div>
            </div>

            {/* File Details */}
            <div className="bg-white rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Détails du fichier
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium">{fileInfo.format}</span>
                    
                    <span className="text-gray-500">Taille:</span>
                    <span className="font-medium">{fileInfo.size}</span>
                    
                    {fileInfo.pages && (
                        <>
                            <span className="text-gray-500">Pages:</span>
                            <span className="font-medium">{fileInfo.pages} pages</span>
                        </>
                    )}
                    
                    {fileInfo.duration && (
                        <>
                            <span className="text-gray-500">Durée:</span>
                            <span className="font-medium">{fileInfo.duration}</span>
                        </>
                    )}
                    
                    <span className="text-gray-500">Langue:</span>
                    <span className="font-medium">{fileInfo.language}</span>
                </div>
            </div>

            {/* Compatible Devices */}
            <div>
                <h4 className="font-semibold text-gray-900 mb-3">Compatible avec:</h4>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600">
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs">PC</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                        <Tablet className="w-5 h-5" />
                        <span className="text-xs">Tablette</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs">Mobile</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="w-5 h-5" />
                        <span className="text-xs">Web</span>
                    </div>
                </div>
            </div>

            {/* License Info */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-amber-900">Licence personnelle</p>
                    <p className="text-amber-700">Usage personnel uniquement. Pour usage commercial, contactez le vendeur.</p>
                </div>
            </div>
        </div>
    );
};

export default DigitalProductFeatures;
