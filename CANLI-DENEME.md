# Canlı Deneme — Net Eşleştirme Sistemi

Öğrenci canlı deneme netlerini girer; branş netlerinin eşik değerlerine göre
hazır programlardan birine yönlendirilir.

- **Public sayfa:** `/canli-deneme`
- **Rota detayı:** `/canli-deneme/[slug]`
- **Panel:** `/admin/canli-deneme`

---

## Temel kararlar

**1. Eşleştirme kodda değil, veride.**
Her programa panelden branş etiketleri girilir (`altı`/`üstü`). Öğrencinin
netleri aynı etiketlere çevrilir ve eşleşen program gösterilir. Kodda sabit
bir `if (mat < 15)` tablosu **yok** — bir rota yanlış eşleşirse panelden
düzeltilir, deploy gerekmez.

**2. Mevcut `program` content-type'ı kullanılıyor, yeni tip açılmadı.**
Böylece PDF, video, kapak görseli ve medya yükleme altyapısı hazır geldi.

**3. Program girişi tamamen Canlı Deneme içinde.**
Programlar sayfasına hiç uğranmıyor; iki mantık birbirine değmiyor.

**4. Branş sayısı sabit değil.**
Sosyal kapalıyken 3 branş → 2³ = **8** program. Açıldığında 4 branş → 2⁴ =
**16** program. Panelden anahtarla açılıp kapanır, kod değişmez.

> Not: Yapay zekâ ile üretilen tasarım mockup'ındaki Rota A–H harf sıralaması
> Google Docs başlıklarıyla **uyuşmuyor** — mockup harfleri kendi ikili sayma
> sırasına göre dizmiş. Doğru eşleştirme panelden girilen.

## Eşikler

| Branş | Eşik | Not |
|---|---|---|
| Matematik | 15 | `net >= 15` → **üstü** |
| Türkçe | 20 | `net >= 20` → **üstü** |
| Fen | 10 | `net >= 10` → **üstü** |
| Sosyal | 10 | Varsayılan olarak **kapalı** — net alınır, programı etkilemez |

Eşikler ve Sosyal anahtarı `global-setting.liveExamConfig` içinde, panelden
değişir. Net değerleri çeyrekli olabilir (12,5 gibi).

## Mevcut programlardan ayrışma

Bu rotalar sitedeki normal programlarla karışmaz — üç katman:

1. `routeCode` boş olan her program sistemin dışındadır → mevcut programlar
   hiç etkilenmez.
2. `/programlar` listesi, `isLiveExamRelated()` ile rota programlarını
   dışarıda bırakır (kod seviyesinde; panelde yanlış kategori seçilse bile
   sızmaz).
3. Rota programlarının `examType` değeri sabit `"Canlı Deneme"` — bir rota
   slottan çıkarılıp etiketleri temizlense bile normal listeye düşmez.

Panel program tablosunda rota programları **"Rota A"** rozetiyle görünür.

---

## Fazlar

### FAZ 0 — Analiz ve karar ✅
- Mimari seçildi, mockup ↔ Google Docs harf uyuşmazlığı tespit edildi.
- Eksik kombinasyon belirlendi: **MAT ÜSTÜ – TÜRKÇE ALTI – FEN ÜSTÜ**
  (Google Docs'ta E ve H aynı kombinasyonu gösteriyordu).

### FAZ 1 — Veri modeli ✅
- `dp-green-cms` · `program/schema.json` → `routeCode`, `matLevel`,
  `turkceLevel`, `fenLevel`, `sosyalLevel`
- `dp-green-cms` · `global-setting/schema.json` → `liveExamConfig` (json)
- `dp-green-web` · `app/lib/strapi.ts` → branş sayısından bağımsız eşleştirme
  motoru: `netLevel`, `liveExamCombinations`, `matchLiveExamProgram`,
  `activeNetBranches`, `readLiveExamConfig`, `isLiveExamRelated`

### FAZ 2 — Public sayfa ✅
- `app/canli-deneme/page.tsx` — sunucu tarafı, veri + statik bölümler
- `app/canli-deneme/net-matcher.tsx` — net girişi, eşleştirme, sonuç kartı
- `app/canli-deneme/[slug]/page.tsx` — rota detayı (video, açıklama, PDF)
- `app/canli-deneme/canli-deneme.css` — açık + koyu tema
- `app/sitemap.ts` → `/canli-deneme`

### FAZ 3 — Panel ✅
- `app/admin/(dashboard)/canli-deneme/page.tsx` — ana ekran
- `…/rota-panel.tsx` — eşik ayarları + Sosyal anahtarı (canlı kombinasyon
  sayacı), **kompakt kapsama şeridi**, rota programı tablosu
- `…/rota-form.tsx` + `…/yeni/` + `…/[id]/` — rotanın kendi program formu
  (kombinasyon seçimi, başlık, slug, rota kodu, açıklama, video, PDF, kapak)
- `admin-nav.tsx` → "Canlı Deneme" menü girişi
- `programlar-table.tsx` → rota rozeti
- `app/programlar/page.tsx` → rota programlarını listeden çıkarma

**Panel akışı.** Ekran panelin diğer sayfaları gibi çalışır: üstte
"Program Ekle" butonu, altında tablo. Aradaki kapsama şeridi hangi kombinasyonun boş
olduğunu tek bakışta gösterir; boş bir kutuya tıklamak o kombinasyon seçili
halde formu açar. Formdaki kombinasyon menüsünde dolu olanlar pasiftir, yani
bir kombinasyona iki program atanamaz.

> İlk sürümde 8 tam boy kart + toplu kaydetme ucu vardı; sayfa uzun ve panelin
> geri kalanına yabancı kaldığı için şerit + tablo düzenine çevrildi.
> `rota-eslestirme.tsx` ve `app/api/admin/canli-deneme/route.ts` kaldırıldı.

### FAZ 3.5 — Arayüz cilası ✅

**Banner şeridi.** `global-setting.liveExamImage` (media) + `liveExamConfig.bannerEnabled`.
Sayfa başlığının hemen altında, ekranı boydan boya kaplayan bir şerit; görsel
yatayda tekrarlanır (`repeat-x`, `background-size: auto 100%`). Panelden yüklenir
ve ayrı bir anahtarla açılıp kapanır. Şerit sayfa kabının dışında durduğu için
doğal olarak tam genişliktedir — `100vw` kullanılmadı, o kaydırma çubuğu
genişliği kadar yatay taşma yaratırdı.

**Adım şeridi.** "1 Netlerini Gir — 2 Programını Al" panelin tam genişliğini
kaplıyor; aradaki çizgi esneyerek boşluğu dolduruyor. Program hazırlanınca çizgi
soldan sağa maviye doluyor, 2. adımın rozeti kısa bir vurgu yapıyor.

**Hazırlanma animasyonu.** "Programımı Oluştur" sonucu anında göstermiyor;
3,2 saniye boyunca dönen halka, ilerleme çubuğu ve dört aşamalı mesaj gösteriyor.
Eşleştirme aslında anlık; bekleme bilerek konuldu. Süre `LOADING_STEP_MS`
sabitiyle ayarlanır. Paylaşılan linkle gelindiğinde bekleme atlanır.

> Dev sunucusunda adımlar ~1000 ms sürüyor (React dev-mode yeniden render yükü).
> Üretim derlemesinde 800 ms olacak.

**PDF butonları.** Hem sonuç kartında hem rota detayında PDF yeni sekmede
açılmak yerine doğrudan iniyor (`download`). Medya yolu `/uploads/...` göreli ve
Next rewrite ile aynı origin sayıldığı için çalışıyor; ayrı bir medya alan adına
geçilirse tarayıcı `download` özniteliğini yok sayıp yeni sekmede açar.

### FAZ 3.6 — Mobil uyum ✅

375 px genişlikte ölçülüp düzeltildi:

| Sorun | Çözüm |
|---|---|
| Net kutusu 14,7 px font | 16 px — iOS Safari odaklanınca artık yakınlaştırmıyor |
| Net kutusu 40 px yükseklik | 44 px dokunma hedefi |
| Slider dokunma alanı 8 px | 40 px (çubuk görsel olarak yine 8 px, arka plan olarak ortalanıyor) |
| Alt ölçek 10,88 px, üç etiket sıkışık | Uçtaki eşik etiketleri gizlendi, sonuç ortada 13,1 px |
| Başlıktaki eşik metni rozette tekrar ediyordu | Mobilde gizlendi (Sosyal kartındaki farklı açıklama kaldı) |
| Özellik kartları alt alta 244 px | Tek satırda üç kompakt kutu, 97 px |
| Masaüstünde hero ile şerit arası 4 px | 28 px; ardından 36 / 32 / 28 px düzenli ritim |

Yatay taşma yok, 40 px altında dokunma hedefi kalmadı.

### FAZ 3.7 — Sonucun donması ✅

Sonuç artık netler değiştikçe canlı güncellenmiyor. Üretildiği andaki netler ve
kombinasyon dondurulup saklanıyor:

- Netler değişince panel **eskimiş** duruma geçiyor, "Netlerin değişti" diyor.
- **"Önceki programı aç (Rota X)"** butonu netleri sonucun üretildiği ana
  döndürüp paneli geri açıyor — geri alma gibi.
- Yeni sonuç ancak "Programımı Oluştur" ile üretiliyor.

Eskime yalnızca **kombinasyon** değiştiğinde tetikleniyor. Aynı aralık içindeki
oynamalar (18 → 25, ikisi de üstü) programı değiştirmediği için paneli boşuna
bozmuyor.

Panelde "Ayarları Kaydet" üst bara, "Program Ekle"nin yanına alındı; bu yüzden
üst barı artık `rota-panel.tsx` (client) çiziyor, başlık kısmını sayfa
bileşeninden prop olarak alıyor.

### FAZ 4 — İçerik girişi 🔄 (Murat)
- [x] 8 rota programı girildi; 8 kombinasyonun hepsi tam bir kez kullanılıyor
      (A altı·altı·altı, B üstü·altı·altı, C üstü·üstü·altı, D üstü·üstü·üstü,
      E altı·üstü·üstü, F altı·üstü·altı, G altı·altı·üstü, H üstü·altı·üstü)
- [ ] Banner görselini yükle ve anahtarı aç
- [ ] `/admin/ayarlar/navigation` → menüye "Canlı Deneme" linki ekle
      (kod gerektirmez)

### FAZ 5 — İleri (opsiyonel) ⬜
- [ ] Sosyal'i açıp 16 rotaya çıkarma (altyapı hazır, sadece 8 program daha
      girmek ve mevcut 8'ine Sosyal etiketi eklemek gerekir)
- [ ] Girilen netleri anonim kaydet → hangi rota kaç kişi
- [ ] Deneme bazlı eşik (her denemenin kendi 15/20/10 değeri)


### FAZ 6 — Çoklu analiz ⬜ (planlandı, başlanmadı)

**Neden.** Bugün eşikler, Sosyal anahtarı ve banner `global-setting` içinde
**tekil** duruyor; ayrıca bir kombinasyona yalnızca bir program düşebiliyor.
Yani sistem tek bir denemeye kilitli. Yarın ikinci bir deneme yapıldığında
kendi eşikleri, kendi banner'ı ve kendi program seti olmalı.

**Hedef adresler.** "Analiz" üst bölüm olur, her deneme onun altında bir kayıt:

```
/analiz                       yayındaki analizlerin listesi
/analiz/canli-deneme          net girişi + sonuç
/analiz/canli-deneme/rota-a   program detayı
/canli-deneme                 -> /analiz/canli-deneme (kalıcı yönlendirme)
```

`/denemeler` bölümüne dokunulmaz; bu alan yalnızca canlı deneme tipi
sınavlar için kalır.

#### 6.1 Şema (dp-green-cms)
- [x] Yeni collection type `analysis` (pluralName `analyses`):
      `title`, `slug` (uid), `description`,
      `matEsik` / `turkceEsik` / `fenEsik` / `sosyalEsik` (integer),
      `sosyalEnabled` / `collectSosyal` (boolean),
      `banner` (media) / `bannerEnabled` (boolean),
      `isActive` (boolean), `displayOrder` (integer)
- [x] `program` -> `analysis` ilişkisi (manyToOne)
- [ ] `global-setting.liveExamConfig` ve `liveExamImage` **şimdilik durur**;
      taşıma doğrulanana kadar geri dönüş yolu açık kalsın (6.6'da silinir)

#### 6.2 Veri taşıma (tek seferlik)
- [x] Mevcut `liveExamConfig` + `liveExamImage` okunup **"Canlı Deneme"**
      adlı ilk `analysis` kaydı oluşturulur (slug: `canli-deneme`)
- [x] Mevcut 8 rota programı bu kayda bağlanır
- [x] Doğrulama: 8/8 kombinasyon dolu, eşikler birebir aynı, banner yerinde

#### 6.3 Motor (app/lib/strapi.ts)
- [x] `readLiveExamConfig(globalSetting)` -> `readAnalysisConfig(analysis)`
- [x] `getAnalyses()`, `getAnalysisBySlug(slug)`
- [x] `getLiveExamPrograms()` -> `getAnalysisPrograms(analysisId)`
- [x] `matchLiveExamProgram`, `liveExamCombinations`, `netLevel` **aynı kalır**
      (zaten branş sayısından bağımsız yazılmıştı)

#### 6.4 Public sayfalar
- [x] `app/analiz/page.tsx` — analiz listesi
- [x] `app/analiz/[analiz]/page.tsx` — bugünkü `canli-deneme/page.tsx` taşınır
- [x] `app/analiz/[analiz]/[rota]/page.tsx` — bugünkü rota detayı taşınır
- [x] `net-matcher.tsx` — analiz bağlamı prop olarak alınır, linkler güncellenir
- [x] `next.config.ts` — `/canli-deneme` ve `/canli-deneme/:rota` yönlendirmeleri
- [x] `app/sitemap.ts` — analiz ve rota adresleri

#### 6.5 Panel
- [x] `app/admin/(dashboard)/analiz/page.tsx` — liste + "Yeni Analiz"
- [x] `.../analiz/[id]/page.tsx` — bugünkü rota-panel ekranı, analize bağlı
- [x] `rota-form.tsx` — kombinasyon "dolu mu" kontrolü artık **analiz içinde**
      yapılır; aynı kombinasyon farklı analizlerde serbest
- [x] `admin-nav.tsx` — "Canlı Deneme" -> "Analizler"
- [x] Eski `admin/(dashboard)/canli-deneme/` klasörü kaldırılır

#### 6.6 Temizlik
- [x] `global-setting`'ten `liveExamConfig` + `liveExamImage` kaldırılır
- [x] Bu dosya güncellenir

**Sıra.** 6.1 -> 6.2 -> 6.3 -> 6.4 -> 6.5 -> 6.6. Taşıma bitene kadar mevcut
`/canli-deneme` sayfası çalışmaya devam eder; her adım sonunda `tsc` ve sayfa
kontrolü yapılır.

**Riskler.**
- Rota adresleri derinleşiyor (`/canli-deneme/rota-a` ->
  `/analiz/canli-deneme/rota-a`). Yönlendirme ile karşılanır, eski link kırılmaz.
- Analize bağlanmamış rota programı "sahipsiz" kalır; panelde ayrı bölümde
  listelenip uyarı verilir (bugünkü "kombinasyonu tutmayan rotalar" gibi).
- `program` üzerindeki rota alanları artık analiz olmadan anlamsız; bu yüzden
  ilişki zorunlu değil ama panel eksikse uyarır.

---

## Yol boyunca düzeltilen yan hatalar

- `app/api/admin/upload/route.ts` token'ı `.trim()` etmiyordu. `.env.local`
  içinde `STRAPI_TOKEN=` sonrası fazladan boşluk olduğu için localde dosya
  yükleme başarısız oluyordu. (Diğer admin çağrıları zaten trim ediyordu.)
- `app/sitemap.ts` LF satır sonluyken araya tek bir CRLF sızmıştı, temizlendi.

## Bilinen, dokunulmayan konular

- `app/layout.tsx` `<html lang="en">` diyor ama site Türkçe.
- Repo genelinde `@typescript-eslint/no-explicit-any` hataları var (mevcut
  kodun tamamında); yeni dosyalar da aynı kalıbı izliyor.
- Satır sonları repo genelinde karışık (35 CRLF / 113 LF dosya).
