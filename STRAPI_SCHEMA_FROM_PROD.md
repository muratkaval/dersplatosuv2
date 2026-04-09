# Canli Siteden Cikarilan Strapi Semasi

Bu dokuman, canli frontend kodundaki API cagrilarindan ve kullanilan alanlardan cikarilmistir.

Incelenen kaynak:
- _dersplatosu_main.js

## 1) Collection type: camps

Alanlar:
- title (string, zorunlu)
- slug (title uzerinden uid veya string, zorunlu, benzersiz)
- introVideo (string, YouTube URL veya ID)
- playlist (string, YouTube playlist URL veya ID)
- cover (media, tekli gorsel)

Iliskiler:
- categories (many-to-many -> categories)
- subject (many-to-one -> subjects)
- instructors (many-to-many -> instructors)
- books (many-to-many -> books) (hoca detayinda deep populate ile kullaniliyor)

Component / tekrarli alan:
- lessons (repeatable component: lesson-item)

Beklenen lesson-item alanlari:
- title (string)
- day (string veya integer)
- youtube (string)

Kullanildigi yerler:
- Anasayfa hero slider
- Anasayfa kategori bolumleri
- Kamp detay linkleri (/egitim/[slug])
- Hoca detay paneli

## 2) Collection type: instructors

Alanlar:
- name (string, zorunlu)
- slug (uid veya string)
- youtube (string)
- instagram (string)
- displayOrder (integer) (artan siralama icin kullaniliyor)
- photo (media, tekli gorsel)

Iliskiler:
- subjects (many-to-many -> subjects)
- camps (many-to-many -> camps)
- books (many-to-many -> books)

Kullanildigi yerler:
- Anasayfa story/hoca listesi
- Hoca detay paneli
- Kamp kartlarindaki hoca rozetleri

## 3) Collection type: books

Alanlar:
- title (string, zorunlu)
- buy_link (string)
- solution_link (string)
- featured (boolean)
- cover (media, tekli gorsel)

Iliskiler:
- subjects (many-to-many -> subjects)
- camps (many-to-many -> camps)

Kullanildigi yerler:
- One cikan kitaplar alani (featured=true)
- Kitap listesi ve hoca detay sayfasi

## 4) Collection type: categories

Alanlar:
- name (string, zorunlu)
- displayOrder (integer)

Iliskiler:
- camps (many-to-many -> camps)

Kullanildigi yerler:
- Anasayfadaki kamp bolumlerini kategoriye gore gruplama
- Opsiyonel kategori siralamasi

## 5) Collection type: subjects

Alanlar:
- name (string, zorunlu)

Iliskiler:
- camps (camps.subject iliskisinin tersi, one-to-many)
- instructors (many-to-many)
- books (many-to-many)

Kullanildigi yerler:
- Kamp kartlarinda ders etiketi
- Hoca alan etiketi
- Kitap konu etiketi/filtre

## 6) Collection type: pages

Alanlar:
- slug (string, zorunlu, benzersiz)
- content (uzun metin / JSON metin, zorunlu)

Kritik kayit:
- slug = site-nav-footer-config

Beklenen content JSON formati:

```json
{
  "nav": [
    { "label": "Ana Sayfa", "url": "/" }
  ],
  "footer": [
    {
      "title": "Platform",
      "links": [
        { "label": "Ana Sayfa", "url": "/" }
      ]
    }
  ],
  "brand": [
    {
      "name": "Ders Platosu",
      "desc": "Platform aciklamasi",
      "logo": "https://...",
      "url": "/"
    }
  ],
  "ordering": {
    "campIds": ["<camp documentId>", "<camp documentId>"],
    "categoryIds": ["<category documentId>", "<category documentId>"]
  }
}
```

Kullanildigi yerler:
- Ortak navbar linkleri
- Ortak footer sutunlari/brand
- Anasayfada kamp ve kategori manuel siralamasi

## Frontend tarafinda kullanilan API endpointleri

- GET /api/camps
  - fields: title, introVideo, playlist, slug
  - populate: categories(name), subject(name), lessons(title,day,youtube), instructors(name,photo), cover(url,formats)

- GET /api/instructors
  - populate: photo(url,formats), subjects(name)
  - sort: displayOrder:asc

- GET /api/instructors/:id veya filtreli sorgu
  - deep populate for subjects, books(cover,title,buy_link,solution_link), camps(books,lessons,title,introVideo,playlist,slug)

- GET /api/books
  - populate: cover(url,name), subjects(name)

- GET /api/books?filters[featured][$eq]=true
  - populate: cover(url,name), subjects(name)

- GET /api/pages?filters[slug][$eq]=site-nav-footer-config
  - content JSON okunur ve parse edilir

## Temiz kurulum icin onerilen olusturma sirasi

1. Collection type'lari olustur: categories, subjects, books, instructors, camps, pages
2. Component olustur: lesson-item
3. Media alanlarini ekle (cover/photo)
4. Tum iliskileri ekle
5. pages icinde slug'i site-nav-footer-config olan ve gecerli JSON content iceren bir kayit ac
6. Once categories ve subjects, sonra instructors/books, en son camps verilerini gir

## UI kirilmamasi icin minimum zorunlu alanlar

- camps: title, slug, introVideo or cover, categories, subject
- instructors: name, photo
- books: title, cover, buy_link (opsiyonel ama CTA icin bekleniyor)
- pages: slug=site-nav-footer-config, content JSON (olmazsa frontend varsayilanlara duser)
