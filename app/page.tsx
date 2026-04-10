import { PageContainer } from "./components/site-layout";
import CourseCard from "./components/course-card";
import BookCard from "@/app/components/book-card";
import Link from "next/link";
import { getBooks, getCamps, getInstructors, toMediaUrl, getCampThumbnail, getGlobalSettings } from "@/app/lib/strapi";
import InstructorScroll from "./components/instructor-scroll";

export default async function Home() {
  const [camps, instructors, featuredBooks, globalSettings] = await Promise.all([
    getCamps(),
    getInstructors(),
    getBooks(true),
    getGlobalSettings()
  ]);

  const site = globalSettings?.attributes || globalSettings || {};

  return (
    <PageContainer>
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
                  <div className="course-thumb hero-course-thumb" style={{ background: `url('${getCampThumbnail(camps[0])}') center/cover no-repeat` }}>
                    <div className="play-overlay">
                      <div className="play-button-circle">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="course-body">
                    <span className="course-tag hero-course-tag">{camps[0].subject?.name || "Kamp"}</span>
                    <h3 className="hero-course-title">{camps[0].title}</h3>
                    <div className="course-instructor">
                      <div className="hero-instructor-stack">
                        {camps[0].instructors?.slice(0, 3).map((inst) => {
                          const pUrl = toMediaUrl(inst.photo?.formats?.thumbnail?.url || inst.photo?.url);
                          return pUrl ? (
                            <img
                              key={inst.id}
                              src={pUrl}
                              className="avatar-stack-img hero-instructor-avatar"
                              alt={inst.name}
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

      {/* FEATURED COURSES */}
      <section className="courses-section" id="dersler">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{site.campsTitle || "Kamplar"}</h2>
            <Link href="/kamplar" className="section-link">Tümünü Gör ›</Link>
          </div>
          <div className="courses-grid">
            {camps.slice(0, 6).map((camp) => (
              <CourseCard key={camp.id} camp={camp} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BOOKS */}
      <section className="books-section" id="kitaplar">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{site.booksTitle || "Öne Çıkan Kitaplar"}</h2>
            <Link href="/kitaplar" className="section-link">Tümünü Gör ›</Link>
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

