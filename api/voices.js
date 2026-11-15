const gemini = require('./gemini-provider');

const URL = 'https://generativelanguage.googleapis.com/v1beta/voices?language_code=en-GB&region_code=GB&accent=British&type=prebuilt&page_size=100';
let voiceCache = null;
let cacheUntil = 0;

function rateLimited(req) {
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const store = globalThis.__razibVoiceListLimit || (globalThis.__razibVoiceListLimit = new Map());
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
  return entry.count > 30;
}

function reply(res, status, body) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function listField(value) {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string');
  return typeof value === 'string' ? [value] : [];
}

module.exports = async function voices(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return reply(res, 405, { error: 'method_not_allowed' });
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return reply(res, 403, { error: 'origin_not_allowed' });
    } catch { return reply(res, 403, { error: 'origin_not_allowed' }); }
  }
  if (voiceCache && Date.now() < cacheUntil) return reply(res, 200, { voices: voiceCache });
  if (rateLimited(req)) return reply(res, 429, { error: 'rate_limited' });
  if (!gemini.status().configured) return reply(res, 503, { error: 'assistant_not_configured' });

  try {
    const result = await gemini.request(null, {
      kind: 'speech',
      method: 'GET',
      url: URL,
      timeoutMs: 6000,
      deadline: Date.now() + 12_000
    });
    const voices = (Array.isArray(result.data.voices) ? result.data.voices : []).map(voice => {
      const id = typeof voice.id === 'string' ? voice.id : '';
      const displayName = typeof (voice.display_name || voice.displayName) === 'string' ? (voice.display_name || voice.displayName) : id;
      const accent = listField(voice.accent).join(', ');
      const region = listField(voice.region_code || voice.regionCode);
      const language = listField(voice.language_code || voice.languageCode);
      const description = typeof voice.description === 'string' ? voice.description : '';
      return { id, displayName, accent, region, language, description };
    }).filter(voice => {
      const safeId = /^[A-Za-z][A-Za-z0-9_-]{0,100}$/.test(voice.id);
      const british = /british/i.test(voice.accent) || voice.region.some(code => code.toUpperCase() === 'GB');
      const englishUk = voice.language.some(code => code.toLowerCase() === 'en-gb');
      return safeId && british && englishUk;
    }).slice(0, 100);
    voiceCache = voices;
    cacheUntil = Date.now() + 10 * 60 * 1000;
    return reply(res, 200, { voices });
  } catch (error) {
    console.error('Gemini British voice list failed', error.code || error.name || 'Error');
    return reply(res, 502, { error: 'voice_catalogue_unavailable' });
  }
};
