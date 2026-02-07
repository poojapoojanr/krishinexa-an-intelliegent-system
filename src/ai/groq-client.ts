/**
 * Groq Client for Free AI Model Access
 * 
 * Groq offers free API access with much higher rate limits than Gemini free tier:
 * - 30+ requests per minute (vs 15-20 for Gemini)
 * - Fast inference using their LPU technology
 * - Access to Llama 3.3 70B, Mixtral, and other models
 * 
 * Get your free API key at: https://console.groq.com/
 */

import Groq from 'groq-sdk';

// Initialize Groq client
let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com/');
    }
    
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// Available Groq models (all free!)
export const GROQ_MODELS = {
  // Best for complex reasoning and tool use
  LLAMA_70B: 'llama-3.3-70b-versatile',
  // Fastest, good for simple tasks
  LLAMA_8B: 'llama-3.1-8b-instant',
  // Good balance of speed and quality
  MIXTRAL: 'mixtral-8x7b-32768',
  // Smaller but capable
  GEMMA_7B: 'gemma2-9b-it',
} as const;

export type GroqModel = typeof GROQ_MODELS[keyof typeof GROQ_MODELS];

// Default model - Llama 3.3 70B is excellent and free
export const DEFAULT_GROQ_MODEL = GROQ_MODELS.LLAMA_70B;

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model?: GroqModel;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Simple chat completion with Groq
 */
export async function groqChat(
  messages: GroqMessage[],
  options: GroqChatOptions = {}
): Promise<string> {
  const client = getGroqClient();
  
  const {
    model = DEFAULT_GROQ_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt,
  } = options;
  
  const fullMessages: GroqMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: fullMessages,
      temperature,
      max_tokens: maxTokens,
    });
    
    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw error;
  }
}

/**
 * Streaming chat completion with Groq
 */
export async function* groqChatStream(
  messages: GroqMessage[],
  options: GroqChatOptions = {}
): AsyncGenerator<string> {
  const client = getGroqClient();
  
  const {
    model = DEFAULT_GROQ_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt,
  } = options;
  
  const fullMessages: GroqMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  
  const stream = await client.chat.completions.create({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Check if Groq is available (API key is set)
 */
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}
