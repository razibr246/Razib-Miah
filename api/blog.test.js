const test = require('node:test');
const assert = require('node:assert/strict');
const blog = require('./blog');

function fakeRes() {
  return {
    headers: {}, code: 0, body: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; }
  };
}

test('reads RSS items into plain-text posts and drops unsafe links', () => {
  const xml = `<rss><channel>
    <item><title><![CDATA[A rainy <b>evening</b> in Dhaka]]></title><link>https://blog.example/rain</link>
      <pubDate>Sat, 21 Nov 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;Rain &amp; tea.&lt;/p&gt;</description></item>
    <item><title>Bad link</title><link>javascript:alert(1)</link></item>
  </channel></rss>`;
  const posts = blog.parseFeed(xml);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, 'A rainy evening in Dhaka');
  assert.equal(posts[0].url, 'https://blog.example/rain');
  assert.equal(posts[0].excerpt, 'Rain & tea.');
});

test('reads Atom entries', () => {
  const xml = `<feed><entry><title>Poem one</title><link href="https://blog.example/p1"/><published>2026-11-01</published><summary>Lines.</summary></entry></feed>`;
  assert.deepEqual(blog.parseFeed(xml), [{ title: 'Poem one', url: 'https://blog.example/p1', date: '2026-11-01', excerpt: 'Lines.' }]);
});

test('without BLOG_FEED_URL it reports that no blog is connected', async () => {
  const old = process.env.BLOG_FEED_URL;
  delete process.env.BLOG_FEED_URL;
  try {
    const res = fakeRes();
    await blog({ method: 'GET', headers: {} }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { configured: false, posts: [] });
  } finally {
    if (old !== undefined) process.env.BLOG_FEED_URL = old;
  }
});
