import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getSalonBySlug, getSalonServices } from '../../services/salonService';
import BookingWizard from '../../components/salons/BookingWizard';
import { ArrowLeft } from 'lucide-react';

const SalonBooking = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [slug]);

    const loadData = async () => {
        try {
            setLoading(true);
            const salonData = await getSalonBySlug(slug);
            if (!salonData) {
                navigate('/salons');
                return;
            }
            setSalon(salonData);

            const servicesData = await getSalonServices(salonData.id);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading booking data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-indigo-600 font-bold text-2xl">Préparation de la réservation...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Simple Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Réserver chez {salon.shopName}</h1>
                        <p className="text-sm font-medium text-slate-400">Étape par étape</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <BookingWizard
                    salon={salon}
                    services={services}
                    initialServiceId={searchParams.get('serviceId')}
                />
            </div>
        </div>
    );
};

export default SalonBooking;
