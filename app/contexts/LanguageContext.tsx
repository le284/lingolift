import React, { createContext, useContext } from 'react';
import { translations, Language } from '../utils/translations';

export interface LanguageContextType {
    lang: Language;
    toggleLang: () => void;
    t: typeof translations['en'];
}

export const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    toggleLang: () => { },
    t: translations['en']
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLang] = React.useState<Language>(() => {
        const saved = localStorage.getItem('lingolift_lang');
        return (saved === 'en' || saved === 'zh') ? saved : 'en';
    });

    const toggleLang = () => {
        setLang(prev => {
            const newLang = prev === 'en' ? 'zh' : 'en';
            localStorage.setItem('lingolift_lang', newLang);
            return newLang;
        });
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t: translations[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
};
