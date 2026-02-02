import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, MessageSquare } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

const AITools = () => {
    const [activeTab, setActiveTab] = useState('description');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    // Form States
    const [productName, setProductName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('professional');
    const [platform, setPlatform] = useState('instagram');

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult('');

        try {
            let generatedText = '';
            if (activeTab === 'description') {
                generatedText = await geminiService.generateProductDescription(productName, keywords, tone);
            } else {
                generatedText = await geminiService.generateMarketingCopy(productName, platform);
            }
            setResult(generatedText);
        } catch (error) {
            console.error("AI Error:", error);
            setResult("Une erreur est survenue lors de la génération. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        alert('Texte copié !');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
                <div className="flex gap-4 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setActiveTab('description')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'description' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Description Produit
                    </button>
                    <button
                        onClick={() => setActiveTab('marketing')}
                        className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'marketing' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Marketing Social
                    </button>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Produit</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: Écouteurs sans fil Pro"
                            required
                        />
                    </div>

                    {activeTab === 'description' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés / Caractéristiques</label>
                                <textarea
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary h-24"
                                    placeholder="Ex: réduction de bruit, autonomie 24h, bluetooth 5.0..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ton</label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                >
                                    <option value="professional">Professionnel</option>
                                    <option value="excited">Enthousiaste / Vendeur</option>
                                    <option value="creative">Créatif / Luxe</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plateforme</label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter / X</option>
                                <option value="facebook">Facebook</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !productName}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'Génération en cours...' : 'Générer avec Gemini'}
                    </button>
                </form>
            </div>

            {/* Output Section */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative min-h-[300px]">
                <div className="absolute top-4 right-4">
                    <button
                        onClick={copyToClipboard}
                        disabled={!result}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Copier"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                </div>

                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Résultat
                </h3>

                {result ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 animate-fade-in">
                        {result}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                        <Sparkles className="w-12 h-12 mb-2 opacity-20" />
                        <p>Remplissez le formulaire et cliquez sur générer pour voir la magie opérer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AITools;
