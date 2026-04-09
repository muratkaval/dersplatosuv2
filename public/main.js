/* ========================================
   main.js - Ders Platosu JavaScript
   ======================================== */

;(function () {
  if (window.__DP_MAIN_LOADED__) return;
  window.__DP_MAIN_LOADED__ = true;

// Uretimde hassas/veri loglarini kapali tut.
const DP_DEBUG = window.__DP_DEBUG__ === true;
function dpLog() { if (DP_DEBUG) console.log.apply(console, arguments); }
function dpWarn() { if (DP_DEBUG) console.warn.apply(console, arguments); }
function dpError() { if (DP_DEBUG) console.error.apply(console, arguments); }

function runWhenDomReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

function escHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Türkçe karakter destekli URL slug üretici
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function safeHref(url, fallback) {
  var fb = fallback || '#';
  if (!url) return fb;
  var raw = String(url).trim();
  if (raw.startsWith('/') || raw.startsWith('#')) return raw;
  try {
    var u = new URL(raw, window.location.origin);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:' || u.protocol === 'tel:') {
      return u.href;
    }
  } catch (e) { }
  return fb;
}

function safeImgSrc(url, fallback) {
  var fb = fallback || '';
  if (!url) return fb;
  var raw = String(url).trim();
  if (/^data:image\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  try {
    var u = new URL(raw, window.location.origin);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch (e) { }
  return fb;
}

/**
 * YouTube URL'sinden video ID çıkarır.
 * Desteklenen formatlar:
 *   - Sadece ID: dQw4w9WgXcQ
 *   - Tam URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   - Kısa URL: https://youtu.be/dQw4w9WgXcQ
 *   - Embed URL: https://www.youtube.com/embed/dQw4w9WgXcQ
 *   - Parametre içeren: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=11s
 */
function extractYouTubeId(input) {
  if (!input) return '';
  input = input.trim();
  // Eğer URL değilse (/ veya . içermiyorsa), direkt ID olarak kabul et
  if (!/[\/\.]/.test(input)) return input;
  // youtube.com/watch?v=ID
  var match = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // youtu.be/ID veya youtube.com/embed/ID veya youtube.com/v/ID
  match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|v)\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // Son çare: 11 karakterlik ID pattern
  match = input.match(/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return input;
}

/**
 * YouTube Playlist URL'sinden playlist ID çıkarır.
 * Desteklenen formatlar:
 *   - Sadece ID: PLl3N8OcwtLscmNR_Lyass5KQfzKKhcxer
 *   - Tam URL: https://youtube.com/playlist?list=PLl3N8OcwtLscmNR_Lyass5KQfzKKhcxer
 */
function extractPlaylistId(input) {
  if (!input) return '';
  input = input.trim();
  // URL ise list= parametresini çıkar
  var match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // URL değilse direkt ID olarak kabul et
  return input;
}

/**
 * YouTube thumbnail fallback: hqdefault → mqdefault
 * maxresdefault 404 log kalabaligi yaptigi icin kullanilmiyor.
 */
function ytThumbWithFallback(videoId, imgElement) {
  if (!videoId || !imgElement) return;
  const fallbacks = [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  ];
  let attempt = 0;
  function tryLoad() {
    if (attempt >= fallbacks.length) return;
    const img = new Image();
    img.onload = function () {
      if (this.naturalWidth <= 120 && attempt < fallbacks.length - 1) {
        attempt++;
        tryLoad();
      } else {
        imgElement.src = fallbacks[attempt];
      }
    };
    img.onerror = function () {
      attempt++;
      tryLoad();
    };
    img.src = fallbacks[attempt];
  }
  tryLoad();
}

/** Background-image versiyonu (div için) */
function ytThumbBgFallback(videoId, element) {
  if (!videoId || !element) return;
  const fallbacks = [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  ];
  let attempt = 0;
  function tryLoad() {
    if (attempt >= fallbacks.length) return;
    const img = new Image();
    img.onload = function () {
      if (this.naturalWidth <= 120 && attempt < fallbacks.length - 1) {
        attempt++;
        tryLoad();
      } else {
        element.style.background = `url('${fallbacks[attempt]}') center/cover no-repeat`;
      }
    };
    img.onerror = function () {
      attempt++;
      tryLoad();
    };
    img.src = fallbacks[attempt];
  }
  tryLoad();
}




// ===== STRAPI CAMPS FETCH (with categories, subject, lessons) =====
let _campsFetchPromise = null;
let _campsCache = null;
let _campCoverPopulateUnsupported = false;

try {
  _campCoverPopulateUnsupported = localStorage.getItem('dp_cover_populate_unsupported') === '1';
} catch (e) { }

function setCoverPopulateUnsupported(flag) {
  _campCoverPopulateUnsupported = !!flag;
  try {
    if (_campCoverPopulateUnsupported) localStorage.setItem('dp_cover_populate_unsupported', '1');
    else localStorage.removeItem('dp_cover_populate_unsupported');
  } catch (e) { }
}

async function getCampsFromStrapiWithCategories() {
  if (Array.isArray(_campsCache) && _campsCache.length > 0) return _campsCache;
  if (_campsFetchPromise) return _campsFetchPromise;

  async function fetchCampsByQuery(query) {
    const res = await fetch(`${STRAPI_URL}/camps?${query}`, {
      headers: strapiHeaders
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    if (!res.ok || data?.error) {
      const key = data?.error?.details?.key;
      const msg = data?.error?.message || ('HTTP ' + res.status);
      throw new Error(key ? (msg + ' [' + key + ']') : msg);
    }
    return data.data || [];
  }

  _campsFetchPromise = (async function () {
    const baseQueryParts = [
      'fields[0]=title',
      'fields[1]=introVideo',
      'fields[2]=playlist',
      'fields[3]=slug',
      'populate[categories][fields][0]=name',
      'populate[subject][fields][0]=name',
      'populate[lessons][fields][0]=title',
      'populate[lessons][fields][1]=day',
      'populate[lessons][fields][2]=youtube',
      'populate[instructors][fields][0]=name',
      'populate[instructors][populate][photo][fields][0]=url',
      'sort[0]=createdAt:desc',
      'pagination[pageSize]=100'
    ];

    const withCoverQuery = [
      'populate[cover][fields][0]=url',
      'populate[cover][fields][1]=formats'
    ].concat(baseQueryParts).join('&');

    const withoutCoverQuery = baseQueryParts.join('&');

    const legacyQuery = [
      'fields[0]=title',
      'fields[1]=introVideo',
      'fields[2]=playlist',
      'fields[3]=slug',
      'populate[categories][fields][0]=name',
      'populate[subject][fields][0]=name',
      'populate[lessons][fields][0]=title',
      'populate[lessons][fields][1]=day',
      'populate[lessons][fields][2]=youtube',
      'populate[instructors][fields][0]=name',
      'populate[instructors][populate][photo][fields][0]=url',
      'pagination[pageSize]=100'
    ].join('&');

    const queryPlan = _campCoverPopulateUnsupported
      ? [withoutCoverQuery, legacyQuery]
      : [withCoverQuery, withoutCoverQuery, legacyQuery];

    for (let i = 0; i < queryPlan.length; i++) {
      try {
        const camps = await fetchCampsByQuery(queryPlan[i]);
        _campsCache = Array.isArray(camps) ? camps : [];
        dpLog('✅ Kamplar yüklendi. Sorgu denemesi:', i + 1, 'adet:', _campsCache.length);
        return _campsCache;
      } catch (err) {
        if (String(err && err.message || '').toLowerCase().includes('invalid key cover')) {
          setCoverPopulateUnsupported(true);
        }
        dpWarn('⚠️ Kamp sorgusu başarısız, fallback deneniyor:', err && err.message ? err.message : err);
      }
    }

    dpError('❌ Camp çekme hatası: tüm sorgu denemeleri başarısız oldu.');
    _campsCache = [];
    return _campsCache;
  })();

  try {
    return await _campsFetchPromise;
  } finally {
    _campsFetchPromise = null;
  }
}




/* ===== STRAPI API BAĞLANTISI ===== */
// Next.js API proxy üzerinden Strapi'ye bağlan.
const STRAPI_BASE = '';
const STRAPI_URL = '/api/strapi';
const STRAPI_TOKEN = window.__DP_PUBLIC_TOKEN__ || '';

// /uploads/... gibi relative resim URL'lerini düzelt
function fixImgUrl(url) {
  if (!url) return '';
  var raw = String(url).trim();
  if (!raw) return '';
  if (raw.startsWith('http')) return raw; // zaten tam URL
  if (raw.startsWith('//')) return window.location.protocol + raw;
  if (!raw.startsWith('/')) raw = '/' + raw; // uploads/... -> /uploads/...
  return STRAPI_BASE + raw;
}

// API Headers
const strapiHeaders = STRAPI_TOKEN
  ? { "Authorization": `Bearer ${STRAPI_TOKEN}` }
  : {};

// Campları Strapi'den çek (eski – artık getCampsFromStrapiWithCategories kullanılıyor)
/*
async function getCampsFromStrapi() {
    try {
        const res = await fetch(
            `${STRAPI_URL}/camps?populate[category][fields][0]=name&populate[introVideo]&populate[playlist]&pagination[pageSize]=100`,
            { headers: strapiHeaders }
        );
        const data = await res.json();
        dpLog("✅ Camplar yüklendi:", data.data);
        return data.data || [];
    } catch (err) {
        dpError("❌ Camp çekme hatası:", err);
        return [];
    }
}
*/



// Hocaları Strapi'den çek


async function getInstructorsFromStrapi() {
  try {
    // subjects: oneToMany → Subject, populate ile name alanını çek
    const res = await fetch(`${STRAPI_URL}/instructors?populate[photo][fields][0]=url&populate[photo][fields][1]=formats&populate[subjects][fields][0]=name&sort[0]=displayOrder:asc&pagination[pageSize]=100`, {
      headers: strapiHeaders
    });

    const data = await res.json();
    dpLog("✅ Hocalar RAW:", data);

    if (!data.data || data.data.length === 0) {
      dpLog("⚠️ API'dan hoca yok!");
      return [];
    }

    const instructors = data.data.map(instructor => {
      // Strapi v4: instructor.attributes || instructor (flat)
      const attrs = instructor.attributes || instructor;

      // subjects: oneToMany → array of Subject (+ isimden fallback)
      const subjectsRaw = attrs.subjects?.data || attrs.subjects || [];
      const subjectsArr = Array.isArray(subjectsRaw) ? subjectsRaw : [subjectsRaw];
      const firstSubject = subjectsArr[0]?.attributes || subjectsArr[0];
      let subjectName = firstSubject?.name || '';
      if (!subjectName) {
        const n = (attrs.name || '').toLowerCase();
        if (n.includes('matematik') || n.includes('mathman')) subjectName = 'Matematik';
        else if (n.includes('geometri')) subjectName = 'Geometri';
        else if (n.includes('fizik') || n.includes('fizmat')) subjectName = 'Fizik';
        else if (n.includes('kimya') || n.includes('simyac')) subjectName = 'Kimya';
        else if (n.includes('biyoloji')) subjectName = 'Biyoloji';
        else if (n.includes('türkçe') || n.includes('turkce') || n.includes('cansu') || n.includes('nazl')) subjectName = 'Türkçe';
        else if (n.includes('tarih')) subjectName = 'Tarih';
        else if (n.includes('coğrafya') || n.includes('cografya') || n.includes('cemografya')) subjectName = 'Coğrafya';
        else if (n.includes('felsefe') || n.includes('felsefast')) subjectName = 'Felsefe';
        else if (n.includes('din') || n.includes('enise')) subjectName = 'Din Kültürü';
        else if (n.includes('edebiyat')) subjectName = 'Edebiyat';
        else subjectName = 'Öğretmen';
      }

      // Photo: Media field
      const photoObj = attrs.photo?.data?.attributes || attrs.photo;
      const photoUrl = photoObj?.formats?.thumbnail?.url || photoObj?.url || null;

      return {
        id: instructor.id,
        documentId: instructor.documentId || instructor.id,
        name: attrs.name || 'Adsız',
        slug: attrs.slug || slugify(attrs.name || ''),
        image: {
          url: photoUrl
        },
        subject: {
          name: subjectName
        },
        youtube_url: attrs.youtube || '',
        instagram_url: attrs.instagram || ''
      };
    });

    dpLog("✅ Hocalar işlendi:", instructors);
    return instructors;
  } catch (err) {
    dpError("❌ Hoca çekme hatası:", err);
    return [];
  }
}


//kod baslanguc hoca


// ===== ADIM 2: HOCALARI RENDER ET =====
async function renderStoryScroll() {
  const storyScroll = document.getElementById('storyScroll');
  if (!storyScroll) {
    dpLog("❌ storyScroll elementi bulunamadı");
    return;
  }

  const instructors = await getInstructorsFromStrapi();

  if (!instructors || instructors.length === 0) {
    dpLog("⚠️ Hoca yok");
    return;
  }

  let storiesHTML = '';

  instructors.forEach((instructor, idx) => {
    const imgUrl = safeImgSrc(fixImgUrl(instructor.image?.url ? `${instructor.image.url}` : ''), 'https://via.placeholder.com/100');
    const instructorName = escHtml(instructor.name || 'Adsiz');
    const subjectName = escHtml(instructor.subject?.name || 'Bilgi yok');

    storiesHTML += `<div class="story-item" data-idx="${idx}" data-instructor-id="${instructor.id}">
        <div class="story-ring">
        <img src="${imgUrl}" alt="${instructorName}" class="story-img" onerror="this.parentElement.innerHTML='👨‍🏫'">
          </div>
           <span class="story-name">${instructorName}</span>
            <span class="story-subject">${subjectName}</span>
        </div>`;
  });

  storyScroll.innerHTML = storiesHTML;

  document.querySelectorAll('.story-item').forEach(item => {
    item.addEventListener('click', async function () {
      const instructorId = this.getAttribute('data-instructor-id');
      const instructor = instructors.find(i => i.id == instructorId);
      if (instructor) {
        showInstructorDetailsPanel(instructor);
      }
    });
  });

  dpLog(`✅ ${instructors.length} hoca render edildi!`);
}



//kod bitis hoca






const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('zeduva-theme', theme);
  if (theme === 'dark') {
    sunIcon && (sunIcon.style.display = 'none');
    moonIcon && (moonIcon.style.display = '');
  } else {
    sunIcon && (sunIcon.style.display = '');
    moonIcon && (moonIcon.style.display = 'none');
  }
}

const savedTheme = localStorage.getItem('zeduva-theme') || 'light';
applyTheme(savedTheme);

themeToggle && themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ===== GÖRSEL ALT METNİ (admin panelinden yönetilebilir) =====
function getImgAlt(type, docId, fallbackTitle) {
  try {
    var alts = JSON.parse(localStorage.getItem('dp_img_alts') || '{}');
    var key = type + '_' + (docId || '');
    if (alts[key]) return escHtml(alts[key]);
  } catch (e) { }
  // Otomatik üret
  var t = (fallbackTitle || '').trim();
  if (!t) return 'Ders Platosu';
  return escHtml(type === 'camp' ? t + ' Kampı – Ders Platosu' : t + ' – Ders Platosu');
}

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ===== NAV & FOOTER CONFIG (admin panelinden yönetilir — tüm sayfalarda ortak) =====
(async function applyNavFootConfig() {
  const currentPage = location.pathname.split('/').pop() || "/";
  const NAV_FOOT_PAGE_SLUG = 'site-nav-footer-config';

  // Varsayılan linkler — admin kaydetmese bile tüm sayfalar bunları gösterir
  const DEFAULT_NAV = [
    { label: 'Ana Sayfa', url: "/" },
    { label: 'Youtuber Hocalarımız', url: "/youtuber-hocalar" },
    { label: 'Kitaplarımız', url: "/kitaplar" },
    { label: 'Videolu Soru Çözümleri', url: "/video-soru-cozumleri" }
  ];

  const DEFAULT_FOOT = [
    {
      title: 'Platform', links: [
        { label: 'Ana Sayfa', url: "/" },
        { label: 'Youtuber Hocalarımız', url: "/youtuber-hocalar" },
        { label: 'Kitaplarımız', url: "/kitaplar" },
        { label: 'Videolu Soru Çözümleri', url: "/video-soru-cozumleri" }
      ]
    },
    {
      title: 'Hizmetler', links: [
        { label: 'Kamplar', url: '#kamplar' },
        { label: 'Soru Çözümleri', url: "/soru-cozumleri" }
      ]
    },
    {
      title: 'Hesap', links: [
        { label: 'Ücretsiz Üye Ol', url: "/kayit" },
        { label: 'Gizlilik', url: '#' },
        { label: 'Kullanım Koşulları', url: '#' }
      ]
    }
  ];

  const DEFAULT_FOOT_BRAND = [
    {
      name: 'Ders Platosu',
      desc: "Turkiye'nin en buyuk ucretsiz TYT & AYT egitim platformu.",
      logo: 'https://i.hizliresim.com/ag3gf4d.png',
      url: '/'
    },
    {
      name: 'Isler Yayin Grubu',
      desc: 'Yayincilik ve egitimde guvenilir cozum ortagi.',
      logo: 'https://i.hizliresim.com/8c5v6k7.png',
      url: 'https://isler.com.tr/'
    }
  ];

  function normalizeSharedNavFoot(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const normalizeIds = (arr) => (Array.isArray(arr) ? arr : []).map(v => String(v || '').trim()).filter(Boolean);
    const orderingSrc = (src.ordering && typeof src.ordering === 'object') ? src.ordering : {};
    return {
      nav: Array.isArray(src.nav) && src.nav.length ? src.nav : DEFAULT_NAV,
      footer: Array.isArray(src.footer) && src.footer.length ? src.footer : DEFAULT_FOOT,
      brand: Array.isArray(src.brand) && src.brand.length ? src.brand : DEFAULT_FOOT_BRAND,
      ordering: {
        campIds: normalizeIds(orderingSrc.campIds),
        categoryIds: normalizeIds(orderingSrc.categoryIds)
      }
    };
  }

  async function getSharedNavFootConfig() {
    try {
      const query = [
        `filters[slug][$eq]=${encodeURIComponent(NAV_FOOT_PAGE_SLUG)}`,
        'pagination[pageSize]=1'
      ].join('&');
      const res = await fetch(`${STRAPI_URL}/pages?${query}`, {
        headers: strapiHeaders
      });
      if (!res.ok) throw new Error('Strapi response not ok');
      const data = await res.json();
      const item = (data && data.data && data.data[0]) || null;
      if (!item || !item.content) throw new Error('No content');
      let parsed = null;
      try { parsed = JSON.parse(item.content); }
      catch (e) { throw new Error('Parse failed'); }
      return normalizeSharedNavFoot(parsed);
    } catch (e) {
      // Strapi'den okunamadıysa localStorage fallback (admin panelden kaydedilen veri)
      try {
        var nav = JSON.parse(localStorage.getItem('dp_nav_config'));
        var footer = JSON.parse(localStorage.getItem('dp_footer_config'));
        var brand = JSON.parse(localStorage.getItem('dp_footer_brand'));
        if (nav || footer || brand) {
          return normalizeSharedNavFoot({ nav: nav, footer: footer, brand: brand });
        }
      } catch (le) { }
      return null;
    }
  }

  const sharedNavFoot = await getSharedNavFootConfig();

  // ─── NAVBAR LİNKLERİ ───
  const navLinks = sharedNavFoot ? sharedNavFoot.nav : DEFAULT_NAV;

  const navList = document.querySelector('.nav-links');
  if (navList) {
    navList.innerHTML = navLinks.map(l => {
      const href = safeHref(l.url, '#');
      const label = escHtml(l.label);
      const isActive = currentPage === href || (currentPage === '' && href === 'index.html') || (currentPage === '' && href === '/');
      return `<li><a href="${href}" class="nav-link${isActive ? ' active' : ''}">${label}</a></li>`;
    }).join('');
  }

  const mm = document.getElementById('mobileMenu');
  if (mm) {
    mm.querySelectorAll(':scope > a').forEach(a => a.remove());
    navLinks.forEach(l => {
      const a = document.createElement('a');
      a.href = safeHref(l.url, '#');
      a.textContent = l.label || '';
      mm.appendChild(a);
    });
  }

  // ─── FOOTER SÜTUNLARI (.footer-col) ───
  const footCols = sharedNavFoot ? sharedNavFoot.footer : DEFAULT_FOOT;

  const footGrid = document.querySelector('.footer-grid');
  if (footGrid) {
    // Sayfalar arası farklı statik footer içeriklerini engellemek için grid'i her zaman sıfırdan kur.
    footGrid.innerHTML = '';
  }

  const footBrands = sharedNavFoot ? sharedNavFoot.brand : DEFAULT_FOOT_BRAND;

  if (footGrid) {
    const footBrand = document.createElement('div');
    footBrand.className = 'footer-brand';
    footGrid.appendChild(footBrand);

    const primary = footBrands[0] || DEFAULT_FOOT_BRAND[0];
    const primaryHref = safeHref(primary.url || '/', '/');
    const primaryLogo = safeImgSrc(primary.logo || DEFAULT_FOOT_BRAND[0].logo, DEFAULT_FOOT_BRAND[0].logo);
    const primaryName = escHtml(primary.name || 'Ders Platosu');
    const primaryDesc = escHtml(primary.desc || '');
    footBrand.innerHTML = `
      <a href="${primaryHref}" class="nav-logo">
        <img src="${primaryLogo}" class="logo-img" alt="${primaryName}">
        <span class="logo-text">${primaryName}</span>
      </a>
      <p>${primaryDesc}</p>
    `;

    const primaryLogoEl = footBrand.querySelector('.logo-img');
    if (primaryLogoEl) {
      primaryLogoEl.onerror = function () {
        this.style.display = 'none';
      };
    }

    const secondary = footBrands.slice(1).filter(function (b) { return b && b.logo; });
    if (secondary.length) {
      const logos = document.createElement('div');
      logos.className = 'footer-brand-logos';
      logos.innerHTML = secondary.map(function (b) {
        const url = safeHref(b.url || '#', '#');
        const name = escHtml(b.name || 'Footer Logo');
        const logo = safeImgSrc(b.logo, '');
        if (!logo) return '';
        return `<a href="${url}" target="_blank" rel="noopener"><img src="${logo}" alt="${name}" loading="lazy" onerror="this.style.display='none'"></a>`;
      }).join('');
      footBrand.querySelector('.nav-logo').appendChild(logos);
    }

    const validCols = Array.isArray(footCols) ? footCols : [];
    validCols.forEach(col => {
      if (!col || !col.title) return;
      const div = document.createElement('div');
      div.className = 'footer-col';
      const links = Array.isArray(col.links) ? col.links : [];
      div.innerHTML = `<h4>${escHtml(col.title)}</h4>` +
        links.map(l => `<a href="${safeHref(l?.url, '#')}">${escHtml(l?.label)}</a>`).join('');
      footGrid.appendChild(div);
    });
  }
})();


// ===== MOBILE MENU =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
mobileMenuBtn && mobileMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = mobileMenuBtn.querySelectorAll('span');
  if (mobileMenu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translateY(7px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

// ===== HERO STAT COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    if (target >= 1000) {
      el.textContent = Math.floor(current).toLocaleString('tr');
    } else {
      el.textContent = Math.floor(current);
    }
  }, 16);
}

const statNums = document.querySelectorAll('.stat-num');
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      statNums.forEach(num => animateCounter(num));
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
heroStats && heroObserver.observe(heroStats);

// ===== INSTRUCTOR DATA (16 kanallar, çoklu kamp desteği) =====
const instructorData = [
  {
    idx: 0,
    name: 'Enise Hocam',
    subject: 'Din Kültürü',
    photo: 'https://i.hizliresim.com/9n45zfk.jpg',
    youtube: 'https://www.youtube.com/@EniseHocam',
    instagram: 'https://www.instagram.com/enisehocam',
    books: [
      { title: '7 Günde 2x Hızında TYT Felsefe ve Din Kültürü', cover: 'https://i.hizliresim.com/myo48zb.png' }
    ],
    camps: [
      { video: 'EDg22fcNnAE', list: 'PL-3G5m_s7HYhvjJKr52cyDDsYGS6o5ohE', title: 'Din Kültürü Kampı' }
    ]
  },
  {
    idx: 1,
    name: 'Ahmetle Fizik',
    subject: 'Fizik',
    photo: 'https://i.hizliresim.com/852fked.png',
    youtube: 'https://www.youtube.com/@AhmetleFizik',
    instagram: 'https://www.instagram.com/ahmetlefizik',
    books: [
      { title: '7 Günde 2x Hızında AYT Fizik', cover: 'https://i.hizliresim.com/4zeagrf.png' }
    ],
    camps: [
      { video: '_kS81j2rE-w', list: 'PLNKDbyBaT6-GZXwasuTO4Yqn1G1dnL1Y4', title: 'Fizik Kampı' }
    ]
  },
  {
    idx: 2,
    name: 'Cansu Hoca',
    subject: 'Türkçe',
    photo: 'https://i.hizliresim.com/8rz201g.png',
    youtube: 'https://www.youtube.com/@CAnsuHoca',
    instagram: 'https://www.instagram.com/cansuhoca',
    books: [
      { title: '7 Günde 2x Hızında TYT Türkçe', cover: 'https://i.hizliresim.com/pijkn5e.png' }
    ],
    camps: [
      { video: '95ZpE93kSNE', list: 'PLZ7_47RJwDLcYKPqv41hHkNFk-V7rsmVG', title: 'Türkçe Kampı' }
    ]
  },
  {
    idx: 3,
    name: 'Cemografya',
    subject: 'Coğrafya',
    photo: 'https://i.hizliresim.com/d6vcc1s.png',
    youtube: 'https://www.youtube.com/@Cemografya',
    instagram: 'https://www.instagram.com/cemografya',
    books: [
      { title: '7 Günde 2x Hızında TYT Coğrafya', cover: 'https://i.hizliresim.com/mchryrj.png' }
    ],
    camps: [
      { video: 'RaqpxUwsl0g', list: 'PLl3N8OcwtLscmNR_Lyass5KQfzKKhcxer', title: 'Coğrafya TYT Kampı' }
    ]
  },
  {
    idx: 4,
    name: 'Felsefast',
    subject: 'Felsefe',
    photo: 'https://i.hizliresim.com/mij1uuj.png',
    youtube: 'https://www.youtube.com/@Felsefast',
    instagram: 'https://www.instagram.com/felsefast',
    books: [
      { title: '7 Günde 2x Hızında TYT Felsefe ve Din Kültürü', cover: 'https://i.hizliresim.com/myo48zb.png' }
    ],
    camps: [
      { video: '1l62-XLtllk', list: 'PLdw-ymGLKCu4tVtfI1bCKHvbXQ1nWbOTy', title: 'Felsefe Kampı' }
    ]
  },
  {
    idx: 5,
    name: 'Fizmat Serhat',
    subject: 'Fizik',
    photo: 'https://i.hizliresim.com/qhq9eh0.png',
    youtube: 'https://www.youtube.com/@FizmatSerhat',
    instagram: 'https://www.instagram.com/fizmatserhat',
    books: [
      { title: '7 Günde 2x Hızında TYT Fizik', cover: 'https://i.hizliresim.com/g2upz2q.png' }
    ],
    camps: [
      { video: '_kS81j2rE-w', list: 'PLNKDbyBaT6-GZXwasuTO4Yqn1G1dnL1Y4', title: 'Fizik Kampı' }
    ]
  },
  {
    idx: 6,
    name: 'Hasan Hocanın Evreni',
    subject: 'Matematik',
    photo: 'https://i.hizliresim.com/3ii5opd.png',
    youtube: 'https://www.youtube.com/@HasanHocaninEvreni',
    instagram: 'https://www.instagram.com/hasanhocaninevreniii',
    books: [
      { title: 'AYT 2x Hızında Trigonometri', cover: 'https://i.hizliresim.com/28bbra4.png' }
    ],
    camps: [
      { video: '_icV28iOnKc', list: 'PLefw8S-Npezs3lbuau4HsGclEg2dQQbpw', title: 'Matematik TYT Kampı' }
    ]
  },
  {
    idx: 7,
    name: "Nazlı Hoca'm",
    subject: 'Türkçe',
    photo: 'https://i.hizliresim.com/s1217yd.png',
    youtube: 'https://www.youtube.com/@NazliHocam',
    instagram: 'https://www.instagram.com/nazlihocam',
    books: [
      { title: '7 Günde 2x Hızında TYT Türkçe', cover: 'https://i.hizliresim.com/pijkn5e.png' }
    ],
    camps: [
      { video: '95ZpE93kSNE', list: 'PLZ7_47RJwDLcYKPqv41hHkNFk-V7rsmVG', title: 'Türkçe Kampı' }
    ]
  },
  {
    idx: 8,
    name: 'Seda Hoca Biyoloji',
    subject: 'Biyoloji',
    photo: 'https://i.hizliresim.com/t7qtm46.png',
    youtube: 'https://www.youtube.com/@SedaHocaBiyoloji',
    instagram: 'https://www.instagram.com/sedahocabiyoloji',
    books: [
      { title: '7 Günde 2x Hızında TYT Biyoloji', cover: 'https://i.hizliresim.com/gzl4j8i.png' }
    ],
    camps: [
      { video: 'YFpJWzXASUI', list: 'PL8JbgP94pvnwUYVzf6qW2_4kQCjIrXcro', title: 'Biyoloji Kampı' }
    ]
  },
  {
    idx: 9,
    name: 'Simyacı Kimya Akademi',
    subject: 'Kimya',
    photo: 'https://i.hizliresim.com/5c553rs.png',
    youtube: 'https://www.youtube.com/@SimyaciKimyaAkademi',
    instagram: 'https://www.instagram.com/simyacikimya',
    books: [
      { title: '7 Günde 2x Hızında TYT Kimya', cover: 'https://i.hizliresim.com/oqgfbju.png' }
    ],
    camps: [
      { video: '1c0hNlPihS8', list: 'PL8JbgP94pvnwUYVzf6qW2_4kQCjIrXcro', title: 'Kimya Kampı' }
    ]
  },
  {
    idx: 10,
    name: 'Tarih Sosyal Atölyesi',
    subject: 'Tarih',
    photo: 'https://i.hizliresim.com/d19dvec.png',
    youtube: 'https://www.youtube.com/@TarihSosyalAtolyesi',
    instagram: 'https://www.instagram.com/tarihsosyalatolyesi',
    books: [
      { title: '7 Günde 2x Hızında TYT Tarih', cover: 'https://i.hizliresim.com/rah8m1t.png' }
    ],
    camps: [
      { video: 'pDtIVXOOl5w', list: 'PLD2wXaX0vBHEkp0-OLnjqAIrxGx8DLBj_', title: 'Tarih Kampı' }
    ]
  },
  {
    idx: 11,
    name: 'Türkçenin Dedektifi',
    subject: 'Türkçe',
    photo: 'https://i.hizliresim.com/inuo2ae.png',
    youtube: 'https://www.youtube.com/@TurkceninDedektifi',
    instagram: 'https://www.instagram.com/turkcenindedektifi',
    books: [
      { title: '7 Günde 2x Hızında TYT Türkçe', cover: 'https://i.hizliresim.com/pijkn5e.png' }
    ],
    camps: [
      { video: 'XhtG-pDErkA', list: 'PLZ7_47RJwDLcYKPqv41hHkNFk-V7rsmVG', title: 'Türkçe Kampı' }
    ]
  },
  {
    idx: 12,
    name: 'Uzaktan Hoca',
    subject: 'Türkçe',
    photo: 'https://i.hizliresim.com/eybn6s6.png',
    youtube: 'https://www.youtube.com/@UzaktanHoca',
    instagram: 'https://www.instagram.com/uzaktanhoca',
    books: [
      { title: '7 Günde 2x Hızında TYT Türkçe', cover: 'https://i.hizliresim.com/pijkn5e.png' }
    ],
    camps: [
      { video: 'XhtG-pDErkA', list: 'PLZ7_47RJwDLcYKPqv41hHkNFk-V7rsmVG', title: 'Türkçe Kampı' }
    ]
  },
  {
    idx: 13,
    name: 'Umut Öncül Akademi',
    subject: 'Fizik',
    photo: 'https://i.hizliresim.com/cmn9dyt.png',
    youtube: 'https://www.youtube.com/@UmutOncul',
    instagram: 'https://www.instagram.com/umutoncul',
    books: [
      { title: 'Sıfırmatik Problemler Kampı', cover: 'https://i.hizliresim.com/e9cyr4u.png' },
      { title: '7 Günde 2x Hızında TYT Fizik', cover: 'https://i.hizliresim.com/g2upz2q.png' }
    ],
    camps: [
      { video: '_kS81j2rE-w', list: 'PLNKDbyBaT6-GZXwasuTO4Yqn1G1dnL1Y4', title: 'Fizik TYT Kampı' },
      { video: '_kS81j2rE-w', list: 'PLNKDbyBaT6-GZXwasuTO4Yqn1G1dnL1Y4', title: 'Fizik AYT Kampı' }
    ]
  },
  {
    idx: 14,
    name: 'Yaşar Hoca Mathman',
    subject: 'Matematik',
    photo: 'https://i.hizliresim.com/29uds6u.jpg',
    youtube: 'https://www.youtube.com/@YasarHocaMathman',
    instagram: 'https://www.instagram.com/yasarhocamathman',
    books: [
      { title: '7 Günde 2x Hızında TYT Matematik', cover: 'https://i.hizliresim.com/bu4eaxk.png' },
      { title: 'AYT 2x Hızınca Analitik Geometri', cover: 'https://i.hizliresim.com/37bc8ff.png' }
    ],
    camps: [
      { video: '_icV28iOnKc', list: 'PLefw8S-Npezs3lbuau4HsGclEg2dQQbpw', title: 'Matematik TYT Kampı' },
      { video: '_icV28iOnKc', list: 'PLefw8S-Npezs3lbuau4HsGclEg2dQQbpw', title: 'Matematik AYT Kampı' }
    ]
  },
  {
    idx: 15,
    name: 'Burak Köse Geometri',
    subject: 'Geometri',
    photo: 'https://i.hizliresim.com/bsafhtx.png',
    youtube: 'https://www.youtube.com/@BurakKoseGeometri',
    instagram: 'https://www.instagram.com/burakkosegeometri',
    books: [
      { title: '7 Günde 2x Hızında TYT Geometri', cover: 'https://i.hizliresim.com/rezulcb.png' },
      { title: 'AYT 2x Hızınca Matematik İlk 10 Soru', cover: 'https://i.hizliresim.com/irjz0oh.png' }
    ],
    camps: [
      { video: 'IfKi3UjattA', list: 'PL5kGMSi3iohUiHSe1soCf1zdkNbzliIw9', title: 'Geometri Kampı' }
    ]
  }
];

// ===== STORY EXPAND PANEL =====
let expandOpenIdx = -1;
const expandPanel = document.getElementById('instructorExpandPanel');

//story

function buildExpandPanel(d) {
  const campCards = (d.camps && Array.isArray(d.camps) && d.camps.length > 0)
    ? d.camps.map(c => {
      const videoId = extractYouTubeId(c.introVideo || c.video || '');
      const title = escHtml(c.title || 'Kamp');
      const playlistId = extractPlaylistId(c.playlist || c.list || '');
      const campSlug = c.slug || slugify(c.title || '');
      const url = campSlug ? '/egitim/' + campSlug : '/egitim?v=' + videoId + '&list=' + playlistId;
      const thumbSrc = videoId
        ? 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg'
        : 'https://via.placeholder.com/320x180?text=Kamp';
      return '<a href="' + url + '" class="exp-camp-card"><div class="exp-camp-thumb"><img src="' + thumbSrc + '" alt="' + getImgAlt('camp', c.documentId || c.id, c.title || 'Kamp') + '" loading="lazy"><div class="exp-camp-play">▶</div></div><span class="exp-camp-title">' + title + '</span></a>';
    }).join('')
    : '';

    const booksHtml = (d.books && Array.isArray(d.books) && d.books.length > 0)
    ? d.books.map(b => {
      const coverUrl = b.cover && b.cover.url
        ? fixImgUrl(b.cover.url)
        : (b.cover ? fixImgUrl(b.cover) : 'https://via.placeholder.com/120x170?text=Kitap');
      const safeCover = safeImgSrc(coverUrl, 'https://via.placeholder.com/120x170?text=Kitap');
      const safeTitle = escHtml(b.title || 'Kitap');

      const demoLink = b.solution_link || '';
      const demoBtn = demoLink
        ? '<a href="' + safeHref(demoLink, '#') + '" class="btn-demo-book" target="_blank" rel="noopener">🔎 Kitabı İncele</a>'
        : '';

      return '<div class="book-item exp-book-item"><div class="book-cover-wrap"><img src="' + safeCover + '" alt="' + getImgAlt('book', b.documentId || b.id, b.title || 'Kitap') + '" loading="lazy"></div><div class="book-details"><h4>' + safeTitle + '</h4><a href="' + safeHref(b.buy_link || '#', '#') + '" class="btn-buy-book" target="_blank" rel="noopener">📦 Satın Al ↗</a>' + demoBtn + '</div></div>';
    }).join('')
    : '';

  const photoUrl = safeImgSrc(d.photo || '', 'https://via.placeholder.com/100');
  const subject = escHtml(d.subject || 'Konu Yok');
  const youtubeUrl = safeHref(d.youtube || '#', '#');
  const instagramUrl = safeHref(d.instagram || '#', '#');
  const name = escHtml(d.name || 'Adsız');

  const youtubeBtn = '<a href="' + youtubeUrl + '" target="_blank" rel="noopener" class="exp-btn exp-btn-yt"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/></svg>YouTube Kanalı</a>';
  const instagramBtn = '<a href="' + instagramUrl + '" target="_blank" rel="noopener" class="exp-btn exp-btn-ig"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.6.1 4.7s0 3.4-.1 4.7c-.2 3.3-1.7 4.8-5 5-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.2-4.8-1.7-5-5C2 15.6 2 15.3 2 12s0-3.4.1-4.7c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7 .1 2.7.3.3 2.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c.2 4.3 2.6 6.7 7 6.9 1.3.1 1.7.1 5 .1s3.7 0 5-.1c4.3-.2 6.7-2.6 6.9-7C24 15.7 24 15.3 24 12s0-3.7-.1-5c-.2-4.3-2.6-6.7-7-6.9C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>Instagram</a>';

  const booksSection = booksHtml ? '<div class="exp-camps-label" style="margin-top:16px">📚 Kitaplar</div><div class="exp-books-scroll">' + booksHtml + '</div>' : '';

  return '<div class="exp-inner"><button class="exp-close" id="expCloseBtn" aria-label="Kapat">×</button><div class="exp-left"><img src="' + photoUrl + '" alt="' + name + '" class="exp-photo" loading="lazy"><div class="exp-subject-tag">' + subject + '</div></div><div class="exp-right"><h3 class="exp-name">' + name + '</h3><div class="exp-socials">' + youtubeBtn + instagramBtn + '</div><div class="exp-camps-label">🎬 Kamplar</div><div class="exp-camps-scroll">' + campCards + '</div>' + booksSection + '</div></div>';
}



//story



function openExpand(idx) {
  const d = instructorData[idx];

  if (!d || !expandPanel) {
    dpError("❌ Hoca bulunamadı:", idx);
    return;
  }

  dpLog("✅ Panel açıldı, hoca:", d);

  document.querySelectorAll('.story-item').forEach(el => {
    el.classList.toggle('story-active', parseInt(el.dataset.idx) === idx);
  });

  expandPanel.innerHTML = buildExpandPanel(d);
  expandPanel.classList.add('open');

  setTimeout(() => {
    expandPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 80);

  const closeBtn = document.getElementById('expCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeExpand);
  }

  expandOpenIdx = idx;
}




//sotry 333

function closeExpand() {
  expandPanel && expandPanel.classList.remove('open');
  document.querySelectorAll('.story-item').forEach(el => el.classList.remove('story-active'));
  expandOpenIdx = -1;
}

// Story item clicks – touch-aware: ignore swipe/scroll gestures on mobile
document.querySelectorAll('.story-item[data-idx]').forEach(item => {
  let touchStartX = 0, touchStartY = 0, wasDragged = false;
  item.addEventListener('touchstart', function (e) {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    wasDragged = false;
  }, { passive: true });
  item.addEventListener('touchmove', function (e) {
    const t = e.touches[0];
    if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) {
      wasDragged = true;
    }
  }, { passive: true });
  item.addEventListener('click', (e) => {
    // On touch devices, ignore click if user was scrolling/swiping
    if (wasDragged) { wasDragged = false; return; }
    const idx = parseInt(item.dataset.idx);
    if (expandOpenIdx === idx) {
      closeExpand();
    } else {
      openExpand(idx);
    }
  });
});

// ===== INTERSECTION OBSERVER (AOS) =====
const aosElements = document.querySelectorAll('[data-aos]');
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = e.target.getAttribute('data-aos-delay') || 0;
      setTimeout(() => e.target.classList.add('aos-animate'), parseInt(delay));
    }
  });
}, { threshold: 0.12 });
aosElements.forEach(el => aosObserver.observe(el));

// ===== CART BUTTON =====
const cartBtn = document.getElementById('cartBtn');
let cartCount = 0;
document.addEventListener('click', e => {
  if (e.target.classList.contains('btn-cart') || e.target.closest('.btn-cart')) {
    cartCount++;
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) {
      const badge = document.createElement('span');
      badge.id = 'cartBadge';
      badge.style.cssText = `
        position:absolute; top:-6px; right:-6px; background:#dc2626; color:#fff;
        font-size:0.65rem; font-weight:700; border-radius:50%;
        width:18px; height:18px; display:flex; align-items:center; justify-content:center;
      `;
      badge.textContent = cartCount;
      cartBtn.style.position = 'relative';
      cartBtn.appendChild(badge);
    } else {
      cartBadge.textContent = cartCount;
    }

    // Animate button
    const btn = e.target.classList.contains('btn-cart') ? e.target : e.target.closest('.btn-cart');
    btn.textContent = '✓ Eklendi!';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
    setTimeout(() => {
      btn.innerHTML = '🛒 Sepete Ekle';
      btn.style.background = '';
    }, 1500);
  }
});

// ===== VIDEO PLAY BUTTON =====
document.querySelector('.play-overlay') && document.querySelector('.play-overlay').addEventListener('click', () => {
  window.location.href = "/egitim";
});


// ===== COURSE CARD → GO TO EGITIM PAGE (no popup) =====
document.querySelectorAll('.course-thumb[data-youtube]').forEach(function (thumb) {
  thumb.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var slug = this.dataset.slug || this.dataset.docid || '';
    var videoId = this.dataset.youtube;
    var listId = this.dataset.playlist || '';
    window.location.href = slug ? '/egitim/' + slug : '/egitim?v=' + videoId + '&list=' + listId;
  });
});

document.querySelectorAll('.course-card').forEach(function (card) {
  var thumb = card.querySelector('.course-thumb[data-youtube]');
  if (!thumb) return;
  card.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.course-thumb[data-youtube]')) return;
    e.preventDefault();
    var slug = thumb.dataset.slug || thumb.dataset.docid || '';
    var videoId = thumb.dataset.youtube;
    var listId = thumb.dataset.playlist || '';
    window.location.href = slug ? '/egitim/' + slug : '/egitim?v=' + videoId + '&list=' + listId;
  });
});

// ===== HERO CAMP AUTO-SLIDER =====
(async function () {
  var heroCard = document.querySelector('.hero-card');
  if (!heroCard) return;

  // Strapi'den kampları çek ve normalize et
  const strapiCamps = await getCampsFromStrapiWithCategories();
  var camps = strapiCamps.map(function (camp) {
    const attr = camp.attributes || camp;
    const subjectObj = attr.subject?.data?.attributes || attr.subject || {};
    const subjectName = subjectObj.name || '';
    const coverObj = attr.cover?.data?.attributes || attr.cover;
    const coverUrl = coverObj?.formats?.medium?.url
      ? fixImgUrl(coverObj.formats.medium.url)
      : coverObj?.formats?.small?.url
        ? fixImgUrl(coverObj.formats.small.url)
        : coverObj?.formats?.thumbnail?.url
          ? fixImgUrl(coverObj.formats.thumbnail.url)
          : coverObj?.url
            ? fixImgUrl(coverObj.url)
            : '';
    const rawInstructors = attr.instructors?.data || attr.instructors || [];
    // Çoklu hoca desteği
    const instructors = rawInstructors.map(instRaw => {
      const inst = instRaw.attributes || instRaw || {};
      const ph = inst.photo?.data?.attributes || inst.photo;
      return {
        name: inst.name || '',
        photo: ph?.url ? fixImgUrl(ph.url) : ''
      };
    });
    return {
      title: attr.title || '',
      documentId: camp.documentId || attr.documentId || camp.id,
      slug: attr.slug || slugify(attr.title || ''),
      subject: subjectName,
      tag: subjectName.toLowerCase().replace(/\s+/g, ''),
      video: extractYouTubeId(attr.introVideo || ''),
      list: extractPlaylistId(attr.playlist || ''),
      cover: safeImgSrc(coverUrl, ''),
      instructors
    };
  });

  if (camps.length === 0) return; // Strapi bağlı değilse gösterme

  var INTERVAL = 10000;

  var thumbEl = heroCard.querySelector('.hero-course-thumb');
  var tagEl = heroCard.querySelector('.hero-course-tag');
  var titleEl = heroCard.querySelector('.hero-course-title');
  var instructorStack = heroCard.querySelector('.hero-instructor-stack');
  var playBtn = heroCard.querySelector('.course-play-btn');

  // Add progress bar
  var progBar = document.createElement('div'); progBar.className = 'camp-progress-bar';
  var progFill = document.createElement('div'); progFill.className = 'camp-progress-fill';
  progBar.appendChild(progFill);
  heroCard && heroCard.appendChild(progBar);

  // Add dots
  var dotsWrap = document.createElement('div'); dotsWrap.className = 'camp-dots';
  camps.forEach(function (_, i) {
    var d = document.createElement('div'); d.className = 'camp-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', function () { goTo(i); resetTimer(); });
    dotsWrap.appendChild(d);
  });
  heroCard && heroCard.parentNode && heroCard.parentNode.appendChild(dotsWrap);

  var current = 0;

  function goTo(idx) {
    current = idx;
    var c = camps[idx];

    // Fade out
    heroCard.classList.add('fading');
    setTimeout(function () {
      // Update content
      if (thumbEl) {
        if (c.cover) {
          thumbEl.style.background = "url('" + c.cover + "') center/cover no-repeat";
        } else if (c.video) {
          ytThumbBgFallback(c.video, thumbEl);
        } else {
          thumbEl.style.background = 'var(--bg-secondary)';
        }
      }
      if (tagEl) { tagEl.textContent = c.subject; tagEl.className = 'course-tag hero-course-tag ' + c.tag; }
      if (titleEl) titleEl.textContent = c.title;
      // Çoklu hoca avatar-stack ve isim
      if (instructorStack) {
        instructorStack.innerHTML = '';
        if (c.instructors && c.instructors.length > 0) {
          if (c.instructors.length <= 2) {
            // 1 veya 2 hoca: isim ve avatar
            c.instructors.forEach(inst => {
              var img = document.createElement('img');
              img.src = inst.photo;
              img.alt = inst.name;
              img.className = 'course-instructor-avatar hero-instructor-avatar';
              instructorStack.appendChild(img);
              var span = document.createElement('span');
              span.className = 'course-instructor-name hero-instructor-name';
              span.textContent = inst.name;
              instructorStack.appendChild(span);
            });
          } else {
            // 3+ hoca: avatar-stack
            var stackDiv = document.createElement('div');
            stackDiv.className = 'avatar-stack';
            c.instructors.slice(0, 5).forEach(inst => {
              var img = document.createElement('img');
              img.src = inst.photo;
              img.alt = inst.name;
              img.className = 'avatar-stack-img';
              stackDiv.appendChild(img);
            });
            if (c.instructors.length > 5) {
              var more = document.createElement('span');
              more.className = 'avatar-stack-more';
              more.textContent = '+' + (c.instructors.length - 5);
              stackDiv.appendChild(more);
            } else if (c.instructors.length > 3) {
              var more = document.createElement('span');
              more.className = 'avatar-stack-more';
              more.textContent = '+' + (c.instructors.length - 3);
              stackDiv.appendChild(more);
            }
            instructorStack.appendChild(stackDiv);
          }
        }
      }
      if (playBtn) playBtn.style.display = c.video ? '' : 'none';
      // Click handler for entire card
      heroCard.onclick = function (e) {
        e.preventDefault();
        window.location.href = '/egitim/' + (c.slug || c.documentId);
      };
      // Update dots
      document.querySelectorAll('.camp-dot').forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      // Fade in
      heroCard.classList.remove('fading');
      heroCard.classList.add('visible');
      setTimeout(function () { heroCard.classList.remove('visible'); }, 500);
    }, 400);

    // Progress bar animation
    progFill.style.transition = 'none';
    progFill.style.width = '0%';
    setTimeout(function () {
      progFill.style.transition = 'width ' + INTERVAL + 'ms linear';
      progFill.style.width = '100%';
    }, 50);
  }

  function next() { goTo((current + 1) % camps.length); }
  var timer = setInterval(next, INTERVAL);
  function resetTimer() { clearInterval(timer); timer = setInterval(next, INTERVAL); }

  // Initial state
  goTo(0);

  // Make card clickable
  heroCard && heroCard.addEventListener('click', function () {
    var c = camps[current];
    window.location.href = '/egitim/' + (c.slug || c.documentId);
  });
})();




// ===== STORY SCROLL - AUTO-SCROLL + SMOOTH DRAG =====
(function () {
  var scroll = document.getElementById('storyScroll');
  if (!scroll) return;

  // ---- Smooth auto-scroll ----
  var AUTO_INTERVAL = 5000;
  var CARD_WIDTH = 172;
  var autoTimer = null;
  var isUserActive = false;

  function smoothScrollBy(amount) {
    var start = scroll.scrollLeft;
    var end = start + amount;
    var duration = 600;
    var startTime = null;

    function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      scroll.scrollLeft = start + amount * ease(progress);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function autoNext() {
    if (isUserActive) return;
    var maxScroll = scroll.scrollWidth - scroll.clientWidth;
    if (scroll.scrollLeft >= maxScroll - CARD_WIDTH) {
      var start = scroll.scrollLeft;
      var duration = 800;
      var startTime = null;
      function stepBack(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        scroll.scrollLeft = start * (1 - progress);
        if (progress < 1) requestAnimationFrame(stepBack);
      }
      requestAnimationFrame(stepBack);
    } else {
      smoothScrollBy(CARD_WIDTH);
    }
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(autoNext, AUTO_INTERVAL);
  }

  function pauseAuto() { isUserActive = true; }
  function resumeAuto() {
    isUserActive = false;
    clearTimeout(resumeAuto._t);
    resumeAuto._t = setTimeout(function () { isUserActive = false; }, 1500);
  }

  scroll.addEventListener('mouseenter', pauseAuto);
  scroll.addEventListener('mouseleave', resumeAuto);
  startAuto();

  // ---- Momentum drag ----
  var isDown = false;
  var startX = 0;
  var scrollL = 0;
  var velX = 0;
  var lastX = 0;
  var lastTime = 0;
  var rafId = null;
  var isDragging = false;

  function cancelMomentum() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function applyMomentum() {
    velX *= 0.92;
    scroll.scrollLeft -= velX;
    if (Math.abs(velX) > 0.5) {
      rafId = requestAnimationFrame(applyMomentum);
    } else {
      rafId = null;
    }
  }

  scroll.addEventListener('mousedown', function (e) {
    cancelMomentum();
    pauseAuto();
    isDown = true;
    isDragging = false;
    scroll.style.cursor = 'grabbing';
    startX = e.pageX;
    scrollL = scroll.scrollLeft;
    velX = 0;
    lastX = e.pageX;
    lastTime = Date.now();
  });

  window.addEventListener('mouseup', function (e) {
    if (!isDown) return;
    isDown = false;
    scroll.style.cursor = '';
    if (Math.abs(velX) > 1) {
      rafId = requestAnimationFrame(applyMomentum);
    }
    resumeAuto();
    if (isDragging) {
      e.stopPropagation && e.stopPropagation();
    }
  });

  window.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    e.preventDefault();
    var dx = e.pageX - startX;
    if (Math.abs(dx) > 4) isDragging = true;
    scroll.scrollLeft = scrollL - dx;

    var now = Date.now();
    var dt = now - lastTime;
    if (dt > 0) velX = (lastX - e.pageX) / dt * 16;
    lastX = e.pageX;
    lastTime = now;
  });

  scroll.addEventListener('click', function (e) {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      isDragging = false;
    }
  }, true);
})();

// ===== DYNAMIC HOME CAMPS (Strapi Kategorileri) =====

async function getSharedOrderingConfig() {
  const empty = { campIds: [], categoryIds: [] };
  try {
    const query = [
      `filters[slug][$eq]=${encodeURIComponent('site-nav-footer-config')}`,
      'pagination[pageSize]=1'
    ].join('&');
    const res = await fetch(`${STRAPI_URL}/pages?${query}`, {
      headers: strapiHeaders
    });
    if (!res.ok) return empty;
    const data = await res.json();
    const item = (data && data.data && data.data[0]) || null;
    if (!item || !item.content) return empty;
    const parsed = JSON.parse(item.content);
    const rawOrdering = (parsed && typeof parsed.ordering === 'object') ? parsed.ordering : {};
    const normalizeIds = (arr) => (Array.isArray(arr) ? arr : []).map(v => String(v || '').trim()).filter(Boolean);
    return {
      campIds: normalizeIds(rawOrdering.campIds),
      categoryIds: normalizeIds(rawOrdering.categoryIds)
    };
  } catch (e) {
    return empty;
  }
}

// ===== DYNAMIC HOME CAMPS =====
async function renderHomeCamps() {
  const container = document.getElementById('dynamic-camps-container');
  if (!container) return;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Kamplar Yukleniyor...</h2>
    </div>
    <div class="courses-grid courses-skeleton-grid">
      <div class="course-card course-skeleton-card"></div>
      <div class="course-card course-skeleton-card"></div>
      <div class="course-card course-skeleton-card"></div>
    </div>
  `;

  // --- 1) Strapi'den kategorili kampları çek ---
  const strapiCamps = await getCampsFromStrapiWithCategories();

  // Strapi'den veri geldiyse kategorilere göre grupla
  if (strapiCamps.length > 0) {
    // Her kampı normalize et
    const normalizedCamps = strapiCamps.map(camp => {
      const attr = camp.attributes || camp;
      const categories = attr.categories?.data
        ? attr.categories.data.map(c => {
          const cat = c.attributes || c;
          return {
            id: String(c.documentId || cat.documentId || c.id || cat.id || ''),
            name: cat.name || '',
            order: Number(cat.displayOrder || 0)
          };
        }).filter(c => c.name)
        : (Array.isArray(attr.categories)
          ? attr.categories.map(c => ({
            id: String(c.documentId || c.id || ''),
            name: c.name || '',
            order: Number(c.displayOrder || 0)
          })).filter(c => c.name)
          : []);
      const coverObj = attr.cover?.data?.attributes || attr.cover;
      const coverUrl = coverObj?.formats?.medium?.url
        ? fixImgUrl(coverObj.formats.medium.url)
        : coverObj?.formats?.small?.url
          ? fixImgUrl(coverObj.formats.small.url)
          : coverObj?.formats?.thumbnail?.url
            ? fixImgUrl(coverObj.formats.thumbnail.url)
            : coverObj?.url
              ? fixImgUrl(coverObj.url)
              : '';

      // subject: manyToOne (tekil)
      const subjectObj = attr.subject?.data?.attributes || attr.subject || {};
      const subjectName = subjectObj.name || '';

      // Tüm instructor bilgilerini al
      const rawInstructors = attr.instructors?.data || attr.instructors || [];
      const instructors = rawInstructors.map(i => {
        const inst = i.attributes || i;
        const ph = inst.photo?.data?.attributes || inst.photo;
        return {
          name: inst.name || '',
          photo: ph?.url ? fixImgUrl(ph.url) : ''
        };
      }).filter(i => i.name);

      const campSlug = attr.slug || slugify(attr.title || '');
      return {
        id: camp.id,
        documentId: camp.documentId || attr.documentId || camp.id,
        slug: campSlug,
        title: attr.title || '',
        introVideo: extractYouTubeId(attr.introVideo || ''),
        playlist: extractPlaylistId(attr.playlist || ''),
        cover: safeImgSrc(coverUrl, ''),
        subject: subjectName,
        subjectClass: slugify(subjectName).replace(/-/g, ''),
        categories: categories,
        lessonsCount: attr.lessons?.length || attr.lessons?.data?.length || 0,
        instructors: instructors
      };
    });

    const ordering = await getSharedOrderingConfig();
    const campOrderMap = new Map((ordering.campIds || []).map((id, idx) => [String(id), idx]));
    const categoryOrderMap = new Map((ordering.categoryIds || []).map((id, idx) => [String(id), idx]));

    // Benzersiz kategorileri çıkar (sıralı)
    const categoryMap = new Map();
    normalizedCamps.forEach(camp => {
      camp.categories.forEach(cat => {
        const key = cat.id || ('name:' + String(cat.name || '').toLowerCase());
        if (!categoryMap.has(key)) {
          categoryMap.set(key, { id: cat.id || '', name: cat.name || '', order: Number(cat.order || 0), camps: [] });
        }
        categoryMap.get(key).camps.push(camp);
      });
    });

    // Kategori verisi yoksa kamplari tek bir varsayilan bolumde goster.
    if (categoryMap.size === 0 && normalizedCamps.length > 0) {
      categoryMap.set('default:kamplar', {
        id: '',
        name: 'Kamplar',
        order: 999,
        camps: normalizedCamps
      });
    }

    let html = '';
    let idx = 0;
    const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => {
      const aId = String(a[1].id || '');
      const bId = String(b[1].id || '');
      const ai = categoryOrderMap.has(aId) ? categoryOrderMap.get(aId) : -1;
      const bi = categoryOrderMap.has(bId) ? categoryOrderMap.get(bId) : -1;
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      const ao = Number(a[1].order || 0);
      const bo = Number(b[1].order || 0);
      if (ao && bo) return ao - bo;
      if (ao) return -1;
      if (bo) return 1;
      return String(a[1].name || '').localeCompare(String(b[1].name || ''), 'tr');
    });
    const totalCategories = sortedCategories.length;

    sortedCategories.forEach(([, group]) => {
      const categoryName = group.name;
      const camps = (group.camps || []).slice().sort((a, b) => {
        const aId = String(a.documentId || a.id || '');
        const bId = String(b.documentId || b.id || '');
        const ai = campOrderMap.has(aId) ? campOrderMap.get(aId) : -1;
        const bi = campOrderMap.has(bId) ? campOrderMap.get(bId) : -1;
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return String(a.title || '').localeCompare(String(b.title || ''), 'tr');
      });
      const cardsHtml = camps.map((c, delayIdx) => {
        const delay = (delayIdx % 4) * 60;
        const videoId = c.introVideo || '';
        // hqdefault her zaman mevcut, maxresdefault bazı videolarda 404 döner
        const thumb = c.cover || (videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : '');
        const url = `/egitim/${c.slug || c.documentId || (videoId + '?list=' + c.playlist)}`;

        // 1-2 hocada isimler gorunsun, 3+ hocada kompakt avatar grubu kullan.
        const instructorHtml = c.instructors && c.instructors.length > 0
          ? (() => {
            if (c.instructors.length <= 2) {
              return `<div class="course-instructor" aria-label="Egitmenler">
                ${c.instructors.map(inst => `
                  <span class="course-instructor-item" title="${escHtml(inst.name || 'Egitmen')}">
                    ${inst.photo
                  ? `<img src="${inst.photo}" alt="${escHtml(inst.name || 'Egitmen')}" class="course-instructor-avatar">`
                  : `<div class="course-instructor-avatar course-instructor-placeholder" aria-hidden="true">👨‍🏫</div>`}
                    <span class="course-instructor-name">${escHtml(inst.name || 'Egitmen')}</span>
                  </span>
                `).join('')}
              </div>`;
            }

            const maxVisible = 7;
            const visible = c.instructors.slice(0, maxVisible);
            const remaining = c.instructors.length - visible.length;
            const namesText = c.instructors.map(inst => inst.name).filter(Boolean).join(', ');

            return `<div class="course-instructor course-instructor-avatars" aria-label="Egitmenler: ${escHtml(namesText)}">
                ${visible.map(inst => `
                  <span class="course-instructor-item" title="${escHtml(inst.name || 'Egitmen')}">
                    ${inst.photo
                ? `<img src="${inst.photo}" alt="${escHtml(inst.name || 'Egitmen')}" class="course-instructor-avatar">`
                : `<div class="course-instructor-avatar course-instructor-placeholder" aria-hidden="true">👨‍🏫</div>`}
                  </span>
                `).join('')}
                ${remaining > 0 ? `<span class="course-instructor-more" title="${remaining} egitmen daha">+${remaining}</span>` : ''}
              </div>`;
          })()
          : '';
        return `
          <a href="${url}" class="course-card" data-aos="fade-up" data-aos-delay="${delay}">
              <div class="course-thumb" data-youtube="${videoId}"
                  data-cover="${c.cover ? '1' : ''}" data-slug="${c.slug}" data-playlist="${c.playlist}" data-docid="${c.documentId}" data-title="${c.title}"
                  style="background:${thumb ? `url('${thumb}') center/cover no-repeat` : 'var(--bg-secondary)'}">
                  ${videoId ? '<div class="course-play-btn"></div>' : ''}
              </div>
              <div class="course-body">
                  <h3>${c.title}</h3>
                  ${c.lessonsCount > 0 ? `<p class="course-lessons-count">${c.lessonsCount} ders içeriyor</p>` : ''}
                  <div class="course-footer-row">
                    ${instructorHtml}
                    ${c.subject ? `<span class="course-tag ${c.subjectClass}">${c.subject}</span>` : ''}
                  </div>
              </div>
          </a>`;
      }).join('');

      const marginStyle = idx < totalCategories - 1 ? 'margin-bottom: 60px;' : '';

      html += `
        <div style="${marginStyle}">
          <div class="section-header">
            <h2 class="section-title">${categoryName}</h2>
          </div>
          <div class="courses-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
      idx++;
    });

    container.innerHTML = html;

  } else {
    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Kamplar</h2>
      </div>
      <div class="courses-fetch-error">Kamp verisi su an yuklenemiyor. Lutfen biraz sonra tekrar deneyin.</div>
    `;
    return;

  }

  // AOS observer varsa yeniden bağla
  if (typeof aosObserver !== 'undefined') {
    container.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
  }

  // Render sonrası: hqdefault -> mqdefault fallback kontrolu
  container.querySelectorAll('.course-thumb[data-youtube]').forEach(el => {
    const vid = el.getAttribute('data-youtube');
    const hasCover = !!el.getAttribute('data-cover');
    if (vid && !hasCover) ytThumbBgFallback(vid, el);
  });
}

renderHomeCamps();




// Kitapları Strapi'den çek
async function getBooksFromStrapi() {
  try {
    // ✅ subject populate et
    const res = await fetch(`${STRAPI_URL}/books?populate[cover][fields][0]=url&populate[cover][fields][1]=name&populate[subjects][fields][0]=name&pagination[pageSize]=100`, {
      headers: strapiHeaders
    });
    const data = await res.json();
    dpLog("✅ Kitaplar yüklendi:", data.data);
    return data.data || [];
  } catch (err) {
    dpError("❌ Kitap çekme hatası:", err);
    return [];
  }
}



// ===== DİNAMİK KİTAP YÜKLEME =====
async function renderBooksFromStrapi() {
  const booksContainer = document.getElementById('booksGrid');
  if (!booksContainer) return;

  const books = await getBooksFromStrapi();

  if (!books || books.length === 0) {
    dpLog("⚠️ Kitap yok");
    return;
  }

  let booksHtml = '';
  // Yardımcı: başlıktan konu tahmini (subjects boş olduğunda fallback)
  function guessSubjectFromTitle(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('matematik') || t.includes('problemler') || t.includes('sayısal') || t.includes('sıfırmatik')) return 'Matematik';
    if (t.includes('geometri') || t.includes('analitik')) return 'Geometri';
    if (t.includes('fizik')) return 'Fizik';
    if (t.includes('kimya')) return 'Kimya';
    if (t.includes('biyoloji')) return 'Biyoloji';
    if (t.includes('türkçe') || t.includes('paragraf') || t.includes('dil bilgisi')) return 'Türkçe';
    if (t.includes('tarih')) return 'Tarih';
    if (t.includes('coğrafya')) return 'Coğrafya';
    if (t.includes('felsefe') || t.includes('din')) return 'Felsefe';
    if (t.includes('edebiyat')) return 'Edebiyat';
    return 'Diğer';
  }

  books.forEach((book, idx) => {
    try {
      const title = book.title || 'Başlıksız Kitap';
      const safeTitle = escHtml(title);

      // ✅ TÜM SUBJECTS → slug listesi (boşlukla ayrılmış, ör: 'felsefe din-kulturu')
      const toSlug = s => (s || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0131/g, 'i')
        .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const subjectsRaw = book.subjects?.data || book.subjects || [];
      const subjectsArr = Array.isArray(subjectsRaw) ? subjectsRaw : [];

      const subjectSlugs = subjectsArr.map(s => {
        const name = s?.attributes?.name || s?.name || '';
        return toSlug(name);
      }).filter(Boolean);

      // Fallback: slug yoksa başlıktan tahmin et
      const finalSlugs = subjectSlugs.length > 0
        ? subjectSlugs
        : [toSlug(guessSubjectFromTitle(title))];

      const dataCats = ' ' + finalSlugs.join(' ') + ' ';

      dpLog(`📖 Kitap: "${title}", Subjects: ${finalSlugs.join(', ')}`);

      // COVER URL'İ AL
      const coverUrl = book.cover?.url
        ? fixImgUrl(book.cover.url)
        : `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`;
      const safeCover = safeImgSrc(coverUrl, `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`);

      const instructor = 'Ders Platosu';
      const buyLink = safeHref(book.buy_link || '#', '#');
      const demoLink = book.solution_link || '';
      const demoBtn = demoLink
        ? `<a href="${safeHref(demoLink, '#')}" class="btn-demo-book" target="_blank" rel="noopener">🔎 Kitabı İncele</a>`
        : '';
      const delay = (idx % 4) * 100;

      booksHtml += `
                <div class="book-item" data-cats="${dataCats}" data-aos="zoom-in" data-aos-delay="${delay}">
                    <div class="book-cover-wrap">
                      <img src="${safeCover}" alt="${getImgAlt('book', book.documentId||book.id, title)}" loading="lazy">
                    </div>
                    <div class="book-details">
                      <h4>${safeTitle}</h4>
                        <span class="book-author">${instructor}</span>
                        <a href="${buyLink}" class="btn-buy-book" target="_blank" rel="noopener">📦 Satın Al ↗</a>
                        ${demoBtn}
                    </div>
                </div>`;
    } catch (err) {
      dpError(`Kitap hatası:`, err);
    }
  });

  booksContainer.innerHTML = booksHtml;

  if (typeof aosObserver !== 'undefined') {
    booksContainer.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
  }

  dpLog(`✅ ${books.length} kitap render edildi!`);
}

runWhenDomReady(function () {
  if (document.getElementById('booksGrid')) {
    renderBooksFromStrapi();
  }
});





// ===== KİTAP KATEGORİ FİLTRELEME =====
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const selectedCat = this.dataset.cat;
    dpLog("Seçilen kategori:", selectedCat);

    // Tüm kitapları göster/gizle
    document.querySelectorAll('.book-item').forEach(book => {
      const cats = book.dataset.cats || book.dataset.cat || '';

      if (selectedCat === 'tumu') {
        book.style.display = 'block';
      } else {
        // data-cats formatı: " matematik fizik " -> token eşleşmesi yap.
        book.style.display = (cats.includes(' ' + selectedCat + ' ') || cats === selectedCat) ? 'block' : 'none';
      }
    });

    // Buton aktif state
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});



// Öne çıkan kitapları çek
async function getFeaturedBooksFromStrapi() {
  try {
    const res = await fetch(`${STRAPI_URL}/books?filters[featured][$eq]=true&populate[cover][fields][0]=url&populate[cover][fields][1]=name&populate[subjects][fields][0]=name&pagination[pageSize]=100`, {
      headers: strapiHeaders
    });
    const data = await res.json();
    dpLog("✅ Öne çıkan kitaplar yüklendi:", data.data);
    return data.data || [];
  } catch (err) {
    dpError("❌ Öne çıkan kitap çekme hatası:", err);
    return [];
  }
}

async function renderFeaturedBooks() {
  const container = document.getElementById('featured-books-container');
  if (!container) return;

  const books = await getFeaturedBooksFromStrapi();

  if (!books || books.length === 0) {
    dpLog("⚠️ Öne çıkan kitap yok");
    return;
  }

  let booksHtml = '';

  books.slice(0, 4).forEach((book, idx) => {
    try {
      const title = book.title || 'Başlıksız Kitap';
      const safeTitle = escHtml(title);
      const instructor = book.instructor || 'Ders Platosu';

      const coverUrl = book.cover?.url
        ? fixImgUrl(book.cover.url)
        : `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`;
      const safeCover = safeImgSrc(coverUrl, `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`);

      const buyLink = safeHref(book.buy_link || '#', '#');
      const demoLink = book.solution_link || '';
      const demoBtn = demoLink
        ? `<a href="${safeHref(demoLink, '#')}" class="btn-demo-book" target="_blank" rel="noopener">🔎 Kitabı İncele</a>`
        : '';
      const delay = (idx % 4) * 100;

      booksHtml += `
                <div class="book-item" data-aos="zoom-in" data-aos-delay="${delay}">
                    <div class="book-cover-wrap">
                      <img src="${safeCover}" alt="${getImgAlt('book', book.documentId||book.id, title)}" loading="lazy">
                    </div>
                    <div class="book-details">
                      <h4>${safeTitle}</h4>
                        <span class="book-author">${instructor}</span>
                        <a href="${buyLink}" class="btn-buy-book" target="_blank" rel="noopener">📦 Satın Al ↗</a>
                        ${demoBtn}
                    </div>
                </div>`;
    } catch (err) {
      dpError(`Kitap hatası:`, err);
    }
  });

  container.innerHTML = booksHtml;

  if (typeof aosObserver !== 'undefined') {
    container.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
  }

  dpLog(`✅ ${books.length} öne çıkan kitap render edildi!`);
}

// DOMContentLoaded'da çalıştır
runWhenDomReady(function () {
  renderFeaturedBooks();
  renderBooksFromStrapi(); // kitaplar.html için
});




// Hoca'nın detaylarını göster (Kamplar + Kitaplar dahil)
// showInstructorDetails artık showInstructorDetailsPanel'e yönlendirir
async function showInstructorDetails(instructor, idx) {
  return showInstructorDetailsPanel(instructor);
}


async function showInstructorDetailsPanel(instructor) {
  const panel = document.getElementById('instructorExpandPanel');
  if (!panel) return;

  // Loading göster
  panel.innerHTML = '<div class="exp-inner" style="justify-content:center;padding:40px;"><p style="color:var(--muted)">Yükleniyor...</p></div>';
  panel.style.display = 'block';
  requestAnimationFrame(() => { panel.classList.add('open'); });

  try {
    // Strapi şeması:
    // Instructor: name, photo(Media), youtube, instagram, camps(m2m→Camp), subject(m2o→Subject)
    // Camp: title, introVideo, playlist, lessons(Component), books(m2m→Book), subject(m2o)
    // Book: title, cover(Media), buy_link, solution_link, camps(m2m)
    // Subject: name
    //
    // Deep populate: camps→books→cover, camps→lessons, subject, photo
    // Strapi v5: documentId ile tekil endpoint VEYA filtreli liste endpoint
    // Filtreli liste endpoint hem v4 hem v5'te çalışır
    const populateQuery = [
      'populate[photo][fields][0]=url',
      'populate[photo][fields][1]=formats',
      'populate[subjects][fields][0]=name',
      'populate[books][populate][cover][fields][0]=url',
      'populate[books][populate][cover][fields][1]=formats',
      'populate[books][fields][0]=title',
      'populate[books][fields][1]=buy_link',
      'populate[books][fields][2]=solution_link',
      'populate[camps][populate][books][populate][cover][fields][0]=url',
      'populate[camps][populate][books][populate][cover][fields][1]=formats',
      'populate[camps][populate][books][fields][0]=title',
      'populate[camps][populate][books][fields][1]=buy_link',
      'populate[camps][populate][books][fields][2]=solution_link',
      'populate[camps][populate][lessons][fields][0]=title',
      'populate[camps][populate][lessons][fields][1]=day',
      'populate[camps][populate][lessons][fields][2]=youtube',
      'populate[camps][fields][0]=title',
      'populate[camps][fields][1]=introVideo',
      'populate[camps][fields][2]=playlist',
      'populate[camps][fields][3]=slug',
    ].join('&');

    // Önce documentId ile tekil endpoint dene, 404 dönerse filtreli liste endpoint kullan
    let detailJson;
    const docId = instructor.documentId || instructor.id;

    // Yöntem 1: documentId ile tekil endpoint
    let detailRes = await fetch(
      `${STRAPI_URL}/instructors/${docId}?${populateQuery}`,
      { headers: strapiHeaders }
    );
    detailJson = await detailRes.json();

    // 404 veya hata dönerse → filtreli liste endpoint dene
    if (detailJson.error || !detailJson.data) {
      dpLog("⚠️ Tekil endpoint başarısız, filtreli liste deneniyor...");
      detailRes = await fetch(
        `${STRAPI_URL}/instructors?filters[id][$eq]=${instructor.id}&${populateQuery}`,
        { headers: strapiHeaders }
      );
      detailJson = await detailRes.json();
      dpLog("📦 Filtreli liste RAW:", detailJson);
      // Liste endpoint → data bir array, ilk elemanı al
      if (Array.isArray(detailJson.data) && detailJson.data.length > 0) {
        detailJson = { data: detailJson.data[0] };
      }
    }

    dpLog("📦 Hoca detay RAW:", JSON.stringify(detailJson, null, 2));

    // Strapi v4: data.attributes || Strapi v5/flat: data doğrudan
    const d = detailJson.data?.attributes || detailJson.data || detailJson;
    dpLog("📦 Hoca detay PARSED (d):", d);
    dpLog("📦 d.camps:", d.camps);
    dpLog("📦 d.camps?.data:", d.camps?.data);

    // Fotoğraf URL
    const photoObj = d.photo?.data?.attributes || d.photo;
    let imgUrl = 'https://via.placeholder.com/100';
    if (photoObj?.formats?.thumbnail?.url) {
      imgUrl = fixImgUrl(photoObj.formats.thumbnail.url);
    } else if (photoObj?.url) {
      imgUrl = fixImgUrl(photoObj.url);
    } else if (instructor.image?.url) {
      imgUrl = fixImgUrl(instructor.image.url);
    }

    // Subject (relation → Subject model → name field)
    // subjects: oneToMany → array
    const subjectsRaw = d.subjects?.data || d.subjects || [];
    const subjectsArr = Array.isArray(subjectsRaw) ? subjectsRaw : [subjectsRaw];
    const firstSubject = subjectsArr[0]?.attributes || subjectsArr[0];
    const subjectName = firstSubject?.name || instructor.subject?.name || 'Konu Yok';

    // YouTube & Instagram
    const youtubeUrl = d.youtube || instructor.youtube_url || '';
    const instagramUrl = d.instagram || instructor.instagram_url || '';

    // ===== KAMPLAR =====
    // camps relation: v4 → d.camps.data[], flat → d.camps[]
    let rawCamps = d.camps?.data || d.camps || [];
    // Eğer camps bir array değilse boş array yap
    if (!Array.isArray(rawCamps)) rawCamps = [];
    dpLog("🎬 Kamplar (rawCamps):", rawCamps, "uzunluk:", rawCamps.length);

    const MAX_PANEL_CAMPS = 3;
    const campCards = rawCamps.slice(0, MAX_PANEL_CAMPS).map(camp => {
      const c = camp.attributes || camp;
      const videoIdC = extractYouTubeId(c.introVideo || '');
      const title = c.title || 'Kamp';
      const playlistUrl = extractPlaylistId(c.playlist || '');
      const campSlugVal = c.slug || slugify(c.title || '');
      const url = campSlugVal ? `/egitim/${campSlugVal}` : (videoIdC ? `/egitim?v=${videoIdC}&list=${playlistUrl}` : '#');
      const thumbSrc = videoIdC
        ? `https://img.youtube.com/vi/${videoIdC}/hqdefault.jpg`
        : 'https://via.placeholder.com/320x180?text=Kamp';
      return `
              <a href="${url}" class="exp-camp-card">
                <div class="exp-camp-thumb">
                  <img src="${thumbSrc}" alt="${getImgAlt('camp', c.documentId||camp.documentId||camp.id, c.title||'Kamp')}" loading="lazy">
                  <div class="exp-camp-play">▶</div>
                </div>
                <span class="exp-camp-title">${title}</span>
              </a>`;
    }).join('');
    const moreCampsNote = rawCamps.length > MAX_PANEL_CAMPS
      ? `<div style="text-align:center;margin-top:8px;font-size:0.78rem;color:var(--text-muted)">+${rawCamps.length - MAX_PANEL_CAMPS} kamp daha</div>`
      : '';

    // ===== KİTAPLAR (doğrudan books + kamplar üzerinden) =====
    const seenBookIds = new Set();
    const allBooks = [];

    // Yardımcı: kitabı listeye ekle (tekrar kontrolü ile)
    function addBook(book) {
      const b = book.attributes || book;
      const bookId = book.id || b.id;
      if (bookId && seenBookIds.has(bookId)) return;
      if (bookId) seenBookIds.add(bookId);

      let coverUrl = null;
      const cover = b.cover?.data?.attributes || b.cover;
      if (cover?.formats?.small?.url) coverUrl = fixImgUrl(cover.formats.small.url);
      else if (cover?.formats?.thumbnail?.url) coverUrl = fixImgUrl(cover.formats.thumbnail.url);
      else if (cover?.url) coverUrl = fixImgUrl(cover.url);

      allBooks.push({
        id: bookId,
        title: escHtml(b.title || 'Kitap'),
        cover: safeImgSrc(coverUrl ? `${coverUrl}` : '', 'https://via.placeholder.com/120x170?text=Kitap'),
        buy_link: safeHref(b.buy_link || "/kitaplar", '/kitaplar'),
        demo_link: safeHref(b.solution_link || "", ""),
      });
    }

    // 1) Instructor → books (doğrudan ilişki)
    const directBooks = d.books?.data || d.books || [];
    if (Array.isArray(directBooks)) directBooks.forEach(addBook);

    // 2) Instructor → camps → books
    rawCamps.forEach(camp => {
      const c = camp.attributes || camp;
      const bks = c.books?.data || c.books || [];
      if (Array.isArray(bks)) bks.forEach(addBook);
    });
    dpLog("📚 Kitaplar:", allBooks);

    const booksHtml = allBooks.length > 0
      ? allBooks.map(b => `
                <div class="book-item exp-book-item">
                  <div class="book-cover-wrap">
                    <img src="${b.cover}" alt="${b.title}" loading="lazy">
                  </div>
                  <div class="book-details">
                    <h4>${b.title}</h4>
                    <a href="${b.buy_link}" class="btn-buy-book" target="_blank" rel="noopener">📦 Satın Al ↗</a>
                    ${b.demo_link ? `<a href="${b.demo_link}" class="btn-demo-book" target="_blank" rel="noopener">🔎 Kitabı İncele</a>` : ''}
                  </div>
                </div>`).join('')
      : '';

    const safeImg = safeImgSrc(imgUrl, 'https://via.placeholder.com/96');
    const safeInstructorName = escHtml(d.name || instructor.name || 'Ogretmen');
    const safeSubjectName = escHtml(subjectName || 'Ogretmen');
    const safeYoutubeUrl = safeHref(youtubeUrl || '', '');
    const safeInstagramUrl = safeHref(instagramUrl || '', '');
    const hocaPageSlug = d.slug || slugify(d.name || instructor.name || '');
    const hocaPageUrl = `/hoca/${hocaPageSlug}`;

    // ===== PANEL HTML =====
    const panelHTML = `
            <div class="exp-inner">
              <button class="exp-close" id="expCloseBtn" aria-label="Kapat">×</button>
              <div class="exp-left">
                <img src="${safeImg}" alt="${safeInstructorName}" class="exp-photo" loading="lazy">
                <div class="exp-subject-tag">${safeSubjectName}</div>
                <a href="${hocaPageUrl}" class="exp-btn" style="margin-top:12px;font-size:0.75rem;text-align:center;justify-content:center;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:#3b82f6;border-radius:8px;padding:7px 12px;display:flex;gap:6px;text-decoration:none">Tüm İçerikleri Gör ↗</a>
              </div>
              <div class="exp-right">
                <h3 class="exp-name">${safeInstructorName}</h3>
                <div class="exp-socials">
                  ${safeYoutubeUrl ? `<a href="${safeYoutubeUrl}" target="_blank" rel="noopener" class="exp-btn exp-btn-yt">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/></svg>
                    YouTube Kanalı
                  </a>` : ''}
                  ${safeInstagramUrl ? `<a href="${safeInstagramUrl}" target="_blank" rel="noopener" class="exp-btn exp-btn-ig">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.6.1 4.7s0 3.4-.1 4.7c-.2 3.3-1.7 4.8-5 5-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.2-4.8-1.7-5-5C2 15.6 2 15.3 2 12s0-3.4.1-4.7c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7 .1 2.7.3.3 2.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c.2 4.3 2.6 6.7 7 6.9 1.3.1 1.7.1 5 .1s3.7 0 5-.1c4.3-.2 6.7-2.6 6.9-7C24 15.7 24 15.3 24 12s0-3.7-.1-5c-.2-4.3-2.6-6.7-7-6.9C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>
                    Instagram
                  </a>` : ''}
                </div>
                ${campCards ? `<div class="exp-camps-label">🎬 Kamplar</div><div class="exp-camps-scroll">${campCards}</div>${moreCampsNote}` : ''}
                ${booksHtml ? `<div class="exp-camps-label" style="margin-top:16px">📚 Kitaplar</div><div class="exp-books-scroll">${booksHtml}</div>` : ''}
                ${!campCards && !booksHtml ? '<p style="color:var(--muted);margin-top:12px;">Bu hocanın henüz kampı veya kitabı yok.</p>' : ''}
              </div>
            </div>`;

    panel.innerHTML = panelHTML;
    setTimeout(() => { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);

    // Close button
    document.getElementById('expCloseBtn').addEventListener('click', () => {
      panel.classList.remove('open');
      setTimeout(() => { panel.innerHTML = ''; panel.style.display = 'none'; }, 400);
    });
  } catch (err) {
    dpError("❌ Hoca detayları çekme hatası:", err);
    panel.innerHTML = '<div class="exp-inner" style="justify-content:center;padding:40px;"><p style="color:#dc2626;">Veriler yüklenemedi. Lütfen tekrar deneyin.</p></div>';
  }
}




// ===== YOUTUBER HOCALARIMIZ SAYFA RENDER =====
async function renderYoutuberGrid() {
  const grid = document.getElementById('youtuberGrid');
  if (!grid) return;

  const instructors = await getInstructorsFromStrapi();

  if (!instructors || instructors.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-secondary);">Henüz hoca eklenmemiş.</div>';
    return;
  }

  let html = '';
  instructors.forEach((instructor, idx) => {
    const imgUrl = safeImgSrc(fixImgUrl(instructor.image?.url ? `${instructor.image.url}` : ''), 'https://via.placeholder.com/140');
    const instructorName = escHtml(instructor.name || 'Adsiz');
    const subjectName = escHtml(instructor.subject?.name || '');

    html += `
      <div class="story-item" data-idx="${idx}" data-instructor-id="${instructor.id}">
        <div class="story-ring">
          <img src="${imgUrl}" alt="${instructorName}" class="story-img"
               onerror="this.parentElement.innerHTML='<div class=story-fallback style=display:flex>👨‍🏫</div>'">
        </div>
        <span class="story-name">${instructorName}</span>
        ${subjectName ? `<span class="story-subject">${subjectName}</span>` : ''}
      </div>`;
  });

  grid.innerHTML = html;

  grid.querySelectorAll('.story-item').forEach(item => {
    let touchStartX = 0, touchStartY = 0, wasDragged = false;
    item.addEventListener('touchstart', function (e) {
      const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY; wasDragged = false;
    }, { passive: true });
    item.addEventListener('touchmove', function (e) {
      const t = e.touches[0];
      if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) wasDragged = true;
    }, { passive: true });
    item.addEventListener('click', function () {
      if (wasDragged) { wasDragged = false; return; }
      const instructorId = this.getAttribute('data-instructor-id');
      const instructor = instructors.find(i => i.id == instructorId);
      if (!instructor) return;
      window.location.href = '/hoca/' + (instructor.slug || '');
    });
  });

  window.addEventListener('resize', () => {});
  dpLog(`✅ Youtuber grid: ${instructors.length} hoca render edildi`);
}

function bootstrapHomeDynamicSections() {
  const storyContainer = document.getElementById('storyScroll');
  const featuredBooksContainer = document.getElementById('featured-books-container');

  if (storyContainer) {
    renderStoryScroll();
  }

  if (featuredBooksContainer) {
    renderFeaturedBooks();
  }

  // Script gec yuklendiginde veya yavas agda ilk render kacarsa yeniden dener.
  setTimeout(() => {
    if (storyContainer && !storyContainer.querySelector('.story-item')) {
      renderStoryScroll();
    }
    if (featuredBooksContainer && !featuredBooksContainer.querySelector('.book-item')) {
      renderFeaturedBooks();
    }
  }, 500);

  setTimeout(() => {
    if (storyContainer && !storyContainer.querySelector('.story-item')) {
      renderStoryScroll();
    }
    if (featuredBooksContainer && !featuredBooksContainer.querySelector('.book-item')) {
      renderFeaturedBooks();
    }
  }, 1500);
}

runWhenDomReady(function () {
  bootstrapHomeDynamicSections();
  renderYoutuberGrid();
});

})();
