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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

export async function generateMetadata({ params }: Props): Promise<import("next").Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Kitap Bulunamadı | Ders Platosu" };

  const coverUrl = toMediaUrl(book.cover?.url || book.cover);
  const subjects: string[] = (book.subjects || []).map((s: any) => s.name).filter(Boolean);
  const subjectStr = subjects.length > 0 ? subjects.join(", ") + " " : "";
  const instructorNames = (book.instructors || []).map((i: any) => i.name).filter(Boolean).join(", ");

  const title = `${book.title} – ${subjectStr}Soru Bankası | Ders Platosu`;
  const description = book.description
    ? book.description.slice(0, 155)
    : `${book.title} kitabının video çözümleri${instructorNames ? `, ${instructorNames} tarafından hazırlanmış` : ""} TYT-AYT soru bankası. Örnek sayfaları incele, hemen sipariş ver.`;

  const keywords = [
    book.title,
    subjectStr.trim(),
    `${book.title} satın al`,
    `${book.title} çözümleri`,
    instructorNames ? `${instructorNames} kitapları` : "",
    "YKS soru bankası",
    "TYT kitap",
    "AYT kitap",
    "video çözümlü kitap",
    "Ders Platosu"
  ];

  return {
    title,
    description,
    keywords: keywords.filter(Boolean),
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
  const book = await getBookBySlug(slug);

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
        "publisher": { "@type": "Organization", "name": "Ders Platosu", "url": siteUrl },
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
                <div className="instructors-block" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.8 }}>Youtuber Hocalarımız</span>
                  <div className="instructor-grid-container" style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                    {allInstructors.map((ins: any) => (
                      <Link 
                        key={ins.id} 
                        href={`/hoca/${ins.slug}`}
                        style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0, padding: "4px 12px 4px 4px", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", transition: "all 0.2s" }}
                        className="instructor-item-pill"
                      >
                        <div style={{ 
                          width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", 
                          border: "2px solid #1e3a5f", background: "#0a1118", flexShrink: 0,
                          boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                        }}>
                          {(() => {
                            // Extract photo object carefully for Strapi v5
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
                        <span style={{ color: "#f8fafc", fontSize: "0.85rem", fontWeight: 600 }}>{ins.name || "Eğitmen"}</span>
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
      </div>
    </PageContainer>
  );
}
