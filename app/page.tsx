import { PageContainer } from "./components/site-layout";
import CourseCard from "./components/course-card";
import BookCard from "@/app/components/book-card";
import Link from "next/link";
import { getBooks, getCamps, getInstructors, toMediaUrl, getCampThumbnail } from "@/app/lib/strapi";

export default async function Home() {
  const [camps, instructors, featuredBooks] = await Promise.all([
    getCamps(),
    getInstructors(),
    getBooks(true),
  ]);

  return (
    <PageContainer>
      <div className="hero-block">
        {/* INSTRUCTORS */}
        <section className="instructors-section" id="ogretmenler">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Youtuber Hocalarımız</h2>
              <p className="section-desc">Alanında uzman, deneyimli öğretmenlerle çalış</p>
            </div>
            <div className="story-scroll-wrapper">
              <div className="story-scroll" id="storyScroll">
                {instructors.map((instructor) => (
                  <Link
                    key={instructor.id}
                    href={`/hoca/${instructor.slug}`}
                    className="story-item"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="story-ring">
                      {instructor.photo?.url ? (
                        <img
                          src={toMediaUrl(instructor.photo?.formats?.thumbnail?.url || instructor.photo?.url) || ""}
                          alt={instructor.name}
                          className="story-img"
                        />
                      ) : (
                        <div className="story-fallback flex items-center justify-center text-3xl h-full w-full bg-slate-800 rounded-full border-4 border-[#050b1f]">👨‍🏫</div>
                      )}
                    </div>
                    <span className="story-name">{instructor.name}</span>
                    <span className="story-subject">{instructor.subjects?.[0]?.name || "Eğitmen"}</span>
                  </Link>
                ))}
              </div>
            </div>
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
              <div className="hero-badge" id="heroBadge">✨ Türkiye'nin #1 Ücretsiz Eğitim Platformu</div>
              <h1 className="hero-title">
                <span className="gradient-text">TYT & AYT'ye</span><br />
                <span>Hazırlanmanın</span><br />
                <span>En Akıllı Yolu</span>
              </h1>
              <p className="hero-desc">
                Alanında uzman öğretmenlerle sınava hazırlan. Binlerce ücretsiz ders, kamplar ve soru çözümlerine hemen eriş.
              </p>
              <div className="hero-ctas">
                <a href="#dersler" className="btn-primary btn-lg pulse-btn">Kamplarımız</a>
                <Link href="/kitaplar" className="btn-outline btn-lg">Kitaplarımız</Link>
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
                <span>🎁</span> Ücretsiz!
              </div>
              <div className="floating-badge badge-bottom">
                <span>📚</span> İşler Yayın Grubu Katkıları ile
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FEATURED COURSES */}
      <section className="courses-section" id="dersler">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kamplar</h2>
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
            <h2 className="section-title">Öne Çıkan Kitaplar</h2>
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

