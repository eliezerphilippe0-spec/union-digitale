import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Shield, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { useLanguage } from '../../contexts/LanguageContext';

export default function KYCVerification() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [idFront, setIdFront] = useState(null);
    const [idBack, setIdBack] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('unverified'); // unverified, pending, verified, rejected
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            if (!currentUser) return;
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setStatus(docSnap.data().verificationStatus || 'unverified');
                }
            } catch (err) {
                console.error("Error fetching status:", err);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, [currentUser]);

    const handleUpload = async (file, type) => {
        const storageRef = ref(storage, `kyc/${currentUser.uid}/${type}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!idFront || !idBack) {
            alert(t('upload_both_sides_alert'));
            return;
        }

        setUploading(true);
        try {
            const frontUrl = await handleUpload(idFront, 'front');
            const backUrl = await handleUpload(idBack, 'back');

            await updateDoc(doc(db, 'users', currentUser.uid), {
                verificationStatus: 'pending',
                documents: {
                    idFront: frontUrl,
                    idBack: backUrl,
                    submittedAt: serverTimestamp()
                },
                role: 'seller' // Or keep as customer until approved? Let's intent to sell.
            });

            setStatus('pending');
            alert(t('docs_sent_alert'));
        } catch (err) {
            console.error(err);
            alert("Erreur: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <SEO title={t('kyc_page_title')} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center mb-8">
                        <Shield className="mx-auto h-12 w-12 text-secondary" />
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">{t('seller_verification')}</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {t('kyc_desc')}
                        </p>
                    </div>

                    {status === 'verified' && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                            <h3 className="text-lg font-medium text-green-800">{t('account_verified')}</h3>
                            <p className="text-sm text-green-600 mt-1">{t('can_publish_ads')}</p>
                            <button onClick={() => navigate('/seller/cars/new')} className="mt-4 w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                                {t('publish_ad_btn')}
                            </button>
                        </div>
                    )}

                    {status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                            <div className="mx-auto h-8 w-8 text-yellow-500 mb-2 font-bold text-xl animate-pulse">...</div>
                            <h3 className="text-lg font-medium text-yellow-800">{t('validation_pending')}</h3>
                            <p className="text-sm text-yellow-600 mt-1">{t('verification_time')}</p>
                            <button onClick={() => navigate('/account')} className="mt-4 w-full border border-yellow-600 text-yellow-700 py-2 rounded font-bold hover:bg-yellow-100">
                                {t('back_account_btn')}
                            </button>
                        </div>
                    )}

                    {(status === 'unverified' || status === 'rejected') && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'rejected' && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm flex gap-2 items-center">
                                    <AlertTriangle className="w-4 h-4" /> {t('docs_rejected')}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('id_front_label')}</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                                    <div className="space-y-1 text-center">
                                        {idFront ? (
                                            <p className="text-green-600 font-bold">{idFront.name}</p>
                                        ) : (
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        )}
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-secondary hover:text-secondary-hover">
                                                <span>{t('upload_front')}</span>
                                                <input type="file" className="sr-only" accept="image/*" onChange={e => setIdFront(e.target.files[0])} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('id_back_label')}</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                                    <div className="space-y-1 text-center">
                                        {idBack ? (
                                            <p className="text-green-600 font-bold">{idBack.name}</p>
                                        ) : (
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        )}
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-secondary hover:text-secondary-hover">
                                                <span>{t('upload_back')}</span>
                                                <input type="file" className="sr-only" accept="image/*" onChange={e => setIdBack(e.target.files[0])} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                            >
                                {uploading ? t('sending') : t('submit_validation')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
