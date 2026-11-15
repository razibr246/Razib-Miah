const test = require('node:test');
const assert = require('node:assert/strict');

function response(status, payload = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(payload); },
    async json() { return payload; }
  };
}

test('Gemini rotates exhausted keys, recovers the preferred key, and reports only observed health', async () => {
  const oldKeys = process.env.GEMINI_API_KEYS;
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = global.fetch;
  const oldNow = Date.now;
  process.env.GEMINI_API_KEYS = 'test-key-one,test-key-two';
  delete process.env.GEMINI_API_KEY;
  let now = 1_000_000;
  Date.now = () => now;
  const calls = [];
  global.fetch = async (_url, options) => {
    calls.push(options.headers['x-goog-api-key']);
    return calls.length === 1 ? response(429, { error: { status: 'RESOURCE_EXHAUSTED' } }) : response(200, {
      steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Hello from Gemini.' }] }]
    });
  };

  try {
    const provider = require('./gemini-provider');
    const payload = { model: 'test-model', input: 'Hello', store: false };
    const rotated = await provider.request(payload, { deadline: now + 3000 });
    assert.equal(rotated.keyIndex, 1);
    assert.deepEqual(calls, ['test-key-one', 'test-key-two']);
    assert.equal(provider.status().text.successes, 1);

    now += 45_001;
    calls.length = 0;
    global.fetch = async (_url, options) => {
      calls.push(options.headers['x-goog-api-key']);
      return calls.length === 1 ? response(503, { error: { status: 'UNAVAILABLE' } }) : response(200, {
        steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Recovered after outage.' }] }]
      });
    };
    const outage = await provider.request(payload, { deadline: now + 3000 });
    assert.equal(outage.keyIndex, 1);
    assert.deepEqual(calls, ['test-key-one', 'test-key-two']);

    now += 45_001;
    calls.length = 0;
    global.fetch = async (_url, options) => {
      calls.push(options.headers['x-goog-api-key']);
      return response(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: 'Primary recovered.' }] }] });
    };
    const recovered = await provider.request(payload, { deadline: now + 3000 });
    assert.equal(recovered.keyIndex, 0);
    assert.deepEqual(calls, ['test-key-one']);
    assert.equal(provider.status().text.successes, 3);
    assert.equal(provider.status().configured, true);
    assert.equal(JSON.stringify(provider.status()).includes('test-key-one'), false);
  } finally {
    Date.now = oldNow;
    global.fetch = oldFetch;
    if (oldKeys === undefined) delete process.env.GEMINI_API_KEYS; else process.env.GEMINI_API_KEYS = oldKeys;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  }
});

test('narration endpoint uses the selected voice profile and returns audio without rewriting the script', async () => {
  const oldKeys = process.env.GEMINI_API_KEYS;
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  delete process.env.GEMINI_API_KEYS;
  let posted;
  global.fetch = async (_url, options) => {
    posted = JSON.parse(options.body);
    return response(200, { steps: [{ type: 'model_output', content: [{ type: 'audio', data: 'dGVzdA==', mime_type: 'audio/wav' }] }] });
  };
  try {
    const assistant = require('./assistant');
    const script = 'Good evening, and welcome to the programme. '.repeat(12);
    let body;
    const res = {
      status(code) { this.code = code; return this; },
      setHeader() { return this; },
      json(value) { body = value; return value; }
    };
    await assistant({ method: 'POST', headers: { host: 'localhost' }, socket: {}, body: { mode: 'narrate', question: script, profile: 'podcast', voice: 'Sulafat', speed: 0.95 } }, res);
    assert.equal(res.code, 200);
    assert.equal(body.answer, script);
    assert.equal(body.audio.data, 'dGVzdA==');
    assert.equal(posted.model, 'gemini-3.8-flash-tts');
    assert.equal(posted.generation_config.speech_config[0].voice, 'Sulafat');
    assert.equal(posted.generation_config.speech_config[0].language, 'en-GB');
    assert.match(posted.input[0].content[0].annotations[0].style, /podcast/i);
    assert.equal(posted.store, false);
  } finally {
    global.fetch = oldFetch;
    if (oldKeys === undefined) delete process.env.GEMINI_API_KEYS; else process.env.GEMINI_API_KEYS = oldKeys;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  }
});

test('portfolio answers return before an optional voice request and preserve recent context', async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'test-key';
  let posted;
  let calls = 0;
  global.fetch = async (_url, options) => {
    calls += 1;
    posted = JSON.parse(options.body);
    return response(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: 'FieldShift 360 uses NASA Earth observations.' }] }] });
  };
  try {
    const assistant = require('./assistant');
    let body;
    const res = {
      status(code) { this.code = code; return this; },
      setHeader() { return this; },
      json(value) { body = value; return value; }
    };
    await assistant({
      method: 'POST',
      headers: { host: 'localhost', 'x-forwarded-for': 'test-portfolio-chat' },
      socket: {},
      body: {
        question: 'Tell me more about it',
        speak: true,
        history: [{ role: 'user', text: 'What is FieldShift 360?' }]
      }
    }, res);
    assert.equal(res.code, 200);
    assert.equal(body.answer, 'FieldShift 360 uses NASA Earth observations.');
    assert.equal(body.audio, undefined);
    assert.equal(calls, 1);
    assert.match(posted.input, /What is FieldShift 360\?/);
    assert.match(posted.input, /Tell me more about it/);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  }
});

test('Live transcription receives a single-use scoped token without returning a Gemini API key', async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = global.fetch;
  process.env.GEMINI_API_KEY = 'server-only-test-key';
  let posted;
  global.fetch = async (_url, options) => {
    posted = JSON.parse(options.body);
    assert.equal(options.headers['x-goog-api-key'], 'server-only-test-key');
    return response(200, { name: 'short-lived-test-token' });
  };
  try {
    const liveToken = require('./live-token');
    let body;
    const res = {
      status(code) { this.code = code; return this; },
      setHeader() { return this; },
      json(value) { body = value; return value; }
    };
    await liveToken({ method: 'POST', headers: { host: 'localhost', 'x-forwarded-for': 'test-live-token' }, socket: {} }, res);
    assert.equal(res.code, 200);
    assert.equal(body.token, 'short-lived-test-token');
    assert.equal(body.model, 'models/gemini-3.5-transcribe-live');
    assert.equal(posted.uses, 1);
    assert.equal(posted.liveConnectConstraints.config.responseModalities[0], 'TEXT');
    assert.equal(posted.liveConnectConstraints.config.inputAudioTranscription.languageCodes[0], 'en-GB');
    assert.equal(JSON.stringify(body).includes('server-only-test-key'), false);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  }
});
