import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const WhatsAppWidget = () => {
    const { t } = useLanguage();
    const phoneNumber = "50937000000"; // Replace with real support number
    const message = t('whatsapp_help_msg');

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div
            onClick={handleClick}
            className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg cursor-pointer hover:bg-[#20bd5a] transition-all z-50 flex items-center gap-2 group animate-bounce-slow"
            title={t('chat_on_whatsapp')}
        >
            <MessageCircle className="w-8 h-8" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold">
                {t('need_help')}
            </span>
        </div>
    );
};

export default WhatsAppWidget;
