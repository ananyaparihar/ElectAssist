import { LANG_CODES, translateMultiple, translateText as translateTextByCode } from './translate';

const toLangCode = (languageOrCode: string): string => {
  if (!languageOrCode) return 'en';
  if (Object.values(LANG_CODES).includes(languageOrCode)) return languageOrCode;
  return LANG_CODES[languageOrCode] || 'en';
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  return translateTextByCode(text, toLangCode(targetLanguage));
};

export const translateArray = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  return translateMultiple(texts, toLangCode(targetLanguage));
};
