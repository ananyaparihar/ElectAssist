export const LANG_CODES: Record<string, string> = {
  English: 'en',
  Hindi: 'hi',
  Spanish: 'es',
  French: 'fr',
};

// Calls our own Vercel serverless function (/api/translate.ts), which holds
// the Groq API key server-side. Never call Groq directly from the browser —
// Groq keys have no domain/referrer restriction option, so an exposed key
// is a fully open key.
const TRANSLATE_ENDPOINT = '/api/translate';

interface TranslateApiResponse {
  translations?: string[];
  error?: string;
}

async function callTranslateApi(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length || targetLang === 'en') return texts;

  try {
    const response = await fetch(TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang }),
    });

    const data = (await response.json()) as TranslateApiResponse;
    if (!response.ok || data.error) {
      console.error('Translation failed:', data.error || response.statusText);
      return texts;
    }

    return data.translations && data.translations.length === texts.length ? data.translations : texts;
  } catch (error) {
    console.error('Translation failed:', error);
    return texts;
  }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text) return text;
  const [translated] = await callTranslateApi([text], targetLang);
  return translated;
}

export async function translateMultiple(texts: string[], targetLang: string): Promise<string[]> {
  return callTranslateApi(texts, targetLang);
}