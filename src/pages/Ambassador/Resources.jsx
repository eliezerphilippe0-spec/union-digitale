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

                    {/* Visual Assets (Marketing Kit) */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Rocket className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[#0A1D37]">Kit Marketing Officiel</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Édition {new Date().getFullYear()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Bannière Facebook", type: "IMAGE", size: "1200x630", color: "blue" },
                                { title: "Instagram Story", type: "MOBILE", size: "1080x1920", color: "purple" },
                                { title: "WhatsApp Promo", type: "SQUARE", size: "1080x1080", color: "green" },
                                { title: "Dossier Complet", type: "ZIP", size: "45 MB", color: "gray" }
                            ].map((asset, i) => (
                                <div key={i} className="group border border-gray-100 rounded-2xl p-4 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 overflow-hidden relative">
                                    <div className={`h-32 bg-${asset.color}-50 rounded-xl mb-4 flex items-center justify-center text-${asset.color}-600 font-black text-xs uppercase tracking-tighter opacity-80 group-hover:scale-105 transition-transform`}>
                                        {asset.type} {asset.size}
                                    </div>
                                    <div className="flex flex-col gap-1 mb-4">
                                        <span className="text-sm font-black text-[#0A1D37] truncate">{asset.title}</span>
                                        <span className="text-[10px] text-gray-400 font-bold">{asset.size} • JPG</span>
                                    </div>
                                    <button className="w-full bg-gray-50 group-hover:bg-blue-600 group-hover:text-white text-gray-500 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2">
                                        <Download className="w-4 h-4" /> Télécharger
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmbassadorResources;
