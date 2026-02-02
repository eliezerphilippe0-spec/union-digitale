import React from 'react';
import FunnelEditor from '../components/FunnelBuilder/FunnelEditor';
import { Layout, Zap, BarChart3 } from 'lucide-react';

const FunnelBuilder = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Constructeur de Tunnel</h1>
                        <p className="text-gray-500 mt-1">Créez des parcours de vente automatisés à haute conversion.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                            Aperçu
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm">
                            Publier le Tunnel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        <FunnelEditor />

                        {/* Stats Preview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" /> Performance Estimée
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-600 font-medium">Conversion</div>
                                    <div className="text-2xl font-bold text-blue-900">4.5%</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-sm text-green-600 font-medium">Panier Moyen</div>
                                    <div className="text-2xl font-bold text-green-900">3,500 G</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-sm text-purple-600 font-medium">Revenus / Mois</div>
                                    <div className="text-2xl font-bold text-purple-900">150k G</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings & Templates */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Layout className="w-5 h-5 text-purple-600" /> Modèles
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer ring-2 ring-blue-500">
                                    <div className="font-bold text-blue-900">Produit Digital Simple</div>
                                    <div className="text-xs text-blue-700 mt-1">Page de vente + Checkout + Merci</div>
                                </div>
                                <div className="p-3 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                    <div className="font-bold text-gray-900">Webinaire Gratuit</div>
                                    <div className="text-xs text-gray-500 mt-1">Inscription + Confirmation + Replay</div>
                                </div>
                                <div className="p-3 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                    <div className="font-bold text-gray-900">Lancement Produit</div>
                                    <div className="text-xs text-gray-500 mt-1">Vidéo 1 &gt; Vidéo 2 &gt; Vente</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" /> Mode Pro
                            </h3>
                            <p className="text-indigo-100 text-sm mb-4">
                                Débloquez les tests A/B, les domaines personnalisés et l'automatisation avancée.
                            </p>
                            <button className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                Passer au plan Business
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunnelBuilder;
