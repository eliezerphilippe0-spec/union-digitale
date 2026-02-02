import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { geminiService } from '../../services/geminiService';
import { usageStatsService } from '../../services/usageStatsService';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
    Search, Sparkles, AlertTriangle, CheckCircle, XCircle,
    TrendingUp, Tag, FileText, DollarSign, Loader, RefreshCw,
    ChevronRight, Copy, Check, Lightbulb, Target, Zap
} from 'lucide-react';

const SmartAudit = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [auditResult, setAuditResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [copied, setCopied] = useState({ title: false, description: false });

    // Load vendor products
    useEffect(() => {
        const fetchProducts = async () => {
            if (!currentUser) {
                setLoadingProducts(false);
                return;
            }

            try {
                const q = query(
                    collection(db, 'products'),
                    where('vendorId', '==', currentUser.uid)
                );
                const snapshot = await getDocs(q);
                const productList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(productList);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [currentUser]);

    // Run audit on selected product
    const runAudit = async (product) => {
        setSelectedProduct(product);
        setLoading(true);
        setAuditResult(null);

        try {
            const result = await geminiService.auditProductListing({
                title: product.title || product.name,
                description: product.description,
                tags: product.tags || [],
                price: product.price,
                category: product.category
            });

            setAuditResult(result);
            usageStatsService.trackAIAudit();
        } catch (error) {
            console.error('Audit error:', error);
            setAuditResult({
                error: true,
                message: 'Erreur lors de l\'audit. Veuillez réessayer.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Apply optimized content to product
    const applyOptimization = async (field) => {
        if (!selectedProduct || !auditResult?.optimized) return;

        try {
            const productRef = doc(db, 'products', selectedProduct.id);
            const updates = {};

            if (field === 'title') {
                updates.title = auditResult.optimized.title;
                updates.name = auditResult.optimized.title;
            } else if (field === 'description') {
                updates.description = auditResult.optimized.description;
            } else if (field === 'tags') {
                updates.tags = auditResult.optimized.suggestedTags;
            }

            await updateDoc(productRef, updates);

            // Update local state
            setSelectedProduct(prev => ({ ...prev, ...updates }));
            setProducts(prev => prev.map(p =>
                p.id === selectedProduct.id ? { ...p, ...updates } : p
            ));

            alert(`${field === 'title' ? 'Titre' : field === 'description' ? 'Description' : 'Tags'} mis à jour !`);
        } catch (error) {
            console.error('Error applying optimization:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    // Copy to clipboard
    const copyToClipboard = async (text, field) => {
        await navigator.clipboard.writeText(text);
        setCopied(prev => ({ ...prev, [field]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000);
    };

    // Get severity color
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    // Get grade color
    const getGradeColor = (grade) => {
        switch (grade) {
            case 'A': return 'text-emerald-600 bg-emerald-100';
            case 'B': return 'text-blue-600 bg-blue-100';
            case 'C': return 'text-yellow-600 bg-yellow-100';
            case 'D': return 'text-orange-600 bg-orange-100';
            case 'F': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Sparkles className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Smart Audit IA
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Connectez-vous pour auditer vos produits
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-xl font-semibold hover:bg-gold-600 transition-colors"
                    >
                        Se connecter
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Smart Audit IA</h1>
                            <p className="text-white/80">
                                Optimisez vos fiches produits pour maximiser vos ventes
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <FileText className="w-5 h-5 mb-2 text-white/70" />
                            <p className="text-2xl font-bold">{products.length}</p>
                            <p className="text-sm text-white/70">Produits</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <Target className="w-5 h-5 mb-2 text-white/70" />
                            <p className="text-2xl font-bold">
                                {usageStatsService.getLocalStats().aiAuditsPerformed}
                            </p>
                            <p className="text-sm text-white/70">Audits réalisés</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <TrendingUp className="w-5 h-5 mb-2 text-white/70" />
                            <p className="text-2xl font-bold">+25%</p>
                            <p className="text-sm text-white/70">Conversion moyenne</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <Zap className="w-5 h-5 mb-2 text-white/70" />
                            <p className="text-2xl font-bold">IA</p>
                            <p className="text-sm text-white/70">Gemini Pro</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Search className="w-5 h-5" />
                                    Sélectionnez un produit
                                </h2>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto">
                                {loadingProducts ? (
                                    <div className="p-8 text-center">
                                        <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Aucun produit trouvé</p>
                                        <a
                                            href="/seller/add-product"
                                            className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                                        >
                                            Ajouter un produit
                                        </a>
                                    </div>
                                ) : (
                                    products.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => runAudit(product)}
                                            className={`w-full p-4 text-left border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors ${
                                                selectedProduct?.id === product.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0] ? (
                                                    <img
                                                        src={product.images[0]}
                                                        alt=""
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-neutral-600 flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {product.title || product.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {product.price?.toLocaleString()} G
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Results */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-12 text-center">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-ping"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Analyse en cours...
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Notre IA examine votre fiche produit
                                </p>
                            </div>
                        ) : auditResult ? (
                            <div className="space-y-6">
                                {/* Score Card */}
                                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Résultat de l'audit
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {selectedProduct?.title || selectedProduct?.name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => runAudit(selectedProduct)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                        >
                                            <RefreshCw className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        {/* Score Circle */}
                                        <div className="relative">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    fill="none"
                                                    className="text-gray-200 dark:text-neutral-700"
                                                />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    fill="none"
                                                    strokeDasharray={`${(auditResult.score / 100) * 352} 352`}
                                                    strokeLinecap="round"
                                                    className={
                                                        auditResult.score >= 75 ? 'text-emerald-500' :
                                                        auditResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                                                    }
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {auditResult.score}
                                                </span>
                                                <span className="text-sm text-gray-500">/100</span>
                                            </div>
                                        </div>

                                        {/* Grade & Summary */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`text-3xl font-bold px-4 py-2 rounded-xl ${getGradeColor(auditResult.grade)}`}>
                                                    {auditResult.grade}
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400">Grade</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {auditResult.summary}
                                            </p>
                                            {auditResult.isSimulated && (
                                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Mode simulation (IA hors ligne)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Issues */}
                                {auditResult.issues?.length > 0 && (
                                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            Problèmes détectés ({auditResult.issues.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {auditResult.issues.map((issue, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-4 rounded-xl border ${getSeverityColor(issue.severity)}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {issue.severity === 'critical' || issue.severity === 'high' ? (
                                                            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium capitalize">{issue.type}</p>
                                                            <p className="text-sm opacity-80">{issue.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {auditResult.suggestions?.length > 0 && (
                                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                                            Suggestions d'amélioration
                                        </h3>
                                        <ul className="space-y-3">
                                            {auditResult.suggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl"
                                                >
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Optimized Content */}
                                {auditResult.optimized && (
                                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-indigo-500" />
                                            Contenu optimisé par l'IA
                                        </h3>

                                        {/* Optimized Title */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Titre optimisé
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={auditResult.optimized.title}
                                                    readOnly
                                                    className="w-full p-3 pr-24 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-gray-900 dark:text-white"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                                    <button
                                                        onClick={() => copyToClipboard(auditResult.optimized.title, 'title')}
                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                                                    >
                                                        {copied.title ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                                    </button>
                                                    <button
                                                        onClick={() => applyOptimization('title')}
                                                        className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                                                    >
                                                        Appliquer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Optimized Description */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Description optimisée
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={auditResult.optimized.description}
                                                    readOnly
                                                    rows={5}
                                                    className="w-full p-3 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-gray-900 dark:text-white resize-none"
                                                />
                                                <div className="absolute right-2 top-2 flex gap-1">
                                                    <button
                                                        onClick={() => copyToClipboard(auditResult.optimized.description, 'description')}
                                                        className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                                                    >
                                                        {copied.description ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                                                    </button>
                                                    <button
                                                        onClick={() => applyOptimization('description')}
                                                        className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                                                    >
                                                        Appliquer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Suggested Tags */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tags suggérés
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {auditResult.optimized.suggestedTags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={() => applyOptimization('tags')}
                                                    className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-full hover:bg-indigo-600 transition-colors"
                                                >
                                                    Appliquer tous
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-indigo-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Sélectionnez un produit à auditer
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    Notre IA analysera le titre, la description, les tags et le prix pour vous donner des recommandations d'expert ecommerce.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartAudit;
