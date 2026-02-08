/**
 * DigitalPreview - Inspiré Gumroad/Envato
 * Preview/Demo du contenu digital
 */

import React, { useState } from 'react';
import { 
    Play, Pause, X, Download, Eye, Lock, 
    Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight,
    FileText, Image as ImageIcon
} from 'lucide-react';

const DigitalPreview = ({ product, isOpen, onClose }) => {
    const [currentPreview, setCurrentPreview] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Mock preview content
    const previews = product?.previews || [
        { type: 'image', url: null, title: 'Aperçu page 1' },
        { type: 'image', url: null, title: 'Aperçu page 2' },
        { type: 'image', url: null, title: 'Table des matières' },
        { type: 'video', url: null, title: 'Vidéo de présentation', duration: '2:30' },
    ];

    if (!isOpen) return null;

    const current = previews[currentPreview];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-5xl mx-4 bg-gray-900 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div>
                        <h3 className="text-white font-bold">{product?.title || 'Aperçu du produit'}</h3>
                        <p className="text-gray-400 text-sm">{current.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="relative aspect-video bg-black flex items-center justify-center">
                    {current.type === 'video' ? (
                        <>
                            {/* Video Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center mb-4 mx-auto cursor-pointer hover:bg-white/20 transition-colors"
                                         onClick={() => setIsPlaying(!isPlaying)}>
                                        {isPlaying ? (
                                            <Pause className="w-10 h-10 text-white" />
                                        ) : (
                                            <Play className="w-10 h-10 text-white ml-1" />
                                        )}
                                    </div>
                                    <p className="text-white/60 text-sm">Vidéo de présentation</p>
                                    <p className="text-white/40 text-xs mt-1">{current.duration}</p>
                                </div>
                            </div>

                            {/* Video Controls */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="text-white hover:text-indigo-400"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    
                                    {/* Progress Bar */}
                                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="w-1/3 h-full bg-indigo-500 rounded-full"></div>
                                    </div>

                                    <span className="text-white/60 text-xs">0:52 / {current.duration}</span>
                                    
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="text-white hover:text-indigo-400"
                                    >
                                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    
                                    <button className="text-white hover:text-indigo-400">
                                        <Maximize className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Image/Document Preview */
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg text-center">
                                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">{current.title}</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Aperçu {currentPreview + 1} sur {previews.length}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {previews.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentPreview(prev => prev > 0 ? prev - 1 : previews.length - 1)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setCurrentPreview(prev => prev < previews.length - 1 ? prev + 1 : 0)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnails */}
                <div className="px-6 py-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {previews.map((preview, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPreview(idx)}
                                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                    currentPreview === idx 
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/50' 
                                        : 'border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    {preview.type === 'video' ? (
                                        <Play className="w-6 h-6 text-gray-500" />
                                    ) : (
                                        <FileText className="w-6 h-6 text-gray-500" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">Contenu complet après achat</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                        Acheter maintenant
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalPreview;
