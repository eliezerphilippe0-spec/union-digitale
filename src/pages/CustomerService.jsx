import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Truck, RotateCcw, MessageCircle, HelpCircle, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const CustomerService = () => {
    const { t } = useLanguage();
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            q: t('cs_faq_q1'),
            a: t('cs_faq_a1')
        },
        {
            q: t('cs_faq_q2'),
            a: t('cs_faq_a2')
        },
        {
            q: t('cs_faq_q3'),
            a: t('cs_faq_a3')
        },
        {
            q: t('cs_faq_q4'),
            a: t('cs_faq_a4')
        }
    ];

    const quickActions = [
        { icon: Truck, label: t('track_order_action'), link: "/orders" },
        { icon: RotateCcw, label: t('returns_refunds_action'), link: "/orders" },
        { icon: MessageCircle, label: t('chat_support_action'), link: "#", action: () => alert(t('chat_open_alert')) },
        { icon: HelpCircle, label: t('general_help_action'), link: "#" }
    ];

    return (
        <MainLayout>
            <div className="bg-gray-50 min-h-screen pb-12">
                {/* Hero Banner */}
                <div className="bg-secondary text-white py-12 px-4 text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('cs_hero_title')}</h1>
                    <div className="max-w-xl mx-auto bg-white rounded-lg overflow-hidden flex shadow-lg">
                        <input
                            type="text"
                            placeholder={t('search_help_placeholder')}
                            className="flex-1 px-6 py-3 text-gray-800 outline-none"
                        />
                        <button className="bg-primary hover:bg-primary-hover text-white px-6 font-bold transition-colors">
                            {t('search_btn')}
                        </button>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-8">
                    {/* Quick Actions Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        {quickActions.map((action, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer group">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                                    <action.icon className="w-8 h-8 text-secondary" />
                                </div>
                                <h3 className="font-bold text-gray-800">{action.label}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* FAQ Section */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('faq_title')}</h2>
                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 hover:bg-gray-50 bg-white"
                                        >
                                            {faq.q}
                                            {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        {openFaq === index && (
                                            <div className="p-4 pt-0 text-gray-600 bg-white border-t border-gray-50">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-4">{t('contact_us')}</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <Phone className="w-5 h-5 text-secondary mt-1" />
                                        <div>
                                            <div className="font-bold">{t('phone_label')}</div>
                                            <div className="text-sm text-gray-600">+509 1234-5678</div>
                                            <div className="text-xs text-gray-500">{t('opening_hours')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Mail className="w-5 h-5 text-secondary mt-1" />
                                        <div>
                                            <div className="font-bold">{t('email_label')}</div>
                                            <div className="text-sm text-gray-600">support@uniondigitale.ht</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default CustomerService;
