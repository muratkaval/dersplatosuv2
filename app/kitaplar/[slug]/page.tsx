import { notFound } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/app/components/site-layout";
import { getBookBySlug, toMediaUrl } from "@/app/lib/strapi";
import Book3D from "@/app/components/book-3d";
import FlipBookNative from "@/app/components/flip-book-native";
import FAQSection from "@/app/components/faq-section";
import "../book-premium.css";

interface Props {
  params: Promise<{ slug: string }>;
}

const DEFAULT_ACCENT = "#4289F7";

const DEFAULT_FAQ = [
  {
    q: "Bu kitabın video çözümlerine nasıl ulaşabilirim?",
    a: "Tüm video çözümlere 'Soru Çözümleri' bölümümüzden ücretsiz ulaşabilirsiniz. Kitabı seçin, ilgili testi bulun ve çözüm videosunu izleyin.",
  },
  {
    q: "Bu kitap hangi sınıf ve seviye için uygundur?",
    a: "Kitabın üzerindeki ders ve sınıf etiketlerine bakarak seviyeyi belirleyebilirsiniz. Detaylar için bizimle iletişime geçebilirsiniz.",
  },
  {
    q: "Kargo ne zaman teslim edilir?",
    a: "Siparişiniz genellikle 1-3 iş günü içinde kargoya verilir. Türkiye genelinde hızlı teslimat imkânı sunulmaktadır.",
  },
  {
    q: "Demo sayfalar ile asıl kitap aynı kalitede mi?",
    a: "Evet, demo sayfalar gerçek kitabın bire bir dijital kopyasıdır. Gördüğünüz kalitede bir kitap elinize geçecektir.",
  },
];

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) notFound();

  const accent = book.accent_color || DEFAULT_ACCENT;
  const coverUrl = toMediaUrl(book.cover?.url || book.cover);
  const pdfUrl = toMediaUrl(book.demo_pdf?.url || book.demo_pdf);

  // Gather linked camps (relation: book <-> camp)
  const linkedCamps: any[] = book.camps || [];

  // Gather instructors from linked camps (unique)
  const instructorSet = new Map<number, any>();
  linkedCamps.forEach((camp: any) => {
    (camp.instructors || []).forEach((ins: any) => {
      if (!instructorSet.has(ins.id)) instructorSet.set(ins.id, ins);
    });
  });
  const campInstructors = Array.from(instructorSet.values());

  // FAQ – use Strapi data if available, else defaults
  const faqItems: { q: string; a: string }[] = Array.isArray(book.faq) && book.faq.length > 0
    ? book.faq
    : DEFAULT_FAQ;

  const subjects: string[] = (book.subjects || []).map((s: any) => s.name).filter(Boolean);

  const features = [
    { icon: "🎬", label: "Video Çözümlü" },
    { icon: "🎯", label: "Yeni Nesil Sorular" },
    { icon: "📊", label: "ÖSYM Tarzı" },
    { icon: "🏆", label: "Uzman Hoca Onaylı" },
  ];

  return (
    <PageContainer>
      <div
        className="book-page-root"
        style={{ "--accent-color": accent } as React.CSSProperties}
      >
        {/* Arka plan ışığını kaldırdık */}


        {/* Breadcrumb */}
        <nav className="book-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Ana Sayfa</Link>
          <span>›</span>
          <Link href="/kitaplar">Kitaplarımız</Link>
          <span>›</span>
          <span style={{ color: "#94a3b8" }}>{book.title}</span>
        </nav>

        {/* ===================== HERO ===================== */}
        <section className="book-hero">
          <div className="book-hero-inner">
            {/* Left: Info */}
            <div className="book-hero-info">
              {/* Tags */}
              {subjects.length > 0 && (
                <div className="book-hero-tags">
                  {subjects.map((s: string) => (
                    <span key={s} className="book-hero-tag">{s}</span>
                  ))}
                </div>
              )}

              <h1 className="book-hero-title">{book.title}</h1>

              {book.description && (
                <p className="book-hero-desc">{book.description}</p>
              )}

              {/* Feature pills */}
              <div className="book-hero-features">
                {features.map((f) => (
                  <div key={f.label} className="book-feature-pill">
                    <span className="book-feature-pill-icon">{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="book-hero-cta">
                {book.buy_link && (
                  <a
                    href={book.buy_link}
                    className="btn-book-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    id="buy-book-btn"
                  >
                    🛒 Hemen Sipariş Ver
                  </a>
                )}
                {pdfUrl && (
                  <a href="#flipbook-section" className="btn-book-secondary" id="preview-book-btn">
                    📖 Örnek Sayfaları İncele
                  </a>
                )}
              </div>

              {/* Trust Badges */}
              <div className="book-trust-badges">
                <div className="trust-badge">
                  <span className="trust-badge-icon">✅</span>
                  Güvenli Ödeme
                </div>
                <div className="trust-badge">
                  <span className="trust-badge-icon">🚚</span>
                  Hızlı Teslimat
                </div>
                <div className="trust-badge">
                  <span className="trust-badge-icon">🔄</span>
                  İade Garantisi
                </div>
              </div>
            </div>

            {/* Right: Static Book Cover */}
            <div className="book-hero-image-wrap">
              <img
                src={coverUrl || "https://via.placeholder.com/400x560?text=Kitap"}
                alt={book.title}
                className="book-static-cover"
              />
            </div>
          </div>
        </section>

        {/* ===================== LINKED CAMPS ===================== */}
        {linkedCamps.length > 0 && (
          <section className="book-section book-section-alt" id="camps-section">
            <div className="book-section-inner">
              <div className="book-section-header">
                <div className="book-section-eyebrow">📚 Kamplar</div>
                <h2 className="book-section-title">Bu Kitapla İlerleyen Kamplar</h2>
                <p className="book-section-subtitle">
                  Aşağıdaki hocalarımız bu kitabı ders materyali olarak kullanarak kamp yapıyor.
                </p>
              </div>

              <div className="camps-linked-grid">
                {linkedCamps.map((camp: any) => {
                  const campCover = toMediaUrl(camp.cover?.url || camp.cover);
                  const campInstructors: any[] = camp.instructors || [];
                  return (
                    <Link href={`/kamplar/${camp.slug}`} key={camp.id} className="camp-linked-card">
                      <div className="camp-linked-thumb">
                        <img
                          src={campCover || "https://via.placeholder.com/400x180?text=Kamp"}
                          alt={camp.title}
                        />
                        <span className="camp-linked-badge">Kamp</span>
                      </div>
                      <div className="camp-linked-body">
                        <div className="camp-linked-title">{camp.title}</div>
                        {campInstructors.length > 0 && (
                          <div className="camp-linked-instructor">
                            <img
                              src={toMediaUrl(campInstructors[0].photo?.url || campInstructors[0].photo) || "https://via.placeholder.com/36"}
                              alt={campInstructors[0].name}
                              className="camp-instructor-avatar"
                            />
                            <span className="camp-instructor-name">{campInstructors[0].name}</span>
                          </div>
                        )}
                        <div className="camp-linked-btn">
                          Kampa Git →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===================== VIDEO SOLUTION PARTNER ===================== */}
        {campInstructors.length > 0 && (
          <section className="book-section" id="solution-section">
            <div className="book-section-inner">
              <div className="book-section-header">
                <div className="book-section-eyebrow">🎬 Video Çözümler</div>
                <h2 className="book-section-title">Soru Çözümlerine Git</h2>
                <p className="book-section-subtitle">
                  Bu kitabın sorularını çözen hocalarımızın video çözümlerine ücretsiz ulaşabilirsiniz.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {campInstructors.map((ins: any) => (
                  <Link
                    key={ins.id}
                    href={`/video-soru-cozumleri`}
                    className="solution-partner-banner"
                  >
                    <img
                      src={toMediaUrl(ins.photo?.url || ins.photo) || "https://via.placeholder.com/72"}
                      alt={ins.name}
                      className="solution-partner-avatar"
                    />
                    <div className="solution-partner-content">
                      <div className="solution-partner-title">Çözüm Ortağı Hoca</div>
                      <div className="solution-partner-name">{ins.name}</div>
                      <div className="solution-partner-desc">
                        Bu kitabın tüm soru çözümleri Ders Platosu'nda mevcuttur.
                      </div>
                    </div>
                    <div className="solution-partner-btn">
                      🎬 Çözümlere Git
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== FLIPBOOK ===================== */}
        {pdfUrl && (
          <section className="book-section book-section-alt" id="flipbook-section">
            <div className="book-section-inner">
              <div className="book-section-header">
                <div className="book-section-eyebrow">📖 Örnek Sayfalar</div>
                <h2 className="book-section-title">Kitabı Karıştır</h2>
                <p className="book-section-subtitle">
                  Satın almadan önce kitabın içini görmek mi istiyorsun? Demo sayfaları aşağıda inceleyebilirsin.
                </p>
              </div>
              <FlipBookNative pdfUrl={pdfUrl} accentColor={accent} />
            </div>
          </section>
        )}

        {/* ===================== FAQ ===================== */}
        <section className="book-section" id="sss-section">
          <div className="book-section-inner">
            <div className="book-section-header">
              <div className="book-section-eyebrow">❓ Sıkça Sorulanlar</div>
              <h2 className="book-section-title">Aklındaki Soruların Cevabı Burada</h2>
            </div>
            <FAQSection items={faqItems} accentColor={accent} />
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        {book.buy_link && (
          <section className="book-section" style={{ paddingTop: 0 }}>
            <div className="book-section-inner" style={{ textAlign: "center" }}>
              <h2 className="book-section-title" style={{ marginBottom: "16px" }}>
                Hazırsan Sipariş Ver! 🚀
              </h2>
              <p className="book-section-subtitle" style={{ marginBottom: "28px" }}>
                Hızlı kargo ve güvenli ödeme garantisiyle {book.title} kitabını hemen edinin.
              </p>
              <a
                href={book.buy_link}
                className="btn-book-primary"
                target="_blank"
                rel="noopener noreferrer"
                id="final-buy-btn"
                style={{ display: "inline-flex" }}
              >
                🛒 Hemen Sipariş Ver
              </a>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
