import { notFound } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "../../components/site-layout";
import { getInstructorBySlug, toMediaUrl } from "@/app/lib/strapi";
import "./hoca.css";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const instructor = await getInstructorBySlug(slug);
  
  if (!instructor) return { title: "Eğitmen Bulunamadı | Ders Platosu" };

  return {
    title: `${instructor.name} | Ders Platosu`,
    description: `${instructor.name} hocamızın YouTube kampları, kitapları ve eğitim içerikleri Ders Platosu'nda.`,
    openGraph: {
      images: instructor.photo?.url ? [toMediaUrl(instructor.photo.url)] : [],
    }
  };
}

// URL'den YouTube / Playlist ID cikarma yardimcilari (orijinal js'den)
function extractYouTubeId(url: string) {
  if (!url) return '';
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : url;
}

export default async function HocaDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instructor = await getInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const instName = instructor.name || "Hoca";
  const photoUrl = toMediaUrl(instructor.photo?.url || instructor.photo?.formats?.thumbnail?.url);
  const subjects = Array.isArray(instructor.subjects) ? instructor.subjects : (instructor.subjects?.data || []);
  const subjectName = subjects[0]?.name || "Öğretmen";

  const camps = Array.isArray(instructor.camps) ? instructor.camps : (instructor.camps?.data || []);
  
  // Kitaplari topla ve birlestir (Dogrudan eklenenler + Kamplardan gelenler)
  const seenBookIds = new Set<string | number>();
  const allBooks: any[] = [];
  
  const addBooks = (booksSource: any) => {
      const bks = Array.isArray(booksSource) ? booksSource : (booksSource?.data || []);
      bks.forEach((book: any) => {
          const bId = book.id || book.documentId;
          if(bId && !seenBookIds.has(bId)) {
              seenBookIds.add(bId);
              allBooks.push(book);
          }
      });
  };

  addBooks(instructor.books);
  camps.forEach((camp: any) => {
      addBooks(camp.books);
  });

  return (
    <PageContainer>
      {/* ── HERO ── */}
      <section className="hoca-hero" id="hocaHero">
        <div className="hoca-hero-inner">
            <div className="hoca-photos-group">
                <div className="hoca-photo-wrap" id="hocaPhotoWrap">
                    {photoUrl ? (
                        <img src={photoUrl} alt={instName} />
                    ) : (
                        <div className="hoca-photo-fallback">👨‍🏫</div>
                    )}
                </div>
                <div className="hoca-logo-circle">
                    <img src="https://i.hizliresim.com/ag3gf4d.png" alt="Ders Platosu" />
                </div>
            </div>
            <div className="hoca-info">
                {subjectName && <div className="hoca-subject-badge">{subjectName}</div>}
                <h1>{instName}</h1>
                <div className="hoca-socials">
                    {instructor.youtube && (
                        <a href={instructor.youtube} target="_blank" rel="noopener noreferrer" className="hoca-btn hoca-btn-yt">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/>
                            </svg>
                            YouTube Kanalı
                        </a>
                    )}
                    {instructor.instagram && (
                        <a href={instructor.instagram} target="_blank" rel="noopener noreferrer" className="hoca-btn hoca-btn-ig">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.3.2 4.8 1.7 5 5 .1 1.3.1 1.6.1 4.7s0 3.4-.1 4.7c-.2 3.3-1.7 4.8-5 5-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.2-4.8-1.7-5-5C2 15.6 2 15.3 2 12s0-3.4.1-4.7c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7 .1 2.7.3.3 2.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c.2 4.3 2.6 6.7 7 6.9 1.3.1 1.7.1 5 .1s3.7 0 5-.1c4.3-.2 6.7-2.6 6.9-7C24 15.7 24 15.3 24 12s0-3.7-.1-5c-.2-4.3-2.6-6.7-7-6.9C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/>
                            </svg>
                            Instagram
                        </a>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="hoca-body">
        
        {/* KAMPLAR */}
        {camps.length > 0 && (
            <div className="hoca-section">
                <div className="hoca-section-title">🎬 Kamplar</div>
                <div className="hoca-camps-grid">
                    {camps.map((camp: any, idx: number) => {
                        const videoId = extractYouTubeId(camp.introVideo || '');
                        const campCoverUrl = toMediaUrl(camp.cover?.url || camp.cover?.formats?.small?.url || camp.cover?.formats?.thumbnail?.url);
                        const thumbStyle = campCoverUrl ? `url('${campCoverUrl}') center/cover no-repeat` : (videoId ? `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg') center/cover no-repeat` : 'var(--bg-secondary)');
                        
                        return (
                            <Link key={camp.id || idx} href={`/kamplar/${camp.slug}`} className="course-card">
                                <div className="course-thumb" style={{ background: thumbStyle }}>
                                    {videoId && <div className="course-play-btn"></div>}
                                </div>
                                <div className="course-body">
                                    {camp.subject?.name && <span className="course-tag">{camp.subject.name}</span>}
                                    <h3>{camp.title || 'Kamp'}</h3>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        )}

        {/* KİTAPLAR */}
        {allBooks.length > 0 && (
            <div className="hoca-section">
                <div className="hoca-section-title">📚 Kitaplar</div>
                <div className="books-grid-unified">
                    {allBooks.map((book: any, idx: number) => {
                        const bookCover = toMediaUrl(book.cover?.url || book.cover?.formats?.small?.url);
                        
                        return (
                            <div key={book.id || idx} className="book-card-premium">
                                <div className="book-card-cover-wrap">
                                    <img 
                                        className="book-card-cover" 
                                        src={bookCover || 'https://via.placeholder.com/200x280?text=Kitap'} 
                                        alt={book.title} 
                                        loading="lazy" 
                                    />
                                </div>
                                <div className="book-card-body">
                                    <h4>{book.title || 'Kitap'}</h4>
                                    <div className="book-card-btns">
                                        {book.buy_link && (
                                            <a href={book.buy_link} className="btn-book-buy" target="_blank" rel="noopener noreferrer">
                                                📦 Satın Al ↗
                                            </a>
                                        )}
                                        {book.slug && (
                                            <Link href={`/kitaplar/${book.slug}`} className="btn-book-inspect">
                                                🔎 Kitabı İncele
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {(camps.length === 0 && allBooks.length === 0) && (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>
                Bu hocaya ait içerik henüz eklenmemiş.
            </div>
        )}

      </div>
    </PageContainer>
  );
}
