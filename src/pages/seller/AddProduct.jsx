import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, Plus, Trash2, Save, Shirt, Ruler, Loader, Sparkles, AlertCircle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { db, storage, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { geminiService } from '../../services/geminiService';
import { uploadLicenseKeys } from '../../services/digitalService';

const AddProduct = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [auditResult, setAuditResult] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'clothing',
        description: '',
        images: [],
        status: 'active',
        isDigital: false,
        digitalType: 'key', // key, file, link
        licenseKeys: '', // Textarea input for bulk keys
        fitType: 'regular',
        fabricElasticity: 'medium',
        sizeChart: {
            S: { chest: '', waist: '' },
            M: { chest: '', waist: '' },
            L: { chest: '', waist: '' },
            XL: { chest: '', waist: '' }
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateDescription = async () => {
        if (!formData.title) {
            alert("Veuillez d'abord saisir un titre pour le produit.");
            return;
        }
        setIsGenerating(true);
        try {
            const desc = await geminiService.generateProductDescription(
                formData.title,
                `${formData.category}, premium, quality`,
                'professional'
            );
            setFormData(prev => ({ ...prev, description: desc }));
        } catch (error) {
            console.error("AI Generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAudit = async () => {
        setIsAuditing(true);
        try {
            const result = await geminiService.auditProductListing({
                title: formData.title,
                description: formData.description,
                price: formData.price,
                category: formData.category
            });
            setAuditResult(result);
        } catch (error) {
            console.error("Audit error:", error);
        } finally {
            setIsAuditing(false);
        }
    };

    const applyOptimization = () => {
        if (!auditResult) return;
        setFormData(prev => ({
            ...prev,
            title: auditResult.optimized.title,
            description: auditResult.optimized.description
        }));
        setAuditResult(null);
        alert("Optimisations appliquées avec succès !");
    };

    const handleImageChange = (e) => {
        // ... rest of the file
        if (e.target.files && e.target.files[0]) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);

            // Generate previews
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newPreviews] // Temporary previews
            }));
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSizeChartChange = (size, metric, value) => {
        setFormData(prev => ({
            ...prev,
            sizeChart: {
                ...prev.sizeChart,
                [size]: {
                    ...prev.sizeChart[size],
                    [metric]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!auth.currentUser) {
            alert(t('login_required') || "Vous devez être connecté pour ajouter un produit.");
            return;
        }

        setLoading(true);

        // Validation for Clothing
        if (formData.category === 'clothing' && !formData.isDigital) {
            const hasSizes = Object.values(formData.sizeChart).some(s => s.chest && s.waist);
            if (!hasSizes) {
                alert(t('error_missing_sizes') || "Veuillez remplir le guide des tailles.");
                setLoading(false);
                return;
            }
        }

        // Validation for Digital
        if (formData.isDigital && formData.digitalType === 'key' && !formData.licenseKeys.trim()) {
            alert("Veuillez saisir au moins une clé de licence.");
            setLoading(false);
            return;
        }

        try {
            // 1. Upload Images
            let imageUrls = [];
            if (imageFiles.length > 0) {
                setUploading(true);
                const uploadPromises = imageFiles.map(async (file) => {
                    const storageRef = ref(storage, `products/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return await getDownloadURL(storageRef);
                });
                imageUrls = await Promise.all(uploadPromises);
                setUploading(false);
            }

            // 2. Create Product Document
            const finalImageUrls = imageUrls.length > 0 ? imageUrls : formData.images.filter(url => url.startsWith('http'));

            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                images: finalImageUrls,
                image: finalImageUrls[0] || null, // Primary image for compatibility
                sellerId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'products'), productData);

            // 3. Handle Digital Keys if applicable
            if (formData.isDigital && formData.digitalType === 'key' && formData.licenseKeys) {
                await uploadLicenseKeys(docRef.id, formData.licenseKeys);
            }

            alert(t('product_saved') || "Produit ajouté avec succès !");
            navigate('/seller/dashboard'); // Redirect to dashboard

        } catch (error) {
            console.error("Error adding product:", error);
            alert("Erreur lors de l'ajout du produit: " + error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6" /> {t('add_product') || "Ajouter un produit"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">{t('basic_info') || "Informations de base"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Titre</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Prix (HTG)</label>
                            <input
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Catégorie</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="clothing">Vêtements (Mode)</option>
                                <option value="shoes">Chaussures</option>
                                <option value="electronics">Électronique</option>
                                <option value="home">Maison</option>
                                <option value="digital">UD Digital Store (Vouchers, Clés, etc.)</option>
                            </select>
                        </div>

                        {/* Digital Product Toggle */}
                        <div className="col-span-2">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <div className="flex-1">
                                    <h4 className="font-bold text-indigo-900">Produit Digital</h4>
                                    <p className="text-xs text-indigo-700/60 font-medium">Activez cette option pour les codes, cartes cadeaux ou services immatériels.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isDigital: !prev.isDigital }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isDigital ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isDigital ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {formData.isDigital && (
                            <div className="col-span-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type de livraison Digitale</label>
                                    <select
                                        name="digitalType"
                                        value={formData.digitalType}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="key">Clés de licence / Vouchers (Livraison Automatisée)</option>
                                        <option value="file">Fichier (Download)</option>
                                        <option value="service" disabled>Service / Consultation (Plus tard)</option>
                                    </select>
                                </div>
                                {formData.digitalType === 'key' && (
                                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                        <label className="block text-sm font-bold mb-1 text-amber-900">Clés / Codes de licence (Un par ligne)</label>
                                        <textarea
                                            value={formData.licenseKeys}
                                            onChange={(e) => setFormData(prev => ({ ...prev, licenseKeys: e.target.value }))}
                                            placeholder="XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY"
                                            className="w-full p-3 bg-white border border-amber-200 rounded-lg h-32 font-mono text-sm"
                                        ></textarea>
                                        <p className="mt-2 text-[10px] text-amber-700">Le stock sera automatiquement calculé selon le nombre de clés saisies.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="col-span-2">
                            <div className="flex justify-between items-end mb-1">
                                <label className="block text-sm font-medium">Description</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating}
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all disabled:opacity-50"
                                >
                                    {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    {isGenerating ? "Génération..." : "Générer avec l'IA"}
                                </button>
                            </div>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="6"
                                placeholder="Décrivez votre produit ici ou laissez l'IA le faire pour vous..."
                                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-medium text-gray-700 placeholder:text-gray-300 transition-all"
                            ></textarea>
                            <p className="mt-2 text-[10px] text-gray-400 font-medium italic">
                                ✨ Propulsé par Google Gemini pour un contenu vendeur et optimisé SEO.
                            </p>
                        </div>

                        {/* Image Upload Section */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Photos</label>
                            <div className="flex flex-wrap gap-4">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Virtual Fitting Room Data */}
                {(formData.category === 'clothing' || formData.category === 'shoes') && !formData.isDigital && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shirt className="w-24 h-24 text-indigo-600" />
                        </div>

                        <h2 className="font-bold text-lg mb-4 text-indigo-900 flex items-center gap-2">
                            <Ruler className="w-5 h-5" /> Essayage Virtuel (Obligatoire)
                        </h2>

                        {formData.category === 'clothing' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type de Coupe</label>
                                    <select
                                        name="fitType"
                                        value={formData.fitType}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="slim">Ajustée (Slim)</option>
                                        <option value="regular">Normale (Regular)</option>
                                        <option value="oversized">Ample (Oversized)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Élasticité du tissu</label>
                                    <select
                                        name="fabricElasticity"
                                        value={formData.fabricElasticity}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="low">Faible (Rigide)</option>
                                        <option value="medium">Moyenne (Standard)</option>
                                        <option value="high">Haute (Extensible)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Guide des Tailles</label>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-indigo-100 text-indigo-800">
                                        <tr>
                                            <th className="p-2 rounded-tl-lg whitespace-nowrap">{formData.category === 'clothing' ? 'Taille' : 'Pointure (EU)'}</th>
                                            {formData.category === 'clothing' ? (
                                                <>
                                                    <th className="p-2 whitespace-nowrap">Poitrine (Chest) - cm</th>
                                                    <th className="p-2 rounded-tr-lg whitespace-nowrap">Taille (Waist) - cm</th>
                                                </>
                                            ) : (
                                                <th className="p-2 rounded-tr-lg whitespace-nowrap">Longueur Max Pied (cm)</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-indigo-50">
                                        {(formData.category === 'clothing' ? ['S', 'M', 'L', 'XL'] : ['38', '39', '40', '41', '42', '43', '44']).map(size => (
                                            <tr key={size}>
                                                <td className="p-2 font-bold text-gray-700">{size}</td>
                                                {formData.category === 'clothing' ? (
                                                    <>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                placeholder="90"
                                                                value={formData.sizeChart[size]?.chest || ''}
                                                                onChange={(e) => handleSizeChartChange(size, 'chest', e.target.value)}
                                                                className="w-full min-w-[80px] p-1 border rounded"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                placeholder="70"
                                                                value={formData.sizeChart[size]?.waist || ''}
                                                                onChange={(e) => handleSizeChartChange(size, 'waist', e.target.value)}
                                                                className="w-full min-w-[80px] p-1 border rounded"
                                                            />
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            placeholder="ex: 26.5"
                                                            value={formData.sizeChart[size]?.maxFootLength || ''}
                                                            onChange={(e) => handleSizeChartChange(size, 'maxFootLength', e.target.value)}
                                                            className="w-full min-w-[80px] p-1 border rounded"
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gemini AI Smart Audit Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles className="w-24 h-24 text-indigo-600" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#0A1D37]">Audit Intelligent Gemini</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Optimisation de conversion IA</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAudit}
                            disabled={isAuditing || !formData.title || !formData.description}
                            className="bg-[#0A1D37] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                        >
                            {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : <RefreshCw className="w-4 h-4 inline mr-2" />}
                            {isAuditing ? "Analyse..." : "Analyser ma fiche"}
                        </button>
                    </div>

                    {!auditResult && !isAuditing && (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-medium">Remplissez le titre et la description pour lancer l'audit.</p>
                        </div>
                    )}

                    {auditResult && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                                <div className="relative">
                                    <svg className="w-20 h-20 transform -rotate-90">
                                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-100" />
                                        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - auditResult.score / 100)} className="text-indigo-600 transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black text-indigo-900">{auditResult.score}%</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-black text-[#0A1D37] text-lg uppercase tracking-tight">Grade : {auditResult.grade}</h3>
                                    <p className="text-sm text-gray-600 font-medium">{auditResult.summary}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {auditResult.issues.map((issue, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 ${issue.severity === 'high' || issue.severity === 'critical' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight mb-1">{issue.type}</p>
                                            <p className="text-sm font-medium">{issue.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[#0A1D37] p-8 rounded-3xl text-white">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-300 mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Recommandations d'Expert
                                </h4>
                                <ul className="space-y-3 mb-8">
                                    {auditResult.suggestions.map((s, i) => (
                                        <li key={i} className="text-sm font-medium flex gap-3">
                                            <span className="text-indigo-400">•</span> {s}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={applyOptimization}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/30"
                                >
                                    Appliquer les Optimisations IA
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading || uploading ? (
                            <><Loader className="w-4 h-4 animate-spin" /> {uploading ? 'Envoi des photos...' : 'Enregistrement...'}</>
                        ) : (
                            <><Save className="w-4 h-4" /> Enregistrer</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
