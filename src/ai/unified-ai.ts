/**
 * Unified AI Client - Smart Provider Selection
 * 
 * Tries AI providers in order of preference:
 * 1. Ollama (self-hosted, unlimited, free) - BEST FOR PRODUCTION
 * 2. Groq (cloud, high limits, free) - Good fallback
 * 3. Gemini (cloud, strict limits, free) - Last resort
 * 
 * This ensures your app works regardless of which providers are available.
 */

import { ollamaChat, isOllamaAvailable, type OllamaMessage } from './ollama-client';
import { groqChat, isGroqAvailable, type GroqMessage } from './groq-client';
import { ai } from './genkit';

export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIProvider = 'ollama' | 'groq' | 'gemini';

export interface UnifiedAIOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  preferredProvider?: AIProvider;
}

// Track which provider is currently active
let currentProvider: AIProvider | null = null;
let providerCheckTime = 0;
const PROVIDER_CHECK_INTERVAL = 60000; // Re-check every 60 seconds

/**
 * Detect the best available AI provider
 */
export async function detectBestProvider(): Promise<AIProvider> {
  const now = Date.now();
  
  // Use cached result if recent
  if (currentProvider && (now - providerCheckTime) < PROVIDER_CHECK_INTERVAL) {
    return currentProvider;
  }
  
  // Check Ollama first (best option - self-hosted, unlimited)
  if (await isOllamaAvailable()) {
    currentProvider = 'ollama';
    providerCheckTime = now;
    console.log('🟢 AI Provider: Ollama (self-hosted, unlimited)');
    return 'ollama';
  }
  
  // Check Groq (good option - cloud, high limits)
  if (isGroqAvailable()) {
    currentProvider = 'groq';
    providerCheckTime = now;
    console.log('🟡 AI Provider: Groq (cloud, high limits)');
    return 'groq';
  }
  
  // Fall back to Gemini (last resort - strict limits)
  currentProvider = 'gemini';
  providerCheckTime = now;
  console.log('🔴 AI Provider: Gemini (cloud, strict limits)');
  return 'gemini';
}

/**
 * Unified chat function - automatically uses best available provider
 */
export async function unifiedChat(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<{ text: string; provider: AIProvider }> {
  const strictSystemPrompt =
    'You are an agricultural assistant. Only answer using verified agricultural facts, government data, or information you are certain about. If you do not know the answer, say "I do not know" or suggest consulting a local expert. Do not make up information. Be concise and accurate.';
  const {
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt,
    preferredProvider,
  } = options;
  
  // Determine provider
  let provider = preferredProvider || await detectBestProvider();
  
  // Try the selected provider, fall back if it fails
  const providers: AIProvider[] = preferredProvider 
    ? [preferredProvider, 'ollama', 'groq', 'gemini'].filter((p, i, arr) => arr.indexOf(p) === i) as AIProvider[]
    : [provider, 'groq', 'gemini'];
  
  let lastError: Error | null = null;
  
  for (const p of providers) {
    try {
      let text: string;
      // Always use strict system prompt
      const effectiveSystemPrompt = systemPrompt || strictSystemPrompt;
      switch (p) {
        case 'ollama':
          if (!(await isOllamaAvailable())) continue;
          text = await ollamaChat(messages as OllamaMessage[], {
            temperature,
            systemPrompt: effectiveSystemPrompt,
          });
          return { text, provider: 'ollama' };
        case 'groq':
          if (!isGroqAvailable()) {
            console.log('❌ Groq not available: GROQ_API_KEY not set');
            continue;
          }
          console.log('🟡 Attempting Groq...');
          text = await groqChat(messages as GroqMessage[], {
            temperature,
            maxTokens,
            systemPrompt: effectiveSystemPrompt,
          });
          console.log('✅ Groq succeeded!');
          return { text, provider: 'groq' };
        case 'gemini':
          // Gemini via Genkit
          const fullMessages = effectiveSystemPrompt
            ? [{ role: 'user' as const, content: [{ text: effectiveSystemPrompt }] }, ...messages.map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                content: [{ text: m.content }],
              }))]
            : messages.map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                content: [{ text: m.content }],
              }));
          const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            messages: fullMessages,
            config: { temperature, maxOutputTokens: maxTokens },
          });
          return { text: response.text, provider: 'gemini' };
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ Provider ${p} failed:`, error.message);
      console.warn(`   Error details:`, error);
      // Continue to next provider
    }
  }
  
  throw lastError || new Error('All AI providers failed');
}

/**
 * Get current provider status
 */
export async function getProviderStatus(): Promise<{
  ollama: boolean;
  groq: boolean;
  gemini: boolean;
  recommended: AIProvider;
}> {
  const ollamaAvailable = await isOllamaAvailable();
  const groqAvailable = isGroqAvailable();
  
  return {
    ollama: ollamaAvailable,
    groq: groqAvailable,
    gemini: true, // Always available if API key is set
    recommended: ollamaAvailable ? 'ollama' : groqAvailable ? 'groq' : 'gemini',
  };
}
