const gemini = require('./gemini-provider');

const TOKEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/auth_tokens';

function reply(res, status, body) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function rateLimited(req) {
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const store = globalThis.__razibLiveTokenLimit || (globalThis.__razibLiveTokenLimit = new Map());
  const entry = store.get(ip);
  if (!entry || now - entry.start >= 10 * 60 * 1000) {
    store.set(ip, { start: now, count: 1 });
    if (store.size > 2000) {
      for (const [key, value] of store) if (now - value.start >= 10 * 60 * 1000) store.delete(key);
      if (store.size > 2000) store.delete(store.keys().next().value);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > 12;
}

module.exports = async function liveToken(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'method_not_allowed' });
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return reply(res, 403, { error: 'origin_not_allowed' });
    } catch { return reply(res, 403, { error: 'origin_not_allowed' }); }
  }
  if (rateLimited(req)) return reply(res, 429, { error: 'rate_limited' });
  if (!gemini.status().configured) return reply(res, 503, { error: 'assistant_not_configured' });

  const now = Date.now();
  try {
    const result = await gemini.request({
      uses: 1,
      expireTime: new Date(now + 5 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: 'models/gemini-3.5-transcribe-live',
        config: {
          responseModalities: ['TEXT'],
          inputAudioTranscription: { languageCodes: ['en-GB'] }
        }
      }
    }, { kind: 'live', timeoutMs: 7000, deadline: now + 12_000, url: TOKEN_ENDPOINT });
    const token = result.data.name;
    if (typeof token !== 'string' || !token) return reply(res, 502, { error: 'invalid_live_token' });
    return reply(res, 200, {
      token,
      model: 'models/gemini-3.5-transcribe-live',
      expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
      failover: result.keyIndex > 0
    });
  } catch (error) {
    console.error('Gemini Live token request failed', error.code || error.name || 'Error');
    return reply(res, error.code === 'not_configured' ? 503 : 502, { error: error.code || 'live_transcription_unavailable' });
  }
};
