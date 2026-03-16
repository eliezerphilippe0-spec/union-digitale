import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Scissors, MapPin, Phone, MessageSquare, ChevronRight, Check, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getVendorByUserId, updateVendorShop } from '../../../services/vendorService';
import { getSalonServices } from '../../../services/salonService';
import { createOffer, deleteOffer } from '../../../services/offerService';
import { useToast } from '../../../components/ui/Toast';

const SalonSetup = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadSalonData();
    }, [currentUser]);

    const loadSalonData = async () => {
        try {
            setLoading(true);
            const vendorData = await getVendorByUserId(currentUser.uid);
            if (!vendorData || vendorData.category !== 'SALON') {
                // Should handle salon specific onboarding if needed
                navigate('/seller/onboarding');
                return;
            }
            setSalon(vendorData);

            const servicesData = await getSalonServices(vendorData.id);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading salon setup:', error);
            addToast({ title: 'Erreur', description: 'Impossible de charger vos données.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const formData = new FormData(e.target);
            const updates = {
                shopName: formData.get('shopName'),
                description: formData.get('description'),
                phone: formData.get('phone'),
                whatsapp: formData.get('whatsapp'),
                genderFocus: formData.get('genderFocus'),
                serviceMode: formData.get('serviceMode'),
                notificationsEnabled: formData.get('notificationsEnabled') === 'on',
                'address.city': formData.get('city')
            };

            await updateVendorShop(salon.id, updates);
            addToast({ title: 'Succès', description: 'Profil mis à jour.', type: 'success' });
            setSalon({ ...salon, ...updates });
        } catch (error) {
            addToast({ title: 'Erreur', description: 'Échec de la mise à jour.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const formData = new FormData(e.target);
            const newService = {
                vendorId: salon.id,
                type: 'service',
                title: formData.get('title'),
                price: parseFloat(formData.get('price')),
                serviceDetails: {
                    durationMin: parseInt(formData.get('duration'))
                }
            };

            await createOffer(newService);
            addToast({ title: 'Service ajouté', type: 'success' });
            loadSalonData();
            e.target.reset();
        } catch (error) {
            addToast({ title: 'Erreur', description: 'Échec de l\'ajout.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Supprimer ce service ?')) return;
        try {
            await deleteOffer(id);
            addToast({ title: 'Service supprimé', type: 'success' });
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            addToast({ title: 'Erreur', type: 'error' });
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold">Initialisation de votre espace salon...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Seller Header */}
            <div className="bg-indigo-900 text-white pt-12 pb-24 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion Salon</h1>
                        <p className="opacity-60 text-sm font-medium">Configurez votre boutique et vos services</p>
                    </div>
                    <button onClick={() => navigate('/seller/salon/calendar')} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
                        Voir le calendrier
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-12">
                {/* Navigation Tabs */}
                <div className="bg-white rounded-[2rem] shadow-xl p-4 flex gap-4 mb-8 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'profile', label: 'Profil de boutique', icon: MapPin },
                        { id: 'services', label: 'Mes Services', icon: Scissors },
                        { id: 'photos', label: 'Galerie Photos', icon: Camera }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Nom du Salon</label>
                                    <input name="shopName" defaultValue={salon.shopName} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Ville</label>
                                    <input name="city" defaultValue={salon.address?.city} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Téléphone</label>
                                    <input name="phone" defaultValue={salon.phone} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">WhatsApp</label>
                                    <input name="whatsapp" defaultValue={salon.whatsapp} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black uppercase tracking-tight text-slate-800">Notifications WhatsApp</h4>
                                        <p className="text-xs text-slate-400 font-medium">Recevoir une alerte pour chaque nouvelle réservation</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="notificationsEnabled" defaultChecked={salon.notificationsEnabled ?? true} className="sr-only peer" />
                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Description</label>
                                <textarea name="description" defaultValue={salon.description} rows={4} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-600" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Spécialité</label>
                                    <select name="genderFocus" defaultValue={salon.genderFocus} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800">
                                        <option value="MIX">Mixte</option>
                                        <option value="H">Homme seulement</option>
                                        <option value="F">Femme seulement</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Type de service</label>
                                    <select name="serviceMode" defaultValue={salon.serviceMode} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800">
                                        <option value="IN_SHOP">En Salon</option>
                                        <option value="HOME">À Domicile</option>
                                        <option value="BOTH">Les deux</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Enregistrer les modifications</>}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Add New Service Form */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 overflow-hidden">
                            <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center gap-3">
                                <Plus size={24} className="text-indigo-600" /> Ajouter un service
                            </h3>
                            <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Nom du service</label>
                                    <input name="title" placeholder="Ex: Coupe Homme" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Prix (HTG)</label>
                                    <input name="price" type="number" placeholder="0" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Durée (min)</label>
                                    <input name="duration" type="number" defaultValue="30" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-800" required />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="md:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : 'Ajouter le service'}
                                </button>
                            </form>
                        </div>

                        {/* List of Services */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {services.map(service => (
                                <div key={service.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Scissors size={24} />
                                        </div>
                                        <button onClick={() => handleDeleteService(service.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{service.title}</h4>
                                    <div className="flex gap-4 mt-2 text-slate-400 font-bold text-sm">
                                        <span>{service.serviceDetails?.durationMin || 30} MIN</span>
                                        <span className="text-indigo-600">{service.price} HTG</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalonSetup;
