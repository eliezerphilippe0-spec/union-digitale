import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, Plus, Trash2, Save, Clock, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';

const AddService = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Initial State
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        currency: 'HTG',
        duration: 60, // minutes
        category: 'beauty',
        description: '',
        locationType: 'provider_location', // or 'client_home'
        images: [],
        availability: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '10:00', end: '16:00' },
            sunday: { enabled: false, start: '10:00', end: '16:00' }
        }
    });

    const days = [
        { key: 'monday', label: 'Lundi' },
        { key: 'tuesday', label: 'Mardi' },
        { key: 'wednesday', label: 'Mercredi' },
        { key: 'thursday', label: 'Jeudi' },
        { key: 'friday', label: 'Vendredi' },
        { key: 'saturday', label: 'Samedi' },
        { key: 'sunday', label: 'Dimanche' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvailabilityChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    [field]: value
                }
            }
        }));
    };

    const handleToggleDay = (day) => {
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    enabled: !prev.availability[day].enabled
                }
            }
        }));
    };

    const { addService } = useServices();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addService({
                ...formData,
                price: Number(formData.price),
                duration: Number(formData.duration)
            });
            alert("Service publié avec succès !");
            navigate('/seller/dashboard');
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Erreur lors de la création du service.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-900">
                <Plus className="w-6 h-6" /> Ajouter un Service
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Basic Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                        <span className="bg-indigo-100 p-1 rounded text-indigo-600">1</span> Informations de base
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Nom du service</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="ex: Coiffure à domicile, Réparation AC..."
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Prix</label>
                            <div className="relative">
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg pl-16 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    className="absolute left-1 top-1 bottom-1 w-14 bg-gray-50 border-none rounded text-xs font-bold text-gray-600 focus:ring-0"
                                >
                                    <option value="HTG">HTG</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Durée (minutes)</label>
                            <div className="relative">
                                <input
                                    name="duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Catégorie</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="beauty">Beauté & Bien-être</option>
                                <option value="home">Maison & Réparations</option>
                                <option value="education">Cours & Formation</option>
                                <option value="events">Événementiel</option>
                                <option value="transport">Transport & Livraison</option>
                                <option value="business">Services Pro (Compta, Design...)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Lieu de prestation</label>
                            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, locationType: 'provider_location' }))}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.locationType === 'provider_location' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Chez moi / Au bureau
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, locationType: 'client_home' }))}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.locationType === 'client_home' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Chez le client
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Décrivez votre service en détail..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* 2. Availability Schedule */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                        <span className="bg-green-100 p-1 rounded text-green-600">2</span> Disponibilités
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Définissez vos horaires d'ouverture habituels. Les clients ne pourront réserver que dans ces créneaux.</p>

                    <div className="space-y-3">
                        {days.map(day => (
                            <div key={day.key} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="w-32 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.availability[day.key].enabled}
                                        onChange={() => handleToggleDay(day.key)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span className={`font-medium ${formData.availability[day.key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {day.label}
                                    </span>
                                </div>

                                {formData.availability[day.key].enabled ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={formData.availability[day.key].start}
                                            onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="time"
                                            value={formData.availability[day.key].end}
                                            onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Fermé</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform hover:scale-105"
                    >
                        {loading ? 'Enregistrement...' : <><Save className="w-4 h-4" /> Publier le Service</>}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AddService;
