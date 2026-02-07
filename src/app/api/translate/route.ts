import { NextRequest, NextResponse } from 'next/server';

// Simple translation using free public API fallback
// In production, use Google Cloud Translation API with credentials

const languageMap: Record<string, string> = {
  en: 'en',
  hi: 'hi',
  kn: 'kn',
};

// Lightweight translation cache
const cache = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing text or targetLanguage' }, { status: 400 });
    }

    // Return as-is if target is English
    if (targetLanguage === 'en') {
      return NextResponse.json({ translatedText: text });
    }

    const cacheKey = `${text}:${targetLanguage}`;
    
    // Check cache
    if (cache.has(cacheKey)) {
      return NextResponse.json({ translatedText: cache.get(cacheKey) });
    }

    // Use Google Translate via MyMemory API (free, no auth required)
    const encodedText = encodeURIComponent(text);
    const translationUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${languageMap[targetLanguage] || targetLanguage}`;

    const response = await fetch(translationUrl);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translatedText = data.responseData.translatedText;
      cache.set(cacheKey, translatedText);
      return NextResponse.json({ translatedText });
    }

    // Fallback: return original text if translation fails
    return NextResponse.json({ translatedText: text });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
