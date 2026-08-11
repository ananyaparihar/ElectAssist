import type { VercelRequest, VercelResponse } from '@vercel/node';

// IMPORTANT: this must be set as GROQ_API_KEY (no VITE_ prefix) in Vercel's
// Environment Variables. It only ever runs on the server, so it never
// ends up in the browser bundle.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const LANG_NAMES: Record<string, string> = {
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
};

interface TranslateRequestBody {
  texts?: string[];
  targetLang?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in the environment');
    return res.status(500).json({ error: 'Server is missing GROQ_API_KEY' });
  }

  const { texts, targetLang } = (req.body ?? {}) as TranslateRequestBody;

  if (!Array.isArray(texts) || texts.length === 0 || !targetLang) {
    return res.status(400).json({ error: 'Request must include a non-empty texts[] array and targetLang' });
  }

  if (targetLang === 'en') {
    return res.status(200).json({ translations: texts });
  }

  const languageName = LANG_NAMES[targetLang] || targetLang;

  const prompt = [
    `Translate each string in the JSON array below into ${languageName}.`,
    `There are exactly ${texts.length} items — return exactly ${texts.length} translated items in the same order.`,
    `Preserve tone and meaning. Do not add commentary, notes, or markdown formatting.`,
    `Respond with ONLY valid JSON in this exact shape: {"translations": ["...", "..."]}`,
    '',
    JSON.stringify(texts),
  ].join('\n');

  try {
    const groqResponse = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', data);
      // Fail soft: same behavior as the original Google-based service —
      // the UI just shows English rather than breaking.
      return res.status(200).json({ translations: texts });
    }

    const raw: string | undefined = data?.choices?.[0]?.message?.content;
    let parsed: { translations?: unknown } = {};

    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', raw, parseError);
      return res.status(200).json({ translations: texts });
    }

    const translations = parsed.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) {
      console.error('Groq returned unexpected shape:', parsed);
      return res.status(200).json({ translations: texts });
    }

    return res.status(200).json({ translations });
  } catch (error) {
    console.error('Translation request failed:', error);
    return res.status(200).json({ translations: texts });
  }
}