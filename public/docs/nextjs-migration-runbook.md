# Ders Platosu Next.js + Strapi Gecis Runbook

Bu dokuman, canli siteyi bozmadan yeni mimariye gecis icin adim adim uygulama planidir.

## Hedef

- Once local ortamda yeni Strapi + Next.js'i calistir
- Tum akislari localde dogrula
- Mevcut Blue ortami calismaya devam edecek
- Green ortaminda yeni Strapi + Next.js kurulacak
- Test domainde dogrulanip ana domaine gecilecek

## Asama L0 - Local Hazirlik (yarim gun)

1. Gerekli kurulumlari kontrol et
- Node.js 20+
- npm 10+
- Docker Desktop (onerilir)

2. Local klasor yapisi

PowerShell:

  mkdir C:\dp-local
  cd C:\dp-local
  mkdir cms
  mkdir web

3. Port plani
- Strapi: 1340
- Next.js: 3010

## Asama L1 - Local Strapi Kurulumu (1 gun)

1. Local Strapi olustur

PowerShell:

  cd C:\dp-local\cms
  npx create-strapi-app@latest . --no-run
  npm install

2. Local env ayarla
- APP_KEYS
- API_TOKEN_SALT
- ADMIN_JWT_SECRET
- JWT_SECRET
- DB bilgileri (local sqlite veya local postgres)

3. Strapi calistir

  npm run develop

4. Local API kontrol
- http://localhost:1340/admin
- http://localhost:1340/api/camps

## Asama L2 - Mevcut Veriyi Local Klonlama (1 gun)

1. Mevcut (Blue) Strapi yedek al
- DB dump
- uploads klasoru

2. Local Strapi'ye import et
- DB restore
- uploads klasorunu local public uploads altina kopyala

3. Dogrulama
- camps, books, instructors, pages kayit sayilari
- media dosyalari aciliyor mu

## Asama L3 - Local Next.js Kurulumu (1 gun)

1. Next.js proje kur

PowerShell:

  cd C:\dp-local\web
  npx create-next-app@latest .
  npm install zod axios

2. Local env
- NEXT_PUBLIC_SITE_URL=http://localhost:3010
- STRAPI_URL=http://localhost:1340
- STRAPI_TOKEN=server-side only

3. Ilk route yapisi
- /
- /egitim
- /egitim/[slug]
- /kitaplar
- /hoca/[slug]
- /sayfa/[slug]

4. Next.js calistir

  npm run dev

## Asama L4 - Local SEO ve Performans Dogrulama (1 gun)

1. SSR HTML kontrol
- Tarayicida View Source ile icerik dolu mu

2. Metadata kontrol
- title, description, canonical
- Open Graph ve Twitter etiketleri

3. Teknik SEO
- /sitemap.xml
- /robots.txt
- JSON-LD

4. Performans
- Lighthouse local raporu

## Asama L5 - Local Exit Criteria

Local asama tamam sayilir, eger:

1. Tum ana sayfalar localde sorunsuz aciliyorsa
2. Google icin SSR metadata dogruysa
3. Strapi CRUD akislari bozulmadiysa
4. Hata loglari kontrol altindaysa

## Asama 0 - Sunucuya Gecis Hazirligi (1 gun)

1. Envanter cikar
- Domainler
- Sunucu IP ve kaynaklar
- Mevcut Strapi surumu
- Mevcut DB tipi (PostgreSQL, MySQL, SQLite)
- Mevcut upload klasoru yolu

2. Yeni test domain ac
- next-test.dersplatosu.com
- opsiyonel cms-next-test.dersplatosu.com

3. Cevresel degiskenleri belgeye al
- APP_KEYS
- API_TOKEN_SALT
- ADMIN_JWT_SECRET
- JWT_SECRET
- DB baglanti bilgileri
- CDN ve medya URL

## Asama 1 - Green Strapi Kurulumu (1-2 gun)

1. Yeni sunucuda Strapi kur

PowerShell ornek adimlari:

  mkdir C:\deploy\dp-green
  cd C:\deploy\dp-green
  npx create-strapi-app@latest cms --no-run
  cd cms

2. Veritabani baglantisini ayarla
- Production icin PostgreSQL onerilir
- Yeni DB ac: dp_green

3. Strapiyi ayaga kaldir

  npm install
  npm run build
  npm run start

4. Reverse proxy ayarla
- cms-next-test.dersplatosu.com -> Green Strapi

## Asama 2 - Veri Klonlama (1 gun)

1. Blue Strapi yedek al
- DB dump
- Upload klasoru yedegi

2. Green DB'ye geri yukle
- Dump import

3. Upload dosyalarini tasi
- rsync/scp ile uploads klasoru kopyala

4. Strapi panelinden kontrol et
- collection type sayisi
- iliskiler
- media dosyalari
- roller ve izinler

Not:
- Strapi major surum farki varsa once stagingde migration testi yap.

## Asama 3 - Next.js Proje Kurulumu (1 gun)

1. Yeni frontend projesi ac

  cd C:\deploy\dp-green
  npx create-next-app@latest web
  cd web

2. Temel paketler

  npm install zod axios

3. Env dosyasi
- NEXT_PUBLIC_SITE_URL=https://next-test.dersplatosu.com
- STRAPI_URL=https://cms-next-test.dersplatosu.com
- STRAPI_TOKEN=server-side only

4. Route yapisi
- /
- /egitim
- /egitim/[slug]
- /kitaplar
- /hoca/[slug]
- /sayfa/[slug]

## Asama 4 - Veri Katmani ve SEO (2-3 gun)

1. Strapi client katmani yaz
- Tum fetch islemleri server side
- Hata normalize
- timeout ve retry

2. ISR/Cache ekle
- Kamp listesi 5-15 dk revalidate
- Detay sayfalari 15-60 dk revalidate

3. SEO katmani
- Her sayfada title, description, canonical
- Open Graph etiketleri
- JSON-LD
- sitemap.xml ve robots.txt

4. Strapi webhook bagla
- Icerik guncellenince revalidate cagir

## Asama 5 - Test Domain Dogrulama (1-2 gun)

1. Fonksiyonel test
- Kamp listesi
- Kamp detay
- Kitap listesi
- Hoca detay
- Dinamik sayfa

2. SEO test
- View source ile meta etiket kontrol
- Lighthouse SEO
- Rich Results test

3. Performans test
- LCP, CLS, INP
- TTFB ve cache hit

4. Operasyon test
- Health endpoint
- Log ve error tracking

## Asama 6 - Cutover (Yayin gecisi, 1-2 saat)

1. Kisa icerik freeze acikla (ornek 30 dk)
2. Son veri senkronu yap
3. Nginx veya DNS yonlendirmesini Green ortama al
4. Smoke test yap
5. Freeze kapat

## Asama 7 - Rollback Plani (zorunlu)

1. Sorun olursa yonlendirmeyi Blue ortama geri al
2. Green hata loglarini incele
3. Duzelt ve test domainde yeniden dogrula

## Gun Gun Uygulama Onerisi

Gun 1
- Hazirlik, domain, env, sunucu

Gun 2
- Green Strapi kurulum + DB

Gun 3
- Veri ve uploads klonlama

Gun 4
- Next.js iskelet + route yapisi

Gun 5-6
- Strapi data integration + SEO

Gun 7
- Test domain QA

Gun 8
- Cutover

## Kabul Kriterleri

- UI gorunum farki yok
- Google bot SSR icerigi goruyor
- Sitemap ve canonical dogru
- 500/404 oranlari artmiyor
- Rollback 15 dakika altinda uygulanabilir
