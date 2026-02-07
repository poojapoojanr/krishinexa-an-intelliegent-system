/**
 * Google Cloud Translation Service
 * Uses Google Cloud Translation API for accurate multi-language support
 * With LOCAL FALLBACK for language detection using Unicode script analysis
 * 
 * This file is imported by server actions, not called directly from client
 */

import { Translate } from '@google-cloud/translate/build/src/v2';

// Initialize Google Translate client
let translateClient: Translate | null = null;
let translationApiEnabled = true; // Track if API is working

function getTranslateClient(): Translate {
  if (!translateClient) {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY not found');
    }
    
    translateClient = new Translate({ key: apiKey });
  }
  return translateClient;
}

export type SupportedLanguage = 'en' | 'hi' | 'kn';

// Language codes for Google Translate
const LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  en: 'en',
  hi: 'hi',
  kn: 'kn',
};

/**
 * LOCAL FALLBACK: Detect language using Unicode script analysis
 * This works without any API calls - analyzes character ranges
 * 
 * Hindi uses Devanagari script: U+0900 to U+097F
 * Kannada uses Kannada script: U+0C80 to U+0CFF
 * English uses Latin script: U+0000 to U+007F
 */
function detectLanguageLocal(text: string): SupportedLanguage {
  // Count characters in each script
  let hindiChars = 0;
  let kannadaChars = 0;
  let englishChars = 0;
  let totalChars = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);
    
    // Skip whitespace and punctuation
    if (/\s/.test(char) || /[.,!?;:'"()\-]/.test(char)) continue;
    
    totalChars++;
    
    // Devanagari (Hindi): U+0900 - U+097F
    if (code >= 0x0900 && code <= 0x097F) {
      hindiChars++;
    }
    // Kannada: U+0C80 - U+0CFF
    else if (code >= 0x0C80 && code <= 0x0CFF) {
      kannadaChars++;
    }
    // Basic Latin (English): U+0041 - U+007A (A-Z, a-z)
    else if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
      englishChars++;
    }
  }

  if (totalChars === 0) return 'en';

  // Calculate percentages
  const hindiPct = hindiChars / totalChars;
  const kannadaPct = kannadaChars / totalChars;
  const englishPct = englishChars / totalChars;

  // Return language with highest percentage (threshold of 30% to be confident)
  if (kannadaPct > 0.3 && kannadaPct >= hindiPct) return 'kn';
  if (hindiPct > 0.3 && hindiPct > kannadaPct) return 'hi';
  return 'en'; // Default to English
}

/**
 * Translate text to target language
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string> {
  // Don't translate if already in target language or if target is English
  if (sourceLang === targetLang) {
    return text;
  }

  try {
    const client = getTranslateClient();
    const targetCode = LANGUAGE_CODES[targetLang];
    
    const [translation] = await client.translate(text, {
      to: targetCode,
      from: sourceLang ? LANGUAGE_CODES[sourceLang] : undefined,
    });
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Detect the language of text
 * Uses Google Cloud Translation API with LOCAL FALLBACK using Unicode script detection
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  // First try local detection - it's fast and doesn't require API
  const localDetection = detectLanguageLocal(text);
  
  // If local detection found Hindi or Kannada, trust it (script detection is reliable)
  if (localDetection !== 'en') {
    console.log(`Language detected locally: ${localDetection}`);
    return localDetection;
  }
  
  // For English or uncertain cases, try Google API if enabled
  if (translationApiEnabled) {
    try {
      const client = getTranslateClient();
      const [detection] = await client.detect(text);
      
      const detectedLang = Array.isArray(detection) ? detection[0].language : detection.language;
      
      // Map detected language to our supported languages
      if (detectedLang === 'hi') return 'hi';
      if (detectedLang === 'kn') return 'kn';
      return 'en'; // Default to English
    } catch (error: any) {
      // Check if API is disabled (403 error)
      if (error?.code === 403) {
        console.warn('Google Translation API is disabled. Using local detection only.');
        translationApiEnabled = false;
      } else {
        console.error('Language detection error:', error);
      }
      // Fall back to local detection
      return localDetection;
    }
  }
  
  // API disabled, return local detection result
  return localDetection;
}

/**
 * Translate multiple texts at once (more efficient for batch operations)
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string[]> {
  if (texts.length === 0) return [];
  
  try {
    const client = getTranslateClient();
    const targetCode = LANGUAGE_CODES[targetLang];
    
    const [translations] = await client.translate(texts, {
      to: targetCode,
      from: sourceLang ? LANGUAGE_CODES[sourceLang] : undefined,
    });
    
    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts if translation fails
  }
}

/**
 * Language-specific greetings and common phrases
 */
export const LANGUAGE_PHRASES: Record<SupportedLanguage, {
  greeting: string;
  farewell: string;
  thinking: string;
  error: string;
  noData: string;
  currency: string;
}> = {
  en: {
    greeting: 'Hello! I am your KrishiNexa farming assistant. How can I help you today?',
    farewell: 'Thank you for using KrishiNexa. Happy farming!',
    thinking: 'Let me check that for you...',
    error: 'Sorry, I encountered an error. Please try again.',
    noData: 'No data available at the moment.',
    currency: '₹',
  },
  hi: {
    greeting: 'नमस्ते! मैं आपका कृषिनेक्सा खेती सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
    farewell: 'कृषिनेक्सा का उपयोग करने के लिए धन्यवाद। खुशहाल खेती!',
    thinking: 'मैं आपके लिए जांच कर रहा हूं...',
    error: 'क्षमा करें, कोई त्रुटि हुई। कृपया पुनः प्रयास करें।',
    noData: 'इस समय कोई डेटा उपलब्ध नहीं है।',
    currency: '₹',
  },
  kn: {
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿನೆಕ್ಸಾ ಕೃಷಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    farewell: 'ಕೃಷಿನೆಕ್ಸಾ ಬಳಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಸಂತೋಷದ ಕೃಷಿ!',
    thinking: 'ನಾನು ನಿಮಗಾಗಿ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ...',
    error: 'ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    noData: 'ಈ ಸಮಯದಲ್ಲಿ ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.',
    currency: '₹',
  },
};

/**
 * Get localized phrase
 */
export function getPhrase(
  key: keyof typeof LANGUAGE_PHRASES['en'],
  lang: SupportedLanguage
): string {
  return LANGUAGE_PHRASES[lang][key];
}
