import type { VercelRequest, VercelResponse } from '@vercel/node';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function isRateLimitAllowed(ip: string): boolean {
  const now = Date.now();
  
  if (requestCounts.size > 1000) {
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
    if (requestCounts.size > 1500) {
      requestCounts.clear();
    }
  }

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;
  record.count += 1;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || '',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://localhost:3000',
  ];

  if (!allowedOrigins.some((entry) => entry && origin.startsWith(entry))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 'unknown';
  if (!isRateLimitAllowed(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  const { messages, stream } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body: messages array required' });
  }

  const apiKey = process.env.OLLAMA_API_KEY;
  const ollamaUrl = process.env.OLLAMA_API_URL;

  if (!apiKey || !ollamaUrl) {
    console.error('Missing env vars: OLLAMA_API_KEY or OLLAMA_API_URL');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'gemma4:31b',
        messages,
        stream: stream ?? false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error(`Ollama API error ${ollamaResponse.status}:`, errorText);
      return res.status(ollamaResponse.status).json({ error: errorText });
    }

    const data = await ollamaResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
