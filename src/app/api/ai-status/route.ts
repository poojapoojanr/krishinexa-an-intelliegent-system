'use server';

import { NextResponse } from 'next/server';
import { getProviderStatus } from '@/ai/unified-ai';

export async function GET() {
  try {
    const status = await getProviderStatus();
    
    return NextResponse.json({
      success: true,
      providers: {
        ollama: {
          available: status.ollama,
          description: 'Self-hosted, unlimited, FREE',
          setup: status.ollama ? 'Running' : 'Install from https://ollama.ai, then run: ollama pull llama3.2:3b',
        },
        groq: {
          available: status.groq,
          description: 'Cloud, high limits, FREE',
          setup: status.groq ? 'Configured' : 'Get API key from https://console.groq.com and add GROQ_API_KEY to .env',
        },
        gemini: {
          available: status.gemini,
          description: 'Cloud, strict limits (20 RPM)',
          setup: 'Configured via GOOGLE_GENAI_API_KEY',
        },
      },
      recommended: status.recommended,
      message: getStatusMessage(status),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

function getStatusMessage(status: { ollama: boolean; groq: boolean; gemini: boolean; recommended: string }): string {
  if (status.ollama) {
    return '🟢 EXCELLENT: Using Ollama (self-hosted, unlimited) - No rate limits!';
  }
  if (status.groq) {
    return '🟡 GOOD: Using Groq (cloud, ~30 RPM) - Consider setting up Ollama for unlimited usage';
  }
  return '🔴 LIMITED: Using Gemini only (20 RPM) - Set up Ollama or Groq for better limits';
}
