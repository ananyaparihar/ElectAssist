// Google Cloud Translation API integration
// Project: elated-card-494317-s9

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

const LANGUAGE_MAP: Record<string, string> = {
  'English': 'en',
  'Hindi': 'hi',
  'Spanish': 'es',
  'French': 'fr',
};

// Simple cache to avoid redundant API calls
const translationCache: Record<string, string> = {};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const targetCode = LANGUAGE_MAP[targetLanguage] || 'en';
  
  if (targetCode === 'en') return text;

  const cacheKey = `${text}_${targetCode}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const response = await fetch(`${API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetCode,
        format: 'text',
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Translation API Error:', data.error);
      return text;
    }

    const translatedText = data.data.translations[0].translatedText;
    translationCache[cacheKey] = translatedText;
    return translatedText;
  } catch (error) {
    console.error('Translation Error:', error);
    return text;
  }
};

/**
 * Translates an array of strings
 */
export const translateArray = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  const targetCode = LANGUAGE_MAP[targetLanguage] || 'en';
  if (targetCode === 'en') return texts;

  // For simplicity and to avoid too many requests, we could batch them, 
  // but Google API supports multiple 'q' parameters.
  try {
    const response = await fetch(`${API_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetCode,
        format: 'text',
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('Batch Translation API Error:', data.error);
      return texts;
    }

    return data.data.translations.map((t: { translatedText: string }) => t.translatedText);
  } catch (error) {
    console.error('Batch Translation Error:', error);
    return texts;
  }
};
