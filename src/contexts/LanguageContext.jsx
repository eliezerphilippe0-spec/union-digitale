import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    return useContext(LanguageContext);
};

export const LanguageProvider = ({ children }) => {
    // Try to get language from localStorage, default to 'fr'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('union_digitale_lang');
        return saved || 'fr';
    });

    useEffect(() => {
        localStorage.setItem('union_digitale_lang', language);
    }, [language]);

    // Translation function
    const t = (key) => {
        const langData = translations[language];
        if (!langData) return key; // Fallback
        return langData[key] || key; // Return key if translation missing
    };

    const value = {
        language,
        setLanguage,
        t
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
