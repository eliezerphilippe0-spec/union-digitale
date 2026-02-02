import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, Plus, Trash2, Save, Shirt, Ruler, Loader } from 'lucide-react';
import { db, storage, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'clothing',
        description: '',
        images: [],
        status: 'active', // Default to active for MVP
        // New Fitting Room Fields
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

    const handleImageChange = (e) => {
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
        if (formData.category === 'clothing') {
            const hasSizes = Object.values(formData.sizeChart).some(s => s.chest && s.waist);
            if (!hasSizes) {
                alert(t('error_missing_sizes') || "Veuillez remplir le guide des tailles.");
                setLoading(false);
                return;
            }
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

            await addDoc(collection(db, 'products'), productData);

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
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-2 border rounded-lg"
                            ></textarea>
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
                {(formData.category === 'clothing' || formData.category === 'shoes') && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shirt className="w-24 h-24 text-indigo-600" />
                        </div>

                        <h2 className="font-bold text-lg mb-4 text-indigo-900 flex items-center gap-2">
                            <Ruler className="w-5 h-5" /> {t('fitting_room_data') || "Essayage Virtuel (Obligatoire)"}
                        </h2>

                        {formData.category === 'clothing' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('fr_label_fit_pref') || "Type de Coupe"}</label>
                                    <select
                                        name="fitType"
                                        value={formData.fitType}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="slim">{t('fr_fit_tight') || "Ajustée (Slim)"}</option>
                                        <option value="regular">{t('fr_fit_regular') || "Normale (Regular)"}</option>
                                        <option value="oversized">{t('fr_fit_loose') || "Ample (Oversized)"}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('fabric_elasticity') || "Élasticité du tissu"}</label>
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
                            <label className="block text-sm font-medium mb-2">{t('size_chart') || "Guide des Tailles"}</label>
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
