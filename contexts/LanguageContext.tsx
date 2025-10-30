import React, { createContext, useState, useContext, FC, ReactNode, useEffect } from 'react';
import { translations } from '../translations';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('fluentify-lang') as Language) || 'id';
  });

  useEffect(() => {
    localStorage.setItem('fluentify-lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, ...args: any[]): string => {
    const langStrings = translations[language] as any;
    const stringTemplate = langStrings[key] || key;
    if (typeof stringTemplate === 'function') {
      return stringTemplate(...args);
    }
    return stringTemplate;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
