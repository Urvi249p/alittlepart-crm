// Gemini free-tier usage is subject to Google's rate limits and may use inputs to improve models; avoid sensitive client data unless using a paid/Vertex tier.

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

async function requestGemini(prompt, options = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  } = options;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
      }),
    });
  } catch (error) {
    throw new Error(`Gemini API network error: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }

  let responseBody;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const message = responseBody?.error?.message || response.statusText || 'Unknown API error';
    throw new Error(`Gemini API request failed (${response.status}): ${message}`);
  }

  const text = responseBody?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini API response did not contain generated text.');
  }

  return text;
}

export async function callGemini(prompt, options = {}) {
  return requestGemini(prompt, options);
}

export async function callGeminiJSON(prompt, options = {}) {
  const jsonPrompt = `${prompt}\n\nRespond with ONLY valid JSON. Do not use markdown code fences or any additional text.`;
  const text = await requestGemini(jsonPrompt, options);
  const unfencedText = text.trim().replace(/^```json\\s*|^```\\s*|\\s*```$/gi, '').trim();

  try {
    return JSON.parse(unfencedText);
  } catch {
    throw new Error(`Gemini API returned invalid JSON. Raw response: ${text}`);
  }
}
