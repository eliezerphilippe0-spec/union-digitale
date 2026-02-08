/**
 * VideoUploader - Upload et gestion de vidéos pour vendeurs
 * Support: Vidéo de boutique, Vidéos de produits, Vidéos Live
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
    Upload, Video, X, Play, Pause, Trash2, 
    Check, AlertCircle, Film, Clock, FileVideo,
    Youtube, Link2, Camera
} from 'lucide-react';

const VideoUploader = ({ 
    onUpload, 
    maxSize = 100, // MB
    maxDuration = 60, // seconds
    allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'],
    existingVideos = [],
    multiple = false,
    type = 'product' // 'product', 'store', 'live'
}) => {
    const [videos, setVideos] = useState(existingVideos);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    
    const fileInputRef = useRef(null);
    const videoPreviewRef = useRef(null);

    const typeConfig = {
        product: {
            title: "Vidéo du produit",
            description: "Montrez votre produit en action (max 60s)",
            icon: Film,
            maxDuration: 60,
        },
        store: {
            title: "Vidéo de présentation",
            description: "Présentez votre boutique aux clients",
            icon: Video,
            maxDuration: 120,
        },
        live: {
            title: "Vidéo Live",
            description: "Diffusez en direct pour vos clients",
            icon: Camera,
            maxDuration: null,
        },
    };

    const config = typeConfig[type];

    const validateFile = (file) => {
        // Check type
        if (!allowedTypes.includes(file.type)) {
            return `Format non supporté. Utilisez: MP4, WebM, MOV`;
        }
        
        // Check size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSize) {
            return `Fichier trop volumineux (${sizeMB.toFixed(1)}MB). Maximum: ${maxSize}MB`;
        }
        
        return null;
    };

    const getVideoDuration = (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (files) => {
        setError(null);
        const file = files[0];
        
        if (!file) return;

        // Validate
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        // Check duration
        const duration = await getVideoDuration(file);
        if (config.maxDuration && duration > config.maxDuration) {
            setError(`Vidéo trop longue (${Math.round(duration)}s). Maximum: ${config.maxDuration}s`);
            return;
        }

        // Create preview
        const preview = {
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            duration: Math.round(duration),
            size: (file.size / (1024 * 1024)).toFixed(1),
            uploading: true,
        };

        setPreviewVideo(preview);
        
        // Simulate upload
        setUploading(true);
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(r => setTimeout(r, 200));
            setUploadProgress(i);
        }
        
        // Complete upload
        const uploaded = { ...preview, uploading: false, id: Date.now() };
        if (multiple) {
            setVideos([...videos, uploaded]);
        } else {
            setVideos([uploaded]);
        }
        
        setUploading(false);
        setUploadProgress(0);
        setPreviewVideo(null);
        onUpload?.([...videos, uploaded]);
    };

    const handleYoutubeUrl = () => {
        // Extract YouTube video ID
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = youtubeUrl.match(regex);
        
        if (!match) {
            setError('URL YouTube invalide');
            return;
        }

        const videoId = match[1];
        const video = {
            id: Date.now(),
            type: 'youtube',
            videoId,
            url: `https://www.youtube.com/embed/${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        };

        if (multiple) {
            setVideos([...videos, video]);
        } else {
            setVideos([video]);
        }
        
        setYoutubeUrl('');
        setShowUrlInput(false);
        onUpload?.([...videos, video]);
    };

    const handleDelete = (videoId) => {
        const updated = videos.filter(v => v.id !== videoId);
        setVideos(updated);
        onUpload?.(updated);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length) handleFileSelect(files);
    }, []);

    const Icon = config.icon;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{config.title}</h3>
                    <p className="text-sm text-gray-500">{config.description}</p>
                </div>
            </div>

            {/* Upload Area */}
            {(multiple || videos.length === 0) && (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragOver 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-indigo-600 animate-bounce" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Upload en cours...</p>
                                <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto mt-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileVideo className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-2">
                                Glissez votre vidéo ici ou
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Parcourir
                                </button>
                                <button
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    YouTube
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                MP4, WebM, MOV · Max {maxSize}MB · Max {config.maxDuration}s
                            </p>
                        </>
                    )}
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={allowedTypes.join(',')}
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                    />
                </div>
            )}

            {/* YouTube URL Input */}
            {showUrlInput && (
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        onClick={handleYoutubeUrl}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                    >
                        Ajouter
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Video Preview / Existing Videos */}
            {videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                        <div 
                            key={video.id}
                            className="relative group rounded-xl overflow-hidden border border-gray-200"
                        >
                            {video.type === 'youtube' ? (
                                <div className="aspect-video">
                                    <iframe
                                        src={video.url}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video bg-black">
                                    <video
                                        src={video.url}
                                        className="w-full h-full object-contain"
                                        controls
                                    />
                                </div>
                            )}
                            
                            {/* Video Info */}
                            <div className="p-3 bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        {video.duration && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {video.duration}s
                                            </span>
                                        )}
                                        {video.size && (
                                            <span>{video.size}MB</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(video.id)}
                                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Upload indicator */}
                            {video.uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full mx-auto mb-2" />
                                        Upload...
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour une bonne vidéo</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Filmez en bonne lumière naturelle</li>
                    <li>• Montrez le produit sous tous les angles</li>
                    <li>• Gardez la vidéo courte et dynamique</li>
                    <li>• Ajoutez une démonstration d'utilisation</li>
                </ul>
            </div>
        </div>
    );
};

export default VideoUploader;
