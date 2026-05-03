const TRANSLATE_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

export const LANG_CODES: Record<string, string> = {
  English: 'en',
  Hindi: 'hi',
  Spanish: 'es',
  French: 'fr',
};

interface TranslateApiResponse {
  data?: {
    translations?: Array<{ translatedText: string }>;
  };
  error?: {
    message?: string;
  };
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;
  if (!TRANSLATE_KEY) return text;

  try {
    const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${TRANSLATE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text',
      }),
    });

    const data = (await response.json()) as TranslateApiResponse;
    if (!response.ok || data.error) {
      console.error('Translation failed:', data.error?.message || response.statusText);
      return text;
    }

    return data.data?.translations?.[0]?.translatedText || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

export async function translateMultiple(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length || targetLang === 'en') return texts;
  if (!TRANSLATE_KEY) return texts;

  try {
    const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${TRANSLATE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        target: targetLang,
        format: 'text',
      }),
    });

    const data = (await response.json()) as TranslateApiResponse;
    if (!response.ok || data.error) {
      console.error('Translation failed:', data.error?.message || response.statusText);
      return texts;
    }

    const translated = data.data?.translations?.map((t) => t.translatedText) || [];
    return translated.length === texts.length ? translated : texts;
  } catch (error) {
    console.error('Translation failed:', error);
    return texts;
  }
}
