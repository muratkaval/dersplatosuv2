/**
 * sitemap-api.js
 * Admin panelden "Sitemap Güncelle" butonunu destekleyen küçük HTTP sunucusu.
 *
 * Kurulum (sunucuda, tek sefer):
 *   pm2 start sitemap-api.js --name sitemap-api
 *
 * Nginx'e eklenecek blok (server {} içine):
 *   location /sitemap-api/ {
 *       proxy_pass http://127.0.0.1:3739/;
 *       proxy_set_header Host $host;
 *   }
 *
 * Endpoint:
 *   GET /generate  →  { success: true, urlCount: 42, details: { staticUrls, instructorUrls, campUrls, totalUrls }, message: "..." }
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Ayarlar ─────────────────────────────────────────────────────────────────
const PORT        = process.env.SITEMAP_API_PORT || 3739;
const SITE_BASE   = (process.env.SITEMAP_SITE_BASE || 'https://dersplatosu.com').replace(/\/$/, '');
const STRAPI_BASE = process.env.STRAPI_URL || 'http://localhost:1337/api';
const MEDIA_BASE  = (process.env.STRAPI_MEDIA_BASE || SITE_BASE).replace(/\/$/, '');
const TOKEN       = process.env.STRAPI_TOKEN || '';
const SITEMAP_API_KEY = process.env.SITEMAP_API_KEY || '';
const ALLOWED_ORIGIN = process.env.SITEMAP_ALLOWED_ORIGIN || SITE_BASE;
const OUT_FILE    = path.join(__dirname, 'sitemap.xml');
// ────────────────────────────────────────────────────────────────────────────

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib  = url.startsWith('https') ? https : http;
    const opts = { headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {} };
    lib.get(url, opts, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('JSON parse hatası: ' + url)); }
      });
    }).on('error', reject);
  });
}

function toAbsoluteMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetchAll(endpoint, fields) {
  const q     = fields.join('&') + '&pagination[pageSize]=100&pagination[page]=';
  const items = [];
  let page    = 1;
  while (true) {
    const data = await fetchJson(`${STRAPI_BASE}/${endpoint}?${q}${page}`);
    const rows = data.data || [];
    items.push(...rows);
    if (rows.length < 100) break;
    page++;
  }
  return items;
}

function urlEntry(loc, priority = '0.7', changefreq = 'weekly', image = null) {
  const today  = new Date().toISOString().slice(0, 10);
  const imgTag = image
    ? `\n    <image:image>\n      <image:loc>${image.loc}</image:loc>\n      <image:title>${image.title}</image:title>\n    </image:image>`
    : '';
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${imgTag}\n  </url>`;
}

async function generate() {
  const urls = [];
  const seen = new Set();
  const stats = {
    staticUrls: 0,
    instructorUrls: 0,
    campUrls: 0,
    totalUrls: 0,
  };

  function pushUnique(entryUrl, priority, changefreq, image, bucket) {
    if (!entryUrl || seen.has(entryUrl)) return;
    seen.add(entryUrl);
    urls.push(urlEntry(entryUrl, priority, changefreq, image));
    stats.totalUrls += 1;
    if (bucket && Object.prototype.hasOwnProperty.call(stats, bucket)) {
      stats[bucket] += 1;
    }
  }

  // Statik sayfalar
  pushUnique(`${SITE_BASE}/`,                     '1.0', 'daily',
    { loc: 'https://i.hizliresim.com/ag3gf4d.png', title: 'Ders Platosu' }, 'staticUrls');
  pushUnique(`${SITE_BASE}/egitim`,               '0.9', 'weekly', null, 'staticUrls');
  pushUnique(`${SITE_BASE}/youtuber-hocalar`,     '0.8', 'weekly', null, 'staticUrls');
  pushUnique(`${SITE_BASE}/kitaplar`,             '0.8', 'weekly', null, 'staticUrls');
  pushUnique(`${SITE_BASE}/kitap-listesi`,        '0.7', 'weekly', null, 'staticUrls');
  pushUnique(`${SITE_BASE}/video-soru-cozumleri`, '0.7', 'weekly', null, 'staticUrls');
  pushUnique(`${SITE_BASE}/soru-cozumleri`,       '0.7', 'weekly', null, 'staticUrls');

  // Hocalar
  try {
    const instructors = await fetchAll('instructors', [
      'fields[0]=name',
      'populate[photo][fields][0]=url',
    ]);
    for (const inst of instructors) {
      const a    = inst.attributes || inst;
      const slug = a.slug || slugify(a.name || '');
      if (!slug) continue;
      const photo    = a.photo?.data?.attributes || a.photo;
      const photoUrl = toAbsoluteMediaUrl(photo?.url || '');
      pushUnique(
        `${SITE_BASE}/hoca/${slug}`,
        '0.8', 'weekly',
        photoUrl ? { loc: photoUrl, title: (a.name || slug) + ' – Ders Platosu' } : null,
        'instructorUrls'
      );
    }
  } catch (e) { /* hoca hatası — devam et */ }

  // Kamplar
  try {
    const camps = await fetchAll('camps', [
      'fields[0]=title',
      'fields[1]=slug',
      'fields[2]=introVideo',
    ]);
    for (const camp of camps) {
      const a    = camp.attributes || camp;
      const slug = a.slug || slugify(a.title || '');
      if (!slug) continue;
      const vid      = (a.introVideo || '').match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/)?.[1];
      const thumbUrl = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
      pushUnique(
        `${SITE_BASE}/egitim/${slug}`,
        '0.9', 'weekly',
        thumbUrl ? { loc: thumbUrl, title: (a.title || slug) + ' – Ders Platosu' } : null,
        'campUrls'
      );
    }
  } catch (e) { /* kamp hatası — devam et */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(OUT_FILE, xml, 'utf8');
  return {
    urlCount: urls.length,
    details: stats,
  };
}

// ── HTTP Sunucusu ─────────────────────────────────────────────────────────
const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = ipHits.get(ip) || [];
  const fresh = bucket.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  fresh.push(now);
  ipHits.set(ip, fresh);
  return fresh.length > RATE_LIMIT_MAX;
}

function isAuthorized(req) {
  if (!SITEMAP_API_KEY) return true;
  const supplied = req.headers['x-api-key'];
  return typeof supplied === 'string' && supplied === SITEMAP_API_KEY;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, content-type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/generate' && req.method === 'GET') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
      return;
    }

    if (isRateLimited(req)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Too many requests' }));
      return;
    }

    const ts = new Date().toISOString();
    console.log(`[${ts}] Sitemap üretiliyor...`);
    generate()
      .then(result => {
        console.log(`[${ts}] Bitti — ${result.urlCount} URL yazıldı.`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          urlCount: result.urlCount,
          details: result.details,
          message: `${result.urlCount} URL sitemap'e yazıldı.`,
        }));
      })
      .catch(err => {
        console.error(`[${ts}] Hata:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Sitemap API → http://127.0.0.1:${PORT}/generate`);
});
