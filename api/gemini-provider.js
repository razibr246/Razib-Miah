const endpoint = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const circuits = new Map();
const observations = { text: blankStats(), speech: blankStats(), live: blankStats() };
const COOLDOWN_MS = 45_000;

function blankStats() {
  return { requests: 0, successes: 0, failures: 0, failovers: 0, lastLatencyMs: null, lastError: null, lastSuccessAt: null, lastFailoverAt: null };
}

function keys() {
  const list = [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY]
    .filter(Boolean).flatMap(value => value.split(/[\n,;]+/).map(key => key.trim()).filter(Boolean));
  return [...new Set(list)];
}

function isRetryable(status, message = '') {
  if ([401, 408, 429].includes(status) || status >= 500) return true;
  return status === 403 && /quota|rate.?limit|resource.?exhausted|billing/i.test(message);
}

function status() {
  const configured = keys().length;
  const nextProbe = [...circuits.values()].map(item => item.until).filter(Boolean).sort((a, b) => a - b)[0] || null;
  return {
    provider: 'Gemini',
    configured: configured > 0,
    keyCount: configured,
    text: { ...observations.text },
    speech: { ...observations.speech },
    live: { ...observations.live },
    nextProbeAt: nextProbe ? new Date(nextProbe).toISOString() : null
  };
}

async function request(payload, { kind = 'text', timeoutMs = 9000, deadline = Date.now() + 24_000, url = endpoint, method = 'POST' } = {}) {
  const available = keys();
  if (!available.length) {
    const error = new Error('not_configured');
    error.code = 'not_configured';
    throw error;
  }
  const stats = observations[kind] || observations.text;
  const now = Date.now();
  const ordered = available.map((key, index) => ({ key, index })).filter(({ index }) => (circuits.get(index)?.until || 0) <= now);
  const candidates = ordered.length ? ordered : available.map((key, index) => ({ key, index })).sort((a, b) => (circuits.get(a.index)?.until || 0) - (circuits.get(b.index)?.until || 0)).slice(0, 1);
  let lastError;
  let attempted = 0;
  const backoff = async () => {
    if (attempted >= candidates.length) return;
    const waitMs = Math.min(150 * (2 ** Math.max(0, attempted - 1)), 1200, Math.max(0, deadline - Date.now() - 50));
    if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
  };

  for (const { key, index } of candidates) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    if (attempted > 0 || index > 0) {
      stats.failovers += 1;
      stats.lastFailoverAt = new Date().toISOString();
    }
    attempted += 1;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, remaining));
    stats.requests += 1;
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: controller.signal,
        ...(method === 'GET' ? {} : { body: JSON.stringify(payload) })
      });
      stats.lastLatencyMs = Date.now() - started;
      if (!response.ok) {
        let detail = '';
        try { detail = (await response.text()).slice(0, 1200); } catch {}
        const failure = new Error('upstream_' + response.status);
        failure.status = response.status;
        if (!isRetryable(response.status, detail)) throw failure;
        circuits.set(index, { until: Date.now() + COOLDOWN_MS });
        lastError = failure;
        await backoff();
        continue;
      }
      const data = await response.json();
      circuits.delete(index);
      stats.successes += 1;
      stats.lastError = null;
      stats.lastSuccessAt = new Date().toISOString();
      return { data, keyIndex: index, latencyMs: stats.lastLatencyMs };
    } catch (error) {
      stats.lastLatencyMs = Date.now() - started;
      if (error.status && !isRetryable(error.status)) {
        stats.failures += 1;
        stats.lastError = `HTTP ${error.status}`;
        stats.lastSuccessAt = null;
        throw error;
      }
      circuits.set(index, { until: Date.now() + COOLDOWN_MS });
      lastError = error;
      await backoff();
    } finally {
      clearTimeout(timer);
    }
  }
  stats.failures += 1;
  stats.lastError = lastError?.status ? `HTTP ${lastError.status}` : lastError?.name === 'AbortError' ? 'timeout' : 'unavailable';
  stats.lastSuccessAt = null;
  const error = new Error(lastError?.message || 'provider_unavailable');
  error.code = lastError?.status ? 'upstream_error' : 'provider_unavailable';
  error.status = lastError?.status;
  throw error;
}

module.exports = { request, status };
