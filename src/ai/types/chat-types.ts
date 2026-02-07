/**
 * Shared Types for Agentic Voice Chatbot
 * These types are used by both server actions and client components
 */

export type SupportedLanguage = 'en' | 'hi' | 'kn';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: {
    tool: string;
    args: Record<string, any>;
    result?: any;
  }[];
  timestamp?: string;
}

export interface AgentChatInput {
  audioDataUri?: string;
  textInput?: string;
  language: SupportedLanguage;
  history: AgentMessage[];
  userContext?: {
    location?: string;
    district?: string;
    state?: string;
    crops?: string[];
  };
}

export interface AgentChatOutput {
  history: AgentMessage[];
  responseAudioUri?: string;
  detectedLanguage?: SupportedLanguage;
  toolsUsed?: string[];
}

// Gemini TTS available voices: Aoede, Charon, Fenrir, Kore, Puck, Zephyr
export const LANGUAGE_CONFIG = {
  en: {
    name: 'English',
    voiceName: 'Kore',
    greeting: 'Hello! I am your KrishiNexa farming assistant. I can help you with weather updates, crop recommendations, market prices, government schemes, and more. How can I help you today?',
    languageCode: 'en',
  },
  hi: {
    name: 'Hindi',
    voiceName: 'Aoede',
    greeting: 'नमस्ते! मैं आपका कृषिनेक्सा खेती सहायक हूं। मैं आपको मौसम, फसल सिफारिशें, मंडी भाव, सरकारी योजनाएं और भी बहुत कुछ में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
    languageCode: 'hi',
  },
  kn: {
    name: 'Kannada', 
    voiceName: 'Aoede',
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
