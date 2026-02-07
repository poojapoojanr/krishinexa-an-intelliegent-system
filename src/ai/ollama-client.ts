/**
 * Ollama Client for Self-Hosted LLM
 * 
 * Run unlimited, free AI locally with no rate limits!
 * 
 * SETUP:
 * 1. Install Ollama: https://ollama.ai/download
 * 2. Run: ollama pull llama3.2  (or mistral, gemma2, etc.)
 * 3. Ollama runs automatically on http://localhost:11434
 * 
 * Recommended models for this project:
 * - llama3.2:3b - Fast, good for simple queries (2GB RAM)
 * - llama3.2:7b - Better quality (4GB RAM)
 * - mistral:7b - Good multilingual support (4GB RAM)
 * - gemma2:9b - Good for Indian languages (6GB RAM)
 */

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// Default Ollama endpoint
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Recommended models
export const OLLAMA_MODELS = {
  LLAMA_3B: 'llama3.2:3b',      // Fast, lightweight
  LLAMA_7B: 'llama3.2',         // Good balance
  MISTRAL: 'mistral',           // Good multilingual
  GEMMA: 'gemma2:9b',           // Good for Indian languages
  QWEN: 'qwen2.5:7b',           // Excellent multilingual
} as const;

export type OllamaModel = string;

// Default model - can be changed based on hardware
export const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || OLLAMA_MODELS.LLAMA_7B;

/**
 * Check if Ollama is running
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available models in Ollama
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch {
    return [];
  }
}

/**
 * Chat with Ollama - main function
 */
export async function ollamaChat(
  messages: OllamaMessage[],
  options: OllamaChatOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_OLLAMA_MODEL,
    temperature = 0.7,
    systemPrompt,
  } = options;
  
  const fullMessages: OllamaMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        stream: false,
        options: {
          temperature,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }
    
    const data: OllamaResponse = await response.json();
    return data.message?.content || '';
  } catch (error: any) {
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('Ollama is not running. Start it with: ollama serve');
    }
    throw error;
  }
}

/**
 * Streaming chat with Ollama
 */
export async function* ollamaChatStream(
  messages: OllamaMessage[],
  options: OllamaChatOptions = {}
): AsyncGenerator<string> {
  const {
    model = DEFAULT_OLLAMA_MODEL,
    temperature = 0.7,
    systemPrompt,
  } = options;
  
  const fullMessages: OllamaMessage[] = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: fullMessages,
      stream: true,
      options: {
        temperature,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }
  
  const reader = response.body?.getReader();
  if (!reader) return;
  
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);
    
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          yield json.message.content;
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }
}

/**
 * Generate embeddings with Ollama (for RAG)
 */
export async function ollamaEmbed(text: string, model = 'nomic-embed-text'): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: text,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama embeddings error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.embedding;
}
