/**
 * generate-sitemap.js
 * Strapi'den tüm hocaları, kampları ve kitapları çekip sitemap.xml üretir.
 *
 * Kullanım:
 *   node generate-sitemap.js
 *
 * Cron (sunucuda her gece 03:00'da):
 *   0 3 * * * cd /var/www/dersplatosu && node generate-sitemap.js >> /var/log/sitemap-gen.log 2>&1
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Ayarlar ─────────────────────────────────────────────────────────────────
const SITE_BASE   = (process.env.SITEMAP_SITE_BASE || 'https://dersplatosu.com').replace(/\/$/, '');
const STRAPI_BASE = 'http://localhost:1337/api';
const MEDIA_BASE  = (process.env.STRAPI_MEDIA_BASE || SITE_BASE).replace(/\/$/, '');
const TOKEN       = process.env.STRAPI_TOKEN || '';          // isteğe bağlı
const OUT_FILE    = path.join(__dirname, 'sitemap.xml');
const TODAY       = new Date().toISOString().slice(0, 10);
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
    const lib = url.startsWith('https') ? https : http;
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
  const q = fields.join('&') + '&pagination[pageSize]=100&pagination[page]=';
  const items = [];
  let page = 1;
  while (true) {
    const data = await fetchJson(`${STRAPI_BASE}/${endpoint}?${q}${page}`);
    const rows = data.data || [];
    items.push(...rows);
    if (rows.length < 100) break;
    page++;
  }
  return items;
}

function url(loc, priority = '0.7', changefreq = 'weekly', image = null) {
  const imgTag = image
    ? `\n    <image:image>\n      <image:loc>${image.loc}</image:loc>\n      <image:title>${image.title}</image:title>\n    </image:image>`
    : '';
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${imgTag}\n  </url>`;
}

async function generate() {
  console.log(`[${new Date().toISOString()}] Sitemap üretiliyor...`);

  const urls = [];
  const seen = new Set();

  function pushUnique(entryUrl, priority, changefreq, image) {
    if (!entryUrl || seen.has(entryUrl)) return;
    seen.add(entryUrl);
    urls.push(url(entryUrl, priority, changefreq, image));
  }

  // ── Statik sayfalar ──────────────────────────────────────────────────────
  pushUnique(`${SITE_BASE}/`, '1.0', 'daily',
    { loc: 'https://i.hizliresim.com/ag3gf4d.png', title: 'Ders Platosu' });
  pushUnique(`${SITE_BASE}/egitim`, '0.9', 'weekly');
  pushUnique(`${SITE_BASE}/youtuber-hocalar`, '0.8', 'weekly');
  pushUnique(`${SITE_BASE}/kitaplar`, '0.8', 'weekly');
  pushUnique(`${SITE_BASE}/kitap-listesi`, '0.7', 'weekly');
  pushUnique(`${SITE_BASE}/video-soru-cozumleri`, '0.7', 'weekly');
  pushUnique(`${SITE_BASE}/soru-cozumleri`, '0.7', 'weekly');

  // ── Hocalar → /hoca/{slug} ───────────────────────────────────────────────
  try {
    const instructors = await fetchAll('instructors', [
      'fields[0]=name',
      'populate[photo][fields][0]=url',
    ]);
    console.log(`  ✅ ${instructors.length} hoca bulundu`);
    for (const inst of instructors) {
      const a = inst.attributes || inst;
      const slug = a.slug || slugify(a.name || '');
      if (!slug) continue;
      const photo = a.photo?.data?.attributes || a.photo;
      const photoUrl = toAbsoluteMediaUrl(photo?.url || '');
      pushUnique(
        `${SITE_BASE}/hoca/${slug}`,
        '0.8', 'weekly',
        photoUrl ? { loc: photoUrl, title: (a.name || slug) + ' – Ders Platosu' } : null
      );
    }
  } catch (e) { console.error('  ❌ Hoca hatası:', e.message); }

  // ── Kamplar → /egitim/{slug} ─────────────────────────────────────────────
  try {
    const camps = await fetchAll('camps', [
      'fields[0]=title',
      'fields[1]=slug',
      'fields[2]=introVideo',
    ]);
    console.log(`  ✅ ${camps.length} kamp bulundu`);
    for (const camp of camps) {
      const a = camp.attributes || camp;
      const slug = a.slug || slugify(a.title || '');
      if (!slug) continue;
      // YouTube thumbnail
      const vid = (a.introVideo || '').match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/)?.[1];
      const thumbUrl = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
      pushUnique(
        `${SITE_BASE}/egitim/${slug}`,
        '0.9', 'weekly',
        thumbUrl ? { loc: thumbUrl, title: (a.title || slug) + ' – Ders Platosu' } : null
      );
    }
  } catch (e) { console.error('  ❌ Kamp hatası:', e.message); }

  // ── Kitaplar → kitaplar sayfasında listeleniyor, ayrı URL yok ama görsel indexleme için thumbnail ──
  try {
    const books = await fetchAll('books', [
      'fields[0]=title',
      'populate[cover][fields][0]=url',
    ]);
    console.log(`  ✅ ${books.length} kitap bulundu`);
    // Kitaplar için ayrı URL yok, kitaplar sayfası zaten statik listede var
    // Ancak kitap görselleri için /kitap-listesi sayfasını görsel ile zenginleştirelim
  } catch (e) { console.error('  ❌ Kitap hatası:', e.message); }

  // ── XML yaz ──────────────────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(OUT_FILE, xml, 'utf8');
  console.log(`  ✅ sitemap.xml yazıldı (${urls.length} URL)`);
  console.log(`[${new Date().toISOString()}] Bitti.`);
}

generate().catch(err => {
  console.error('❌ Kritik hata:', err);
  process.exit(1);
});
