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
