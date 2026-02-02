import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Video, FileText, Mail } from 'lucide-react';

const AmbassadorResources = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <Link to="/ambassador/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Ressources Marketing</h1>
                <p className="text-gray-600 mb-8">Tout ce dont vous avez besoin pour promouvoir Union Digitale comme un pro.</p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Scripts TikTok / Reels */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                                <Video className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Scripts Vidéo (TikTok/Reels)</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-sm mb-2 text-gray-800">Accroche "Argent en ligne" (15s)</h3>
                                <p className="text-sm text-gray-600 italic mb-3">
                                    "Arrête de scroller ! Tu veux savoir comment les Haïtiens génèrent des revenus passifs en 2025 ? Ils utilisent Union Digitale pour vendre leurs connaissances. Clique sur le lien en bio pour commencer !"
                                </p>
                                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                    <Copy className="w-3 h-3" /> Copier le script
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-sm mb-2 text-gray-800">Tutoriel Rapide (30s)</h3>
                                <p className="text-sm text-gray-600 italic mb-3">
                                    "Regarde comment je crée une boutique en 3 clics sur Union Digitale. 1. Je m'inscris. 2. J'ajoute mon produit. 3. Je partage le lien. C'est aussi simple que ça. Reçois tes paiements par MonCash. Lien en bio !"
                                </p>
                                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                    <Copy className="w-3 h-3" /> Copier le script
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Email Templates */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Templates Email / WhatsApp</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-sm mb-2 text-gray-800">Message à un ami créateur</h3>
                                <p className="text-sm text-gray-600 italic mb-3">
                                    "Salut ! J'ai vu que tu créais du super contenu. Tu savais que tu pouvais le vendre sur Union Digitale ? C'est la plateforme n°1 en Haïti. Utilise mon code [CODE] pour avoir un bonus de départ. Check ça : [LIEN]"
                                </p>
                                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                    <Copy className="w-3 h-3" /> Copier le message
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Visual Assets */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Visuels & Logos</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                                <div className="h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Logo SVG</div>
                                <span className="text-sm font-medium">Logo Officiel</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                                <div className="h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Banner</div>
                                <span className="text-sm font-medium">Bannière Facebook</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                                <div className="h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Story</div>
                                <span className="text-sm font-medium">Template Story</span>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer">
                                <div className="h-20 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">PDF</div>
                                <span className="text-sm font-medium">Guide PDF</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmbassadorResources;
