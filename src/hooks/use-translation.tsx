"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

// Define the shape of the translation context
interface TranslationContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
}

// Create the context with a default value
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Define the props for the provider component
interface TranslationProviderProps {
  children: ReactNode;
}

// Translation cache to avoid repeated API calls
const translationCache: Record<string, Record<string, string>> = {};

// Load static translations from JSON files
const loadStaticTranslations = async (lang: string): Promise<Record<string, string>> => {
  try {
    const translationModule = await import(`@/locales/${lang}.json`);
    return translationModule.default;
  } catch (error) {
    console.error(`Could not load static translations for ${lang}`, error);
    if (lang !== 'en') {
      const fallbackModule = await import(`@/locales/en.json`);
      return fallbackModule.default;
    }
    return {};
  }
};

// Google Translate API via server-side endpoint
const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (targetLang === 'en') return text;
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage: targetLang }),
    });
    
    if (!response.ok) return text;
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.warn(`Translation API failed for "${text}":`, error);
    return text;
  }
};

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const languageLoadingRef = useRef<string | null>(null);

  // Load language from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }
  }, []);

  // Wrapper to persist language choice to localStorage
  const setLanguage = useCallback((newLanguage: string) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLanguage);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    if (!isClient || languageLoadingRef.current === language) return;
    
    languageLoadingRef.current = language;
    setIsLoading(true);

    const loadTranslations = async () => {
      try {
        // Check cache first
        if (translationCache[language]) {
          setTranslations(translationCache[language]);
          setIsLoading(false);
          return;
        }

        // Load static translations
        const staticTranslations = await loadStaticTranslations(language);
        translationCache[language] = staticTranslations;
        setTranslations(staticTranslations);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        if (language !== 'en') {
          const fallbackTranslations = await loadStaticTranslations('en');
          translationCache[language] = fallbackTranslations;
          setTranslations(fallbackTranslations);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language, isClient]);

  const t = useCallback((key: string, fallback: string = key) => {
    // Return from cache first
    if (translations[key]) {
      return translations[key];
    }
    
    // Return fallback
    return fallback;
  }, [translations]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translations, t, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
