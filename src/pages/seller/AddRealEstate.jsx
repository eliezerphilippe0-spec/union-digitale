import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useRealEstate } from '../../hooks/useRealEstate';
import { Home, MapPin, DollarSign, Upload, FileText, CheckCircle, Shield, Sparkles, Wand2, Loader } from 'lucide-react';
import { geminiService } from '../../services/geminiService';
import useGeolocation from '../../hooks/useGeolocation';

const AddRealEstate = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addListing, loading } = useRealEstate();

    // Steps: 1=Type, 2=Details, 3=Confirm
    const [step, setStep] = useState(1);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiTone, setAiTone] = useState('creative');

    const { address: geoAddress, loading: geoLoading, getLocation } = useGeolocation();

    React.useEffect(() => {
        if (geoAddress) {
            setFormData(prev => ({
                ...prev,
                location: geoAddress.full || `${geoAddress.street}, ${geoAddress.city}`,
                lat: geoAddress.lat, // assuming we want to store coords too
                lng: geoAddress.lng
            }));
        }
    }, [geoAddress]);

    const [formData, setFormData] = useState({
        type: 'house', // house, land, rental
        title: '',
        price: '',
        currency: 'HTG',
        surface: '', // m2
        rooms: 3,
        location: '',
        description: '',
        amenities: [],
        legalAgreed: false
    });

    const handleTypeSelect = (type) => {
        setFormData({ ...formData, type });
        setStep(2);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addListing(formData);
            alert("Annonce soumise pour validation !");
            navigate('/seller/dashboard');
        } catch (error) {
            alert("Erreur: " + error.message);
        }
    };

    const handleAIGenerate = async () => {
        if (!formData.title) {
            alert("Veuillez d'abord saisir un titre pour l'annonce.");
            return;
        }

        setAiGenerating(true);
        try {
            const propertyContext = `${formData.type}, ${formData.surface}m2, ${formData.rooms} chambres, ${formData.location}`;
            const generated = await geminiService.generateProductDescription(formData.title, propertyContext, aiTone);
            
            if (generated) {
                setFormData(prev => ({ ...prev, description: generated }));
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            alert("L'assistant IA est temporairement indisponible.");
        } finally {
            setAiGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 flex items-center gap-3">
                <Home className="text-secondary" /> Publier une annonce Immo
            </h1>

            {/* PROGRESS BAR */}
            <div className="flex gap-4 mb-8">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-secondary' : 'bg-gray-200'}`}></div>
            </div>

            {/* STEP 1: TYPE SELECTION */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => handleTypeSelect('land')} className="p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-secondary hover:bg-orange-50 cursor-pointer transition-all text-center group">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏞️</div>
                        <h3 className="text-xl font-bold">Terrain</h3>
                        <p className="text-sm text-gray-500">Vente de parcelles nues</p>
                    </div>
                    <div onClick={() => handleTypeSelect('house')} className="p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-secondary hover:bg-orange-50 cursor-pointer transition-all text-center group">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏡</div>
                        <h3 className="text-xl font-bold">Maison / Villa</h3>
                        <p className="text-sm text-gray-500">Vente résidentielle</p>
                    </div>
                    <div onClick={() => handleTypeSelect('rental')} className="p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-secondary hover:bg-orange-50 cursor-pointer transition-all text-center group">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏨</div>
                        <h3 className="text-xl font-bold">Location (Airbnb)</h3>
                        <p className="text-sm text-gray-500">Courte durée</p>
                    </div>
                </div>
            )}

            {/* STEP 2: DETAILS FORM */}
            {step === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Détails du bien ({formData.type === 'rental' ? 'Location' : 'Vente'})</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1">Titre de l'annonce</label>
                                <input name="title" value={formData.title} onChange={handleChange} required className="w-full p-3 border rounded-lg focus:ring-secondary" placeholder="Ex: Belle villa 4 chambres Pétion-Ville" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Prix {formData.type === 'rental' ? '(par nuit)' : '(Total)'}</label>
                                <div className="flex gap-2">
                                    <input name="price" type="number" value={formData.price} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
                                    <select name="currency" value={formData.currency} onChange={handleChange} className="border rounded-lg bg-gray-50">
                                        <option>HTG</option>
                                        <option>USD</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">Surface (m²)</label>
                                <input name="surface" type="number" value={formData.surface} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="150" />
                            </div>

                            {formData.type !== 'land' && (
                                <div>
                                    <label className="block text-sm font-bold mb-1">Chambres</label>
                                    <input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full p-3 border rounded-lg" />
                                </div>
                            )}

                            <div className="col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-bold">{t('address_street') || 'Adresse complète'}</label>
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        disabled={geoLoading}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        <MapPin className="w-3 h-3" />
                                        {geoLoading ? t('locating') : t('locate_me')}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 border rounded-lg p-3 bg-white">
                                    <MapPin className="text-gray-400" />
                                    <input name="location" value={formData.location} onChange={handleChange} required className="w-full outline-none" placeholder="Rue, Quartier, Ville..." />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-bold">Description</label>
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={aiTone}
                                            onChange={(e) => setAiTone(e.target.value)}
                                            className="text-xs border rounded p-1 bg-gray-50 outline-none"
                                        >
                                            <option value="creative">Ton Créatif</option>
                                            <option value="professional">Ton Pro</option>
                                            <option value="excited">Ton Vendeur</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleAIGenerate}
                                            disabled={aiGenerating || !formData.title}
                                            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            {aiGenerating ? <Loader className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                            Assistant IA
                                        </button>
                                    </div>
                                </div>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    rows="4" 
                                    className="w-full p-3 border rounded-lg focus:ring-secondary" 
                                    placeholder="Décrivez les atouts de votre bien ou utilisez l'assistant IA..."
                                ></textarea>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    L'IA rédige une description immobilière professionnelle et captivante.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800">Retour</button>
                        <button type="submit" className="bg-secondary text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors">Suivant</button>
                    </div>
                </form>
            )}

            {/* STEP 3: LEGAL & CONFIRM */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4">
                        <Shield className="w-10 h-10 text-blue-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-blue-900">Validation Requise</h3>
                            <p className="text-sm text-blue-800 mt-1">Conformément à la politique d'Zabely, votre annonce sera vérifiée par un administrateur avant publication. Vous devez être en mesure de fournir les titres de propriété ou mandats de gestion sur demande.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4">Récapitulatif</h3>
                        <div className="text-sm space-y-2">
                            <p><strong>Type:</strong> {formData.type}</p>
                            <p><strong>Titre:</strong> {formData.title}</p>
                            <p><strong>Prix:</strong> {formData.price} {formData.currency}</p>
                            <p><strong>Lieu:</strong> {formData.location}</p>
                        </div>

                        <div className="mt-6 pt-6 border-t font-medium">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" name="legalAgreed" checked={formData.legalAgreed} onChange={handleChange} className="w-5 h-5 text-secondary rounded" />
                                <span>Je certifie sur l'honneur être habilité à proposer ce bien et accepte les conditions générales de vente immobilière.</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button onClick={() => setStep(2)} className="text-gray-500">Retour</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.legalAgreed || loading}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-colors ${!formData.legalAgreed ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {loading ? 'Envoi...' : 'Valider et Soumettre'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddRealEstate;
