/**
 * Language Configuration for KrishiNexa Chatbot
 * Shared between client and server components
 */

export type SupportedLanguage = 'en' | 'hi' | 'kn';

// Gemini TTS available voices: Aoede, Charon, Fenrir, Kore, Puck, Zephyr
// Note: All voices support multiple languages including Hindi and Kannada
export const LANGUAGE_CONFIG = {
  en: {
    name: 'English',
    voiceName: 'Kore', // Female voice, clear for English
    greeting: 'Hello! I am your KrishiNexa farming assistant. I can help you with weather updates, crop recommendations, market prices, government schemes, and more. How can I help you today?',
    languageCode: 'en',
  },
  hi: {
    name: 'Hindi',
    voiceName: 'Aoede', // Works well with Hindi
    greeting: 'नमस्ते! मैं आपका कृषिनेक्सा खेती सहायक हूं। मैं आपको मौसम, फसल सिफारिशें, मंडी भाव, सरकारी योजनाएं और भी बहुत कुछ में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
    languageCode: 'hi',
  },
  kn: {
    name: 'Kannada', 
    voiceName: 'Aoede', // Works well with Kannada
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿನೆಕ್ಸಾ ಕೃಷಿ ಸಹಾಯಕ. ನಾನು ಹವಾಮಾನ, ಬೆಳೆ ಶಿಫಾರಸುಗಳು, ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಇನ್ನೂ ಹೆಚ್ಚಿನ ವಿಷಯಗಳಲ್ಲಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    languageCode: 'kn',
  },
} as const;

// Language labels for UI
export const LANGUAGE_LABELS: Record<SupportedLanguage, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  hi: { native: 'हिंदी', english: 'Hindi' },
  kn: { native: 'ಕನ್ನಡ', english: 'Kannada' },
};
