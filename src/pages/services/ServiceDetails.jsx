import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, ShieldCheck, Share2 } from 'lucide-react';
import BookingCalendar from '../../components/services/BookingCalendar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useServices } from '../../hooks/useServices';
import { useToast } from '../../components/ui/Toast';

const ServiceDetails = () => {
    const { id } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toast = useToast();

    // Booking State
    const [bookingSlot, setBookingSlot] = useState(null);

    // Financial Transfer State
    const [transferAmount, setTransferAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const { getServiceById } = useServices();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadService = async () => {
            if (id) {
                const data = await getServiceById(id);
                setService(data);
                setLoading(false);
            }
        };
        loadService();
    }, [id, getServiceById]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
    if (!service) return <div className="min-h-screen flex items-center justify-center">Service introuvable</div>;

    const isFinancial = service.category === 'financial';

    const handleAction = async () => {
        if (isFinancial) {
            // Validation
            if (!transferAmount || isNaN(transferAmount) || Number(transferAmount) <= 0) {
                setError(t('invalid_amount'));
                return;
            }
            // Strict 509 Validation (8 digits after 509)
            const phoneRegex = /^509\d{8}$/;
            if (!phoneRegex.test(recipient.replace(/\s/g, ''))) {
                setError(t('invalid_number'));
                return;
            }

            setError('');
            setIsProcessing(true);

            // Simulation Backend (2s latency)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Success Logic
            const serviceName = service.title === 'Paiement EDH' ? 'facture EDH' : service.title;

            toast.success(t('payment_success_msg').replace('{serviceName}', serviceName), {
                duration: 5000,
                action: {
                    label: 'Voir reçu',
                    onClick: () => navigate('/wallet')
                }
            });

            setIsProcessing(false);
            navigate('/wallet');
        } else {
            if (!bookingSlot) return;

            const confirmMsg = t('reservation_confirm_msg')
                .replace('{title}', service.title)
                .replace('{date}', bookingSlot.date.toDateString())
                .replace('{time}', bookingSlot.time)
                .replace('{price}', service.price)
                .replace('{currency}', service.currency);

            // Keeping window.confirm for critical decision, but alert replaced
            if (window.confirm(confirmMsg)) {
                toast.success(t('reservation_confirmed_alert'));
                navigate('/orders');
            }
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* Breadcrumbs */}
                <div className="text-sm text-gray-500 mb-6">
                    Services &gt; {t(service.category) || service.category} &gt; {service.title}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
                                        {service.image}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{service.title}</h1>
                                        <p className="text-indigo-600 font-medium cursor-pointer hover:underline">{service.ownerName || 'Union Finance'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 font-bold text-gray-900">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        {service.rating}
                                    </div>
                                    <span className="text-xs text-gray-500 underline">{service.reviews} {t('reviews')}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                    <Clock className="w-4 h-4 text-gray-400" /> {isFinancial ? t('instant') : service.duration}
                                </div>
                                {!isFinancial && (
                                    <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                        <MapPin className="w-4 h-4 text-gray-400" /> {service.locationType === 'client_home' ? 'Chez le client' : 'Sur place'}
                                    </div>
                                )}
                                <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200 text-green-700 font-medium">
                                    <ShieldCheck className="w-4 h-4" /> {t('verified')}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-2">{t('about_service_title')}</h3>
                                <p className="text-gray-600 leading-relaxed">{service.description}</p>
                            </div>
                        </div>

                        {/* CONDITIONAL CONTENT: Transfer Form OR Calendar */}
                        {isFinancial ? (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">💸</span>
                                    {t('choose_amount')}
                                </h3>
                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount_to_pay')}</label>
                                        <input
                                            type="number"
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            placeholder="Ex: 500"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipient_number')}</label>
                                        <input
                                            type="tel"
                                            value={recipient}
                                            onChange={(e) => {
                                                setRecipient(e.target.value);
                                                setError('');
                                            }}
                                            placeholder="Ex: 509 3xxx xxxx"
                                            className={`w-full px-4 py-3 rounded-xl border ${error && error.includes('Numéro') ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                        />
                                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <BookingCalendar onSlotSelect={setBookingSlot} />
                        )}
                    </div>

                    {/* Right Column: Checkout/Action Card (1 col) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">{isFinancial ? t('total_amount_to_pay') : t('total_to_pay')}</p>
                                    <p className="text-3xl font-black text-gray-900">
                                        {isFinancial ? (transferAmount ? Number(transferAmount).toLocaleString() : '0') : service.price.toLocaleString()}
                                        <span className="text-sm font-medium text-gray-500 ml-1">{service.currency}</span>
                                    </p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 cursor-pointer">
                                    <Share2 className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                {isFinancial ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('amount_paid')}</span>
                                            <span className="font-medium text-gray-900">{transferAmount || 0} HTG</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('transfer_fees')}</span>
                                            <span className="font-medium text-green-600">0 HTG ({t('free')})</span>
                                        </div>
                                        <div className="h-px bg-gray-100"></div>
                                        <div className="flex justify-between text-sm font-bold">
                                            <span>{t('total_debit')}</span>
                                            <span>{transferAmount || 0} HTG</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">{t('service_fees')}</span>
                                            <span className="font-medium text-green-600">{t('free')}</span>
                                        </div>
                                        <div className="h-px bg-gray-100"></div>
                                        <div className="flex justify-between text-sm font-bold">
                                            <span>{t('total')}</span>
                                            <span>{service.price.toLocaleString()} {service.currency}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleAction}
                                disabled={isFinancial ? (isProcessing || !transferAmount || !recipient) : !bookingSlot}
                                className={`w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all shadow-lg
                                    ${(isFinancial ? (transferAmount && recipient && !isProcessing) : bookingSlot)
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}
                                `}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>{t('processing_transaction')}</span>
                                    </div>
                                ) : (
                                    <span className="text-lg">{isFinancial ? t('pay_now_btn') : t('reserve_now_btn')}</span>
                                )}
                                {!isFinancial && bookingSlot && (
                                    <span className="text-xs font-normal opacity-80 mt-1">
                                        le {new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(bookingSlot.date)} à {bookingSlot.time}
                                    </span>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-400 mt-4">
                                {isFinancial
                                    ? t('secure_transaction_msg')
                                    : t('free_cancellation_msg')}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ServiceDetails;
