// Latest posts from Razib's blog, for the "Beyond the Code" section.
// Set BLOG_FEED_URL (an RSS or Atom feed, e.g. https://example.blog/feed) in Vercel's environment variables;
// new posts then appear on the portfolio by themselves. Without it this replies { configured: false }.
const MAX_POSTS = 6;
const CACHE_MS = 30 * 60 * 1000;
let cache = null;

// Undo XML escaping and strip tags/CDATA so titles and excerpts are plain text.
function clean(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    // feeds often escape their HTML (&lt;p&gt;), so decode first, then strip the tags
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function safeLink(value) {
  try {
    const u = new URL(clean(value));
    return /^https?:$/.test(u.protocol) ? u.href : '';
  } catch (e) {
    return '';
  }
}

// Reads both RSS (<item>) and Atom (<entry>) feeds.
function parseFeed(xml) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, MAX_POSTS).map(block => {
    const atomLink = block.match(/<link[^>]*href="([^"]+)"/i);
    const excerpt = clean(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content'));
    return {
      title: clean(tag(block, 'title')).slice(0, 160),
      url: safeLink(tag(block, 'link') || (atomLink && atomLink[1])),
      date: clean(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated')),
      excerpt: excerpt.length > 180 ? excerpt.slice(0, 177).replace(/\s+\S*$/, '') + '…' : excerpt
    };
  }).filter(post => post.title && post.url);
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  const feedUrl = safeLink(process.env.BLOG_FEED_URL || '');
  if (!feedUrl) return res.status(200).json({ configured: false, posts: [] });
  if (cache && cache.url === feedUrl && Date.now() - cache.at < CACHE_MS) return res.status(200).json(cache.body);
  try {
    const response = await fetch(feedUrl, { headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Feed returned ' + response.status);
    const body = { configured: true, posts: parseFeed((await response.text()).slice(0, 2_000_000)) };
    cache = { url: feedUrl, at: Date.now(), body };
    return res.status(200).json(body);
  } catch (error) {
    // keep showing the last good copy if the blog is briefly down
    if (cache && cache.url === feedUrl) return res.status(200).json(cache.body);
    return res.status(200).json({ configured: true, posts: [], error: 'Feed unavailable' });
  }
}

module.exports = handler;
module.exports.parseFeed = parseFeed;
