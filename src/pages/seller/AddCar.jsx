import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AddCar() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    // KYC Check
    useEffect(() => {
        async function checkKYC() {
            if (currentUser) {
                const userDoc = await import('firebase/firestore').then(mod => mod.getDoc(mod.doc(db, 'users', currentUser.uid)));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.verificationStatus !== 'verified') {
                        // Redirect to KYC page
                        // Use a slightly softer approach: Alert then redirect
                        if (window.confirm(t('kyc_verify_alert'))) {
                            navigate('/seller/verify');
                        } else {
                            navigate('/');
                        }
                    }
                }
            }
        }
        checkKYC();
    }, [currentUser, navigate]);

    const [form, setForm] = useState({
        type: 'sale',
        brand: '',
        model: '',
        year: '',
        mileage: '',
        price: '',
        currency: 'HTG',
        location: ''
    });

    const [images, setImages] = useState([]); // Array of {file, preview, url}
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files).slice(0, 12);
        if (files.length === 0) return;

        // Create local previews immediately
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            url: null // Will be populated after upload
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const uploadImages = async () => {
        const uploadedUrls = [];
        for (const imageItem of images) {
            if (imageItem.url) {
                uploadedUrls.push(imageItem.url);
                continue;
            }

            const file = imageItem.file;
            const storageRef = ref(storage, `cars/${currentUser.uid}/${Date.now()}_${file.name}`);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                uploadedUrls.push(downloadURL);
            } catch (error) {
                console.error("Upload failed for file:", file.name, error);
                // Continue with other files or throw?
                throw new Error(t('upload_fail').replace('{file}', file.name));
            }
        }
        return uploadedUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors(null);

        if (!currentUser) {
            setErrors(t('login_required'));
            return;
        }

        // Basic Validation
        if (!form.brand || !form.model || !form.price) {
            setErrors(t('fill_required_fields'));
            return;
        }

        setUploading(true);

        try {
            // 1. Upload Images
            const photoUrls = await uploadImages();

            // 2. Create Firestore Doc
            const payload = {
                ...form,
                year: Number(form.year),
                price: Number(form.price),
                mileage: Number(form.mileage),
                ownerId: currentUser.uid,
                ownerEmail: currentUser.email,
                photos: photoUrls,
                status: 'active', // or pending if KYC check needed
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'cars'), payload);

            alert(t('ad_published_success'));
            // Navigate to car details or dashboard
            // navigate(`/seller/cars/${docRef.id}`);
            navigate('/catalog'); // Temporary redirect

        } catch (err) {
            console.error(err);
            setErrors(err.message || t('ad_creation_error'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-semibold text-[#0A1D37]">{t('add_car_title')}</h1>
            <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-gray-700 font-medium">{t('ad_type_label')}</span>
                        <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                        >
                            <option value="sale">{t('sale_option')}</option>
                            <option value="rent">{t('rent_option')}</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">{t('brand_label')} *</span>
                        <input
                            value={form.brand}
                            onChange={e => setForm({ ...form, brand: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: Toyota"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">{t('model_label')} *</span>
                        <input
                            value={form.model}
                            onChange={e => setForm({ ...form, model: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: Rav4"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">{t('year_label')}</span>
                        <input
                            value={form.year}
                            onChange={e => setForm({ ...form, year: e.target.value })}
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: 2018"
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700 font-medium">{t('mileage_label')} (km)</span>
                        <input
                            value={form.mileage}
                            onChange={e => setForm({ ...form, mileage: e.target.value })}
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: 50000"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                            <span className="text-gray-700 font-medium">{t('price_label')} *</span>
                            <input
                                value={form.price}
                                onChange={e => setForm({ ...form, price: e.target.value })}
                                type="number"
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                                placeholder="Ex: 15000"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700 font-medium">{t('currency_label')}</span>
                            <select
                                value={form.currency}
                                onChange={e => setForm({ ...form, currency: e.target.value })}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            >
                                <option value="HTG">HTG</option>
                                <option value="USD">USD</option>
                            </select>
                        </label>
                    </div>

                    <label className="block col-span-1 md:col-span-2">
                        <span className="text-gray-700 font-medium">{t('location_label')}</span>
                        <input
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-secondary focus:border-secondary"
                            placeholder="Ex: Pétion-Ville"
                        />
                    </label>
                </div>

                <div>
                    <label className="block mb-2">
                        <span className="text-gray-700 font-medium">{t('photos_label')}</span>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors relative">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 005.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-secondary hover:text-secondary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary">
                                        <span>{t('upload_files')}</span>
                                        <input type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
                                    </span>
                                    <p className="pl-1">{t('drag_drop')}</p>
                                </div>
                                <p className="text-xs text-gray-500">{t('file_constraints')}</p>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" multiple onChange={handleFileChange} />
                        </div>
                    </label>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group">
                                <img src={img.preview} alt="" className="w-full h-24 object-cover rounded shadow-sm" />
                                <button
                                    type="button"
                                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {errors && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">{errors}</div>}

                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mr-3 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                        {t('cancel_btn')}
                    </button>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                    >
                        {uploading ? t('publishing') : t('publish_btn')}
                    </button>
                </div>
            </form>
        </div>
    );
}
