import { PageContainer } from "./components/site-layout";
import CourseCard from "./components/course-card";
import BookCard from "@/app/components/book-card";
import Link from "next/link";
import Image from "next/image";
import { getBooks, getCamps, getInstructors, toMediaUrl, getCampThumbnail, getGlobalSettings } from "@/app/lib/strapi";
import InstructorScroll from "./components/instructor-scroll";

function slugify(t: string = "") {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function Home() {
  const [camps, instructors, featuredBooks, globalSettings] = await Promise.all([
    getCamps(),
    getInstructors(),
    getBooks(true),
    getGlobalSettings()
  ]);

  const site = globalSettings?.attributes || globalSettings || {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";
  
  // JSON-LD: WebSite + Organization
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": site.siteName || "Ders Platosu",
        "description": site.ogDescription || "TYT AYT Ücretsiz Eğitim Platformu",
        "potentialAction": [{
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/video-soru-cozumleri?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }],
        "inLanguage": "tr"
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Ders Platosu",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": "https://i.hizliresim.com/ag3gf4d.png",
          "width": 1200,
          "height": 630
        },
        "sameAs": [
          "https://www.youtube.com/c/dersplatosu",
          "https://www.instagram.com/dersplatosu/"
        ]
      }
    ]
  };

  return (
    <PageContainer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <div className="hero-block">
        {/* INSTRUCTORS */}
        <section className="instructors-section" id="ogretmenler">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{site.instructorsTitle || "Youtuber Hocalarımız"}</h2>
              <p className="section-desc">{site.instructorsDesc || "Alanında uzman, deneyimli öğretmenlerle çalış"}</p>
            </div>
            <InstructorScroll instructors={instructors} />
          </div>
        </section>

        {/* HERO */}
        <section className="hero hero-top" id="hero">
          <div className="hero-bg">
            <div className="hero-orb orb1"></div>
            <div className="hero-orb orb2"></div>
            <div className="hero-orb orb3"></div>
          </div>
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-badge" id="heroBadge">{site.heroBadge || "✨ Türkiye'nin #1 Ücretsiz Eğitim Platformu"}</div>
              <h1 className="hero-title">
                {site.heroTitle ? (
                  site.heroTitle.split(/(<[^>]+>)/g).map((part: string, index: number) => {
                    if (part.startsWith("<") && part.endsWith(">")) {
                      return <span key={index} className="gradient-text">{part.slice(1, -1)}</span>;
                    }
                    return (
                      <span key={index}>
                        {part.split("\n").map((line: string, i: number, arr: string[]) => (
                          <span key={`line-${i}`}>
                            {line}
                            {i < arr.length - 1 && <br />}
                          </span>
                        ))}
                      </span>
                    );
                  })
                ) : (
                  <>
                    <span className="gradient-text">TYT & AYT'ye</span><br />
                    <span>Hazırlanmanın</span><br />
                    <span>En Akıllı Yolu</span>
                  </>
                )}
              </h1>
              <p className="hero-desc">
                {site.heroDescription || "Alanında uzman öğretmenlerle sınava hazırlan. Binlerce ücretsiz ders, kamplar ve soru çözümlerine hemen eriş."}
              </p>
              <div className="hero-ctas">
                <Link href={site.heroBtn1Link || "#dersler"} className="btn-primary btn-lg pulse-btn">
                  {site.heroBtn1Text || "Kamplarımız"}
                </Link>
                <Link href={site.heroBtn2Link || "/kitaplar"} className="btn-outline btn-lg">
                  {site.heroBtn2Text || "Kitaplarımız"}
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              {camps[0] ? (
                <Link href={`/kamplar/${camps[0].slug}`} className="hero-card course-card floating">
                  <div className="course-thumb hero-course-thumb relative overflow-hidden">
                    <Image 
                      src={getCampThumbnail(camps[0])}
                      alt={camps[0].title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <div className="play-overlay">
                      <div className="play-button-circle">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="course-body">
                    <h3 className="hero-course-title">{camps[0].title}</h3>
                    <div className="course-instructor">
                      <div className="hero-instructor-stack">
                        {camps[0].instructors?.map((inst) => {
                          const pUrl = toMediaUrl(inst.photo?.formats?.thumbnail?.url || inst.photo?.url);
                          return pUrl ? (
                            <Image
                              key={inst.id}
                              src={pUrl}
                              className="avatar-stack-img hero-instructor-avatar"
                              alt={inst.name}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div
                              key={inst.id}
                              className="avatar-stack-img hero-instructor-avatar"
                              style={{
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                color: 'white'
                              }}
                            >
                              👨‍🏫
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}
              <div className="floating-badge badge-top">
                <span>🎁</span> {site.floatingBadgeTop || "Ücretsiz!"}
              </div>
              <div className="floating-badge badge-bottom">
                <span>📚</span> {site.floatingBadgeBottom || "İşler Yayın Grubu Katkıları ile"}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* STATISTICS SECTION */}
      {site.statsItems && site.statsItems.length > 0 && (
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              {site.statsItems.map((item: any, idx: number) => (
                <div key={idx} className="stat-card">
                  <div className="stat-icon">
                    <span className="ms">{item.icon || "trending_up"}</span>
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-value">{item.value}</h3>
                    <p className="stat-label">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY US SECTION */}
      {site.whyUsItems && site.whyUsItems.length > 0 && (
        <section className="features-section" id="neden-biz">
          <div className="container">
            <div className="section-header centered">
              <h2 className="section-title">{site.whyUsTitle || "Neden Ders Platosu?"}</h2>
              <p className="section-desc">{site.whyUsDesc || "Sınav yolculuğunda seni zirveye taşıyacak her şey burada."}</p>
            </div>
            <div className="features-grid">
              {site.whyUsItems.map((item: any, idx: number) => (
                <div key={idx} className="feature-card">
                  <div className="feature-icon">
                    <span className="ms">{item.icon || "star"}</span>
                  </div>
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="feature-description">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED COURSES (CATEGORIZED) */}
      <section className="courses-categorized-section" id="dersler" style={{ paddingTop: "40px" }}>
        <div className="container">
          {(() => {
            // Group camps by category
            const grouped = camps.reduce((acc, camp) => {
              const cats = Array.isArray(camp.categories) ? camp.categories : (camp.categories?.data || []);
              if (cats.length > 0) {
                cats.forEach((cat: any) => {
                  const catTitle = cat.name || cat.attributes?.name || cat.title || cat.attributes?.title || "Sınıflandırılmamış Kamplar";
                  const order = cat.displayOrder ?? cat.attributes?.displayOrder ?? 999;
                  if (!acc[catTitle]) acc[catTitle] = { title: catTitle, order, camps: [] };
                  acc[catTitle].camps.push(camp);
                });
              } else {
                if (!acc["Diğer Kamplar"]) acc["Diğer Kamplar"] = { title: "Diğer Kamplar", order: 999, camps: [] };
                acc["Diğer Kamplar"].camps.push(camp);
              }
              return acc;
            }, {} as Record<string, { title: string, order: number, camps: any[] }>);

            const sortedGroups = Object.values(grouped).sort((a, b) => a.order - b.order);

            return sortedGroups.map((group, idx) => (
              <div key={idx} className="category-block" style={{ marginBottom: "60px" }}>
                <div className="section-header category-header">
                  <h2 className="section-title category-title">
                    <span className="category-title-bar"></span>
                    <span className="category-title-text">{group.title}</span>
                  </h2>
                  <Link href={`/kamplar/kategori/${slugify(group.title)}`} className="section-link category-link">Tümünü Gör ›</Link>
                </div>
                <div className="courses-grid">
                  {group.camps.slice(0, 6).map((camp) => (
                    <CourseCard key={camp.id} camp={camp} />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </section>

      {/* FEATURED BOOKS */}
      <section className="books-section" id="kitaplar">
        <div className="container">
          <div className="section-header category-header">
            <h2 className="section-title category-title">
              <span className="category-title-bar"></span>
              <span className="category-title-text">{site.booksTitle || "Öne Çıkan Kitaplar"}</span>
            </h2>
            <Link href="/kitaplar" className="section-link category-link">Tümünü Gör ›</Link>
          </div>
          <div className="books-grid-unified">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

