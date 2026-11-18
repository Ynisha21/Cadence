const env = require('../config/env');

/** Calls the Anthropic Messages API from the server only. Returns { text } or { text: null, error }. */
async function generateText(system, prompt, maxTokens = 600) {
  if (!env.ai.apiKey) return { text: null, error: 'AI is not configured' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ai.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ai.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return { text: null, error: res.status === 429 ? 'AI rate limit reached' : `AI provider error (${res.status})` };
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return text ? { text } : { text: null, error: 'Empty AI response' };
  } catch (err) {
    return { text: null, error: err.name === 'AbortError' ? 'AI request timed out' : 'AI request failed' };
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM =
  'You are a concise productivity assistant inside a task app. Use ONLY the data provided. ' +
  'Never invent tasks or numbers; metrics are authoritative and already computed. ' +
  'Give suggestions, not guarantees. Keep answers under 180 words, plain text, short bullets allowed.';

module.exports = { generateText, SYSTEM };
