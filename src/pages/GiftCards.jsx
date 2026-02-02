import React, { useState } from 'react';
import { Gift, CreditCard, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

const GiftCards = () => {
    const { addToCart } = useCart();
    const { t } = useLanguage();
    const [selectedAmount, setSelectedAmount] = useState(1000);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [message, setMessage] = useState('');

    const amounts = [500, 1000, 2500, 5000, 10000];

    const handleAddToCart = (e) => {
        e.preventDefault();
        addToCart({
            id: `gift-card-${Date.now()}`,
            title: `${t('gift_card_title_prefix')} - ${selectedAmount} G`,
            price: selectedAmount,
            originalPrice: selectedAmount,
            image: "🎁",
            vendor: "Union Digitale",
            rating: 5,
            reviews: 0,
            type: 'digital',
            subtype: 'gift_card',
            metadata: {
                recipientEmail,
                message
            }
        });
        alert(t('gift_card_added'));
        setRecipientEmail('');
        setMessage('');
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
                    {/* Visual Preview */}
                    <div className="md:w-1/2 bg-gradient-to-br from-primary to-secondary p-8 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>

                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold italic mb-2">Union <span className="text-yellow-300">Gift</span></h1>
                            <p className="opacity-90">{t('gift_hero_text')}</p>
                        </div>

                        <div className="relative z-10 my-12 text-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30 inline-block shadow-xl transform rotate-1">
                                <Gift className="w-16 h-16 mx-auto mb-4" />
                                <div className="text-4xl font-bold">{selectedAmount.toLocaleString()} G</div>
                            </div>
                        </div>

                        <div className="relative z-10 text-xs opacity-75">
                            {t('gift_hero_subtext')}
                        </div>
                    </div>

                    {/* Configuration Form */}
                    <div className="md:w-1/2 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('configure_card')}</h2>

                        <form onSubmit={handleAddToCart} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('amount_label')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {amounts.map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setSelectedAmount(amount)}
                                            className={`py-2 px-3 rounded-md text-sm font-bold border ${selectedAmount === amount
                                                ? 'bg-secondary text-white border-secondary'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-secondary'
                                                }`}
                                        >
                                            {amount.toLocaleString()} G
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('recipient_email_optional')}</label>
                                <input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="exemple@email.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('recipient_email_hint')}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('message_label')}</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t('message_placeholder')}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <CreditCard className="w-5 h-5" />
                                {t('add_gift_card_cart')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Info Secion */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <Check className="w-8 h-8 text-green-500 mb-2" />
                        <h3 className="font-bold mb-1">{t('instant_delivery_title')}</h3>
                        <p className="text-sm text-gray-500">{t('instant_delivery_desc')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <Check className="w-8 h-8 text-green-500 mb-2" />
                        <h3 className="font-bold mb-1">{t('no_expiration_title')}</h3>
                        <p className="text-sm text-gray-500">{t('no_expiration_desc')}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <Check className="w-8 h-8 text-green-500 mb-2" />
                        <h3 className="font-bold mb-1">{t('secure_payment_title')}</h3>
                        <p className="text-sm text-gray-500">{t('secure_payment_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiftCards;
