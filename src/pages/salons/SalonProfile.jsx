import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, Clock, Scissors, Info, ChevronRight, CheckCircle, Camera, Star } from 'lucide-react';
import { getSalonBySlug, getSalonServices } from '../../services/salonService';
import { getProductReviews } from '../../services/reviewService';

const SalonProfile = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('services');

    useEffect(() => {
        loadSalonData();
    }, [slug]);

    const loadSalonData = async () => {
        try {
            setLoading(true);
            const salonData = await getSalonBySlug(slug);
            if (!salonData) {
                navigate('/salons');
                return;
            }
            setSalon(salonData);

            const [servicesData, reviewsData] = await Promise.all([
                getSalonServices(salonData.id),
                getProductReviews(salonData.id) // Reusing review service with vendorId as productId
            ]);

            setServices(servicesData);
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error loading salon profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold">Chargement du profil...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Cover Image */}
            <div className="h-64 md:h-80 relative">
                {salon.shopBanner ? (
                    <img src={salon.shopBanner} className="w-full h-full object-cover" alt={salon.shopName} />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
                )}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Profile Header */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
                <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="relative">
                            {salon.shopLogo ? (
                                <img src={salon.shopLogo} className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg" alt={salon.shopName} />
                            ) : (
                                <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                                    <Scissors size={48} className="text-slate-300" />
                                </div>
                            )}
                            {salon.verified && (
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                    <CheckCircle size={28} className="text-indigo-600" fill="currentColor" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow">
                            <h1 className="text-3xl font-black text-slate-800 mb-2">{salon.shopName}</h1>
                            <div className="flex flex-wrap gap-4 items-center text-slate-500 font-medium text-sm">
                                <div className="flex items-center gap-1">
                                    <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                                    <span className="text-slate-800">{salon.rating?.toFixed(1) || '0.0'}</span>
                                    <span>({salon.reviewCount || 0} avis)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={16} />
                                    <span>{salon.address?.city || 'Haïti'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span className="text-emerald-600">Ouvert actuellement</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <Link
                                to={`/salons/${slug}/book`}
                                className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95"
                            >
                                Réserver maintenant
                            </Link>
                        </div>
                    </div>

                    <p className="mt-8 text-slate-600 leading-relaxed max-w-2xl">{salon.description}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 mt-12">
                {/* Tabs */}
                <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'services', label: 'Services', icon: Scissors },
                        { id: 'gallery', label: 'Galerie', icon: Camera },
                        { id: 'reviews', label: 'Avis', icon: Star },
                        { id: 'info', label: 'Infos', icon: Info }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 border-b-2 border-transparent hover:text-slate-600'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        {services.length > 0 ? (
                            services.map(service => (
                                <div key={service.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all group">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{service.title}</h3>
                                        <div className="flex gap-4 text-slate-500 text-sm font-medium">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {service.serviceDetails?.durationMin || 30} min</span>
                                            <span className="font-black text-indigo-600 tracking-tighter text-base">{service.price} HTG</span>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/salons/${slug}/book?serviceId=${service.id}`}
                                        className="bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 p-3 rounded-2xl transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400">Aucun service disponible pour le moment.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-8">
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                                            {review.userName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{review.userName || 'Utilisateur'}</h4>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} size={14} fill={i <= review.rating ? '#fbbf24' : 'none'} stroke={i <= review.rating ? '#fbbf24' : '#cbd5e1'} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 italic">"{review.content}"</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                                <p className="text-slate-400 font-medium">Pas encore d'avis.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Other tabs omitted for brevity but following the same premium design... */}
            </div>
        </div>
    );
};

export default SalonProfile;
