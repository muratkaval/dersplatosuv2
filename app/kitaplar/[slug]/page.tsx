import { notFound } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/app/components/site-layout";
import { getBookBySlug, toMediaUrl, getGlobalSettings } from "@/app/lib/strapi";
import Book3D from "@/app/components/book-3d";
import FlipBookNative from "@/app/components/flip-book-native";
import BookStickyCTA from "@/app/components/book-sticky-cta";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

export async function generateMetadata({ params }: Props): Promise<import("next").Metadata> {
  const { slug } = await params;
  const [book, settings] = await Promise.all([
    getBookBySlug(slug),
    getGlobalSettings()
  ]);
  
  const siteName = settings?.siteName || "Ders Platosu";
  const globalKeywords = settings?.keywords ? settings.keywords.split(",").map((k: any) => k.trim()) : [];

  if (!book) return { title: `Kitap Bulunamadı | ${siteName}` };

  const coverUrl = toMediaUrl(book.cover?.url || book.cover);
  const subjects: string[] = (book.subjects || []).map((s: any) => s.name).filter(Boolean);
  const subjectStr = subjects.length > 0 ? subjects.join(", ") + " " : "";
  const instructorNames = (book.instructors || []).map((i: any) => i.name).filter(Boolean).join(", ");

  const title = `${book.title} – ${subjectStr}Soru Bankası | ${siteName}`;
  const description = book.description
    ? book.description.slice(0, 155)
    : `${book.title} kitabının video çözümleri${instructorNames ? `, ${instructorNames} tarafından hazırlanmış` : ""} TYT-AYT soru bankası. Örnek sayfaları incele, hemen sipariş ver.`;

  const localKeywords = [
    book.title,
    subjectStr.trim(),
    `${book.title} satın al`,
    `${book.title} çözümleri`,
    instructorNames ? `${instructorNames} kitapları` : "",
    "YKS soru bankası",
    "TYT kitap",
    "AYT kitap",
    "video çözümlü kitap"
  ];

  return {
    title,
    description,
    keywords: [...new Set([...localKeywords.filter(Boolean), ...globalKeywords])],
    alternates: { canonical: `${siteUrl}/kitaplar/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/kitaplar/${slug}`,
      type: "website",
      images: coverUrl ? [{ url: coverUrl, width: 800, height: 1120, alt: book.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const [book, settings] = await Promise.all([
    getBookBySlug(slug),
    getGlobalSettings()
  ]);
  
  const siteName = settings?.siteName || "Ders Platosu";

  if (!book) notFound();

  const accent = book.accent_color || DEFAULT_ACCENT;
  const coverUrl = toMediaUrl(book.cover?.url || book.cover);
  const pdfUrl = toMediaUrl(book.demo_pdf?.url || book.demo_pdf);

  const linkedCamps: any[] = book.camps || [];
  const instructorSet = new Map<number, any>();
  (book.instructors || []).forEach((ins: any) => {
    if (!instructorSet.has(ins.id)) instructorSet.set(ins.id, ins);
  });
  linkedCamps.forEach((camp: any) => {
    (camp.instructors || []).forEach((ins: any) => {
      if (!instructorSet.has(ins.id)) instructorSet.set(ins.id, ins);
    });
  });
  const allInstructors = Array.from(instructorSet.values());

  const showFaq = book.show_faq !== false;
  const faqData = (Array.isArray(book.faq) ? book.faq : []) as any[];
  const faqItems: { q: string; a: string }[] = faqData.length > 0
    ? faqData.map(item => ({ q: String(item.q || ""), a: String(item.a || "") }))
    : (showFaq ? DEFAULT_FAQ : []);

  const subjects: string[] = (book.subjects || []).map((s: any) => s.name).filter(Boolean);

  const showFeatures = book.show_features !== false;
  const rawFeatures = Array.isArray(book.features) ? (book.features as string[]) : [];
  const features = rawFeatures.length > 0
    ? rawFeatures.map((f: string) => ({ label: String(f) }))
    : (showFeatures ? [
        { label: "Video Çözümlü" },
        { label: "Yeni Nesil Sorular" },
        { label: "ÖSYM Tarzı" },
        { label: "Uzman Hoca Onaylı" },
      ] : []);

  // JSON-LD: Book + FAQPage
  const bookJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        "name": book.title,
        "url": `${siteUrl}/kitaplar/${slug}`,
        "image": coverUrl || undefined,
        "description": book.description || undefined,
        "author": allInstructors.length > 0 ? allInstructors.map((i: any) => ({ "@type": "Person", "name": i.name })) : undefined,
        "publisher": { "@type": "Organization", "name": siteName, "url": siteUrl },
        "offers": book.buy_link ? {
          "@type": "Offer",
          "url": book.buy_link,
          "priceCurrency": "TRY",
          "availability": "https://schema.org/InStock",
        } : undefined,
        "inLanguage": "tr",
        "isAccessibleForFree": false,
      },
      ...(showFaq && faqItems.length > 0 ? [{
        "@type": "FAQPage",
        "mainEntity": faqItems.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": { "@type": "Answer", "text": item.a },
        })),
      }] : []),
    ],
  };


  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
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
                <div className="book-hero-tags tags-block">
                  {subjects.map((s: string) => (
                    <span key={s} className="book-hero-tag">{s}</span>
                  ))}
                </div>
              )}

              <h1 className="book-hero-title title-block">{book.title}</h1>

              {book.description && (
                <p className="book-hero-desc desc-block">{book.description}</p>
              )}

              {showFeatures && features.length > 0 && (
                <div className="book-hero-features features-block">
                  {features.map((f) => (
                    <div key={f.label} className="book-feature-pill">
                      {f.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Hocalarımız Alanı */}
              {allInstructors.length > 0 && (
                <div className="instructors-block" style={{ marginTop: "10px", marginBottom: "24px" }}>
                  <span className="book-section-eyebrow" style={{ background: "transparent", border: "none", padding: 0, marginBottom: "12px", display: "block" }}>Youtuber Hocalarımız</span>
                  <div className="instructor-grid-container" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {allInstructors.map((ins: any) => (
                      <Link 
                        key={ins.id} 
                        href={`/hoca/${ins.slug}`}
                        className="instructor-item-pill"
                      >
                        <div style={{ 
                          width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", 
                          border: "2px solid var(--accent-color, #1e3a5f)", background: "#0a1118", flexShrink: 0
                        }}>
                          {(() => {
                            const photoData = ins.photo?.data?.attributes || ins.photo?.attributes || ins.photo;
                            const photoUrl = toMediaUrl(photoData?.url || photoData);
                            const safeName = ins.name || "Hoca";
                            return (
                              <img 
                                src={photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=1e3a5f&color=fff`} 
                                alt={safeName} 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                            );
                          })()}
                        </div>
                        <span>{ins.name || "Eğitmen"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons - Text Only */}
              <div className="book-hero-cta cta-block">
                <a 
                  href={book.preview_link || "#flipbook-section"} 
                  target={book.preview_link ? "_blank" : "_self"} 
                  rel="noopener noreferrer"
                  className="btn-book-primary"
                  style={{ textDecoration: "none" }}
                >
                  İncele
                </a>
                <a 
                  href={book.buy_link || "#"} 
                  target={book.buy_link ? "_blank" : "_self"} 
                  rel="noopener noreferrer"
                  className="btn-book-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Hemen Sipariş Ver
                </a>
              </div>
            </div>

            {/* Right: Static Book Cover */}
            <div className="book-hero-image-wrap image-block">
              <img
                src={coverUrl || "https://via.placeholder.com/400x560?text=Kitap"}
                alt={book.title}
                className="book-static-cover"
              />
            </div>
          </div>
        </section>

        {/* Kamplar bölümü kaldırıldı */}


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
        {showFaq && faqItems.length > 0 && (
          <section className="book-section" id="sss-section">
            <div className="book-section-inner">
              <div className="book-section-header">
                <div className="book-section-eyebrow">❓ Sıkça Sorulanlar</div>
                <h2 className="book-section-title">Aklındaki Soruların Cevabı Burada</h2>
              </div>
              <FAQSection items={faqItems} accentColor={accent} />
            </div>
          </section>
        )}

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

        {/* Mobile Sticky CTA */}
        <BookStickyCTA 
          title={book.title}
          coverUrl={coverUrl || "https://via.placeholder.com/100"}
          buyLink={book.buy_link}
          previewLink={book.preview_link}
          accentColor={accent}
        />
      </div>
    </PageContainer>
  );
}
