# Ders Platosu Backend Redesign Plan (UI Sabit)

## 1) Mevcut Durum Ozeti

Bu projede UI tarafi korunacak, sadece veri katmani ve arka plan mimarisi yenilenecek.

Tespit edilen ana noktalar:

- Frontend ve admin dogrudan Strapi endpointlerine baglaniyor.
- Admin is mantigi tek dosyada toplu halde duruyor (buyuk inline script).
- Sitemap icin iki farkli mekanizma var (script + API sunucusu), gorevler ayrik degil.
- SEO ayarlari gibi kritik site konfigurasyonlari tarayici `localStorage` uzerinde tutuluyor.
- API sorgularinda fallback yaklasimi var ama merkezi hata yonetimi yok.

## 2) Veri Envanteri (Mevcut Koleksiyonlar)

Admin panelde aktif kullanilan koleksiyonlar:

- `camps`
- `books`
- `solution-videos`
- `instructors`
- `categories`
- `book-categories`
- `subjects`
- `pages`

Iliski ozetleri:

- `camps` -> instructors, categories, subject, lessons
- `books` -> instructors, subjects, solution_categories, cover
- `solution-videos` -> book
- `instructors` -> subjects, photo
- `pages` -> nav/footer/seo gibi yapiyi da tasiyabiliyor

## 3) Sorunlar (Neden Yeni Mimari)

- Guvenlik: Public tarafta dogrudan CMS baglantisi ve token dagitimi riski.
- Bakim: Is kurallari sayfalara dagilmis, test etmesi zor.
- Performans: Benzer veriler birden cok yerde tekrar tekrar cekiliyor.
- Operasyon: Sitemap/SEO/content yayin akisi tek pipeline uzerinde degil.

## 4) Hedef Mimari (UI Degismeden)

UI sayfalari ayni kalacak. Araya bir BFF (Backend for Frontend) katmani eklenecek.

Mimari katmanlar:

1. `Web UI (degismeyecek)`
2. `BFF API (yeni)`
3. `CMS Adapter (Strapi adapter)`
4. `Domain Services (kamp, kitap, hoca, seo, sitemap)`
5. `Cache + Background Jobs`

Hedef kurallar:

- Browser hicbir zaman Strapi token bilmeyecek.
- UI sadece BFF endpointlerini cagiracak.
- Tum veri donusumleri BFF tarafinda normalize edilecek.
- Sitemap, SEO sync ve yeniden olusturma job ile yonetilecek.

## 5) Onerilen Klasorleme (Yeni)

```
/backend
  /src
    /api
      camps.routes.js
      books.routes.js
      instructors.routes.js
      pages.routes.js
      settings.routes.js
      sitemap.routes.js
    /domain
      camps.service.js
      books.service.js
      instructors.service.js
      pages.service.js
      settings.service.js
      sitemap.service.js
    /adapters
      strapi.client.js
      strapi.mapper.js
    /infra
      cache.js
      logger.js
      env.js
      errors.js
    /jobs
      sitemap.job.js
      seo-sync.job.js
    app.js
    server.js
```

## 6) Endpoint Kontrati (UI Icin)

Public:

- `GET /v1/camps`
- `GET /v1/camps/:slug`
- `GET /v1/books`
- `GET /v1/instructors`
- `GET /v1/pages/:slug`
- `GET /v1/settings/seo`

Admin:

- `POST /v1/admin/login`
- `POST /v1/admin/sitemap/generate`
- `PUT /v1/admin/navigation`
- CRUD endpointleri (role-based auth ile)

## 7) Gecis Plani (Risksiz)

1. BFF'i read-only endpointlerle ayağa kaldir.
2. Bir sayfayi (or. kamp listesi) BFF'e yonlendir.
3. Caching ve gozlemleme (log + metric) ekle.
4. Admin aksiyonlarini adim adim BFF'e tas.
5. Sitemap ve SEO islemlerini background job'a al.
6. Strapi direct cagrilarini kaldir.

## 8) Uyumluluk Notlari

- UI siniflari, HTML yapisi, CSS ve component hiyerarsisi korunacak.
- Sadece data source URL ve veri getirme fonksiyonlari degisecek.
- Cikti JSON alanlari bugunku UI beklentileriyle birebir uyumlu olacak.

## 9) Basari Kriterleri

- UI'da gorunur fark olmamasi.
- TTFB ve veri cekme hatalarinda dusus.
- Admin islemlerinde merkezi auth/log.
- Tek komutla sitemap yenileme ve izlenebilirlik.

## 10) Ilk Teknik Sprint (onerilen)

- Sprint-1:
  - BFF bootstrap (Node + Express veya Fastify)
  - `/v1/camps`, `/v1/books`, `/v1/instructors`, `/v1/pages/:slug`
  - Basit memory cache ve hata normalize
- Sprint-2:
  - Admin login + admin protected routes
  - sitemap generate endpoint + job queue
  - feature flag ile kademeli gecis

## 11) Blue-Green Gecis (Yeni Strapi + Test Domain)

Evet, mevcut canli sistemi bozmadan sifirdan kurulup test edilmis yeni mimariye gecilebilir.

Hedef akış:

1. Green ortami ac: yeni Strapi + yeni Next.js + yeni DB
2. Mevcut Strapi verisini Green ortamina klonla
3. Test domainde butun akislari dogrula
4. DNS/Nginx yonlendirmesi ile ana domaine Green ortami al
5. Kisa bir sure Blue (eski) ortami yedek beklet, sonra kapat

Ornek domain stratejisi:

- Production (Blue): `dersplatosu.com`
- Staging/Test (Green): `next-test.dersplatosu.com`
- Opsiyonel CMS test: `cms-next-test.dersplatosu.com`

## 12) Strapi Klonlama Stratejisi

Klonlama kapsamı:

- Content Type schema ve component yapilari
- Roller/izinler
- Icerik verisi (tum koleksiyonlar)
- Uploads/media dosyalari
- Webhook ve API token ayarlari

Gecis sirasi:

1. Yeni Strapi projesini ayri klasorde kur
2. Ayni collection type yapisini import et (veya migration script)
3. Eski DB -> yeni DB veri aktarimi yap
4. Upload klasorunu rsync/scp ile tası
5. Yeni ortamda media URL ve permission kontrolu yap

Not:

- Veri aktarimi icin maintenance penceresinde son incremental sync yapilmasi tavsiye edilir.
- Strapi surum farki varsa (v4/v5), once schema uyumlulugu dogrulanmalidir.

## 13) Test Domain Dogrulama Checklist

Fonksiyonel:

1. Kamp listesi, kamp detay, kitaplar, hocalar, dinamik sayfalar calisiyor mu?
2. Admin panel CRUD islemleri sorunsuz mu?
3. Sitemap endpoint ve robots/sitemap URL'leri dogru mu?

SEO:

1. SSR ciktisinda title, description, canonical mevcut mu?
2. Open Graph ve Twitter etiketleri dogru mu?
3. JSON-LD schema valid mi?
4. 404 ve redirect akislari dogru mu?

Performans:

1. LCP/CLS/INP metrikleri kabul edilebilir mi?
2. Cache hit orani ve TTFB duzeldi mi?

Operasyon:

1. Loglama, error tracking, healthcheck aktif mi?
2. Yedekleme ve rollback senaryosu test edildi mi?

## 14) Cutover ve Rollback Plani

Cutover:

1. Icerik freeze (kisa sureli)
2. Son incremental veri senkronu
3. DNS/Nginx upstream'i Green ortama al
4. Smoke test (ana akışlar)
5. Freeze kaldir

Rollback (gerekirse):

1. DNS/Nginx'i Blue ortama geri al
2. Green ortamda hata analizi yap
3. Duzeltme sonrasi test domainde yeniden dogrula

SLA hedefi:

- Downtime: 0 veya minimale yakin (yalnizca kisa icerik freeze)

## 15) Bu Proje Icin Net Oneri

Asagidaki adimla baslayin:

1. Yeni Strapi + yeni DB + test domain kur
2. Mevcut veriyi klonla
3. Next.js frontendi test domaine bagla
4. SEO/perf checklistini tamamla
5. Ana domaine blue-green cutover yap

Bu yaklasimla canli siteniz calismaya devam ederken yeni mimariyi guvenli sekilde bitirip tek geciste yayina alabilirsiniz.
