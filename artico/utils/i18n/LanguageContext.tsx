import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

type Language = 'en' | 'zh' | 'fr' | 'it' | 'es' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'fr' || savedLanguage === 'it' || savedLanguage === 'es' || savedLanguage === 'de')) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const t = (key: string): string => {
    return (translations[language] as { [key: string]: string })[key] || key;
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