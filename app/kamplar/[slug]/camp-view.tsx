"use client";

import { useState } from "react";
import Link from "next/link";
import { toMediaUrl } from "@/app/lib/strapi";
import BookCard from "@/app/components/book-card";
import Book3D from "@/app/components/book-3d";

// URL'den YouTube / Playlist ID cikarma yardimcilari (orijinal js'den)
function extractYouTubeId(url: string) {
  if (!url) return '';
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : url;
}

function extractPlaylistId(url: string) {
  if (!url) return '';
  const regExp = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : url;
}

export default function CampView({ camp }: { camp: any }) {
  const [activeTab, setActiveTab] = useState<"dersler" | "kitaplar">("dersler");
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  const introVideoId = camp.introVideo ? extractYouTubeId(camp.introVideo) : null;
  const playlistId = camp.playlist ? extractPlaylistId(camp.playlist) : null;
  const coverUrl = toMediaUrl(camp.cover?.url);

  // Fallback YouTube Kapagi
  const heroCover = coverUrl || (introVideoId ? `https://img.youtube.com/vi/${introVideoId}/hqdefault.jpg` : '');

  const lessons = camp.lessons || [];
  // Strapi v5 flat array or v4 nested struct
  const normalizedLessons = Array.isArray(lessons) ? lessons : (lessons?.data || []);
  const sortedLessons = [...normalizedLessons].sort((a: any, b: any) => (a.day || 0) - (b.day || 0));

  const books = camp.books || [];
  const normalizedBooks = Array.isArray(books) ? books : (books?.data || []);

  const instructors = camp.instructors || [];
    const normalizedInstructors = Array.isArray(instructors) ? instructors : (instructors?.data || []);

  const totalLessons = sortedLessons.length || "—";
  const displayType = camp.displayType || "daily";
  const heroMode = camp.heroMode || "video"; // Yeni mod çekildi
  const mainLabel = displayType === "daily" ? "Gün" : displayType === "topic" ? "Konu" : "Bölüm";

  // Gruplandirma Mantigi
  const groupedLessons = sortedLessons.reduce((acc: any, lesson: any) => {
    const day = lesson.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(lesson);
    return acc;
  }, {});
  const dayNums = Object.keys(groupedLessons).map(Number).sort((a, b) => a - b);

  return (
    <div className="egitim-page">
      {/* HERO */}
      <section className="egitim-hero" style={heroCover ? { '--hero-cover': `url('${heroCover}')` } as any : {}}>
        {/* Sinematik Arka Plan Katmanları */}
        <div className="egitim-hero-bg-blur" />
        <div className="egitim-hero-overlay" />

        <div className="egitim-hero-inner">
          <div className="egitim-hero-left">
            <h1 id="heroTitle">{camp.title}</h1>

            {camp.description && <p>{camp.description}</p>}
            <div className="egitim-btns">
              <button
                className="btn-primary btn-lg"
                type="button"
                onClick={() => {
                  document.querySelector('.egitim-body')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                🚀 Hemen Başla
              </button>
            </div>
          </div>

          {/* VIDEO CARD */}
          <div className={`egitim-video-card ${heroMode === 'image' ? 'is-image-mode' : ''}`}>
            <div className="egitim-player-wrap" onClick={() => {
                if(introVideoId && heroMode === 'video') setIsHeroVideoPlaying(true);
            }}>
              {!isHeroVideoPlaying ? (
                <div
                  className="egitim-thumb"
                  style={{ backgroundImage: `url('${heroCover}')` }}
                >
                  {introVideoId && heroMode === 'video' && <div className="egitim-play-btn"></div>}
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${introVideoId}?autoplay=1&rel=0&modestbranding=1`}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                />
              )}
            </div>
            <div className="egitim-video-label">
              <span>{heroMode === 'video' ? '▶' : '🖼️'}</span>
              <span>
                {heroMode === 'video' 
                  ? (introVideoId ? 'Kamp Tanıtım Videosunu İzle' : 'Tanıtım Videosu Bekleniyor') 
                  : 'Kamp Kapak Görseli'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="egitim-body">
        <div className="egitim-main">
          {/* TABS */}
          <div className="egitim-tabs">
            <div
              className={`etab ${activeTab === "dersler" ? "active" : ""}`}
              onClick={() => setActiveTab("dersler")}
            >
              ▶ Dersler
            </div>
            <div
              className={`etab ${activeTab === "kitaplar" ? "active" : ""}`}
              onClick={() => setActiveTab("kitaplar")}
            >
              📚 Kitaplar
            </div>
          </div>

          {/* TAB: DERSLER */}
          {activeTab === "dersler" && (
            sortedLessons.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Bu kampa ait henüz ders yüklenmemiştir.</p>
            ) : (
                  <div className={`lesson-list-dyn ${displayType === "sequential" ? "is-sequential" : ""}`}>
                    {displayType === "sequential" ? (
                      sortedLessons.map((lesson: any, i: number) => {
                        const lId = lesson.id || `seq-${i}`;
                        const isActive = activeLessonId === lId;
                        const vid = extractYouTubeId(lesson.youtube || '');

                        return (
                          <div
                            key={lId}
                            className={`lesson-item ${isActive ? "active" : ""}`}
                            onClick={() => setActiveLessonId(isActive ? null : lId)}
                          >
                            <div className="lesson-row">
                              <span className="lesson-num">{String(i + 1).padStart(2, '0')}</span>
                              <img
                                src={vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : 'https://via.placeholder.com/110x68?text=Ders'}
                                className="lesson-thumb-sm"
                                alt="thumb"
                              />
                              <div className="lesson-info-dyn">
                                <h4>{lesson.title || `Ders ${i + 1}`}</h4>
                              </div>
                              {lesson.notes_link && (
                                <a
                                  href={lesson.notes_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="lesson-notes-btn"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  📄 Ders Notu
                                </a>
                              )}
                            </div>

                            {isActive && vid && (
                              <div className="lesson-player-container" style={{ display: 'block' }}>
                                <button
                                  className="lesson-close-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveLessonId(null);
                                  }}
                                  title="Kapat"
                                >
                                  &times;
                                </button>
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`}
                                  allowFullScreen
                                  allow="autoplay; encrypted-media"
                                />
                                {lesson.notes_link && (
                                  <a
                                    href={lesson.notes_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lesson-notes-under"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    📄 Ders Notu İndir
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      dayNums.map((dayNum) => (
                        <div key={dayNum} className="day-group-container">
                          <div className="day-group-header">
                            <span className="day-group-title">
                              {groupedLessons[dayNum][0]?.group_title 
                                ? `${dayNum}. ${mainLabel}: ${groupedLessons[dayNum][0].group_title}` 
                                : `${dayNum}. ${mainLabel}`}
                            </span>
                            <span className="day-group-count">{groupedLessons[dayNum].length} Video</span>
                          </div>

                          {groupedLessons[dayNum].map((lesson: any, i: number) => {
                            const lId = lesson.id || `${dayNum}-${i}`;
                            const isActive = activeLessonId === lId;
                            const vid = extractYouTubeId(lesson.youtube || '');

                            return (
                              <div
                                key={lId}
                                className={`lesson-item ${isActive ? "active" : ""}`}
                                onClick={() => setActiveLessonId(isActive ? null : lId)}
                              >
                                <div className="lesson-row">
                                  <span className="lesson-num">{i + 1}</span>
                                  <img
                                    src={vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : 'https://via.placeholder.com/110x68?text=Ders'}
                                    className="lesson-thumb-sm"
                                    alt="thumb"
                                  />
                                  <div className="lesson-info-dyn">
                                    <h4>{lesson.title || `${mainLabel} ${dayNum} - Ders ${i + 1}`}</h4>
                                  </div>
                                  {lesson.notes_link && (
                                    <a
                                      href={lesson.notes_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="lesson-notes-btn"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      📄 Ders Notu
                                    </a>
                                  )}
                                </div>

                                {isActive && vid && (
                                  <div className="lesson-player-container" style={{ display: 'block' }}>
                                    <button
                                      className="lesson-close-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveLessonId(null);
                                      }}
                                      title="Kapat"
                                    >
                                      &times;
                                    </button>
                                    <iframe
                                      src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`}
                                      allowFullScreen
                                      allow="autoplay; encrypted-media"
                                    />
                                    {lesson.notes_link && (
                                      <a
                                        href={lesson.notes_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="lesson-notes-under"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        📄 Ders Notu İndir
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
            )
          )}

          {/* TAB: KİTAPLAR */}
          {activeTab === "kitaplar" && (
            <div>
              {normalizedBooks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Bu kampa ait kitaplar yakında eklenecek.</p>
              ) : (
                <div className="egitim-books-grid">
                  {normalizedBooks.map((book: any) => (
                    <BookCard key={book.id} book={book.attributes ? { id: book.id, ...book.attributes } : book} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="egitim-sidebar">
          {normalizedInstructors.length > 0 && (
            <div className="sidebar-card">
              <h3>👨‍🏫 Youtuber Hocalarımız</h3>
              <div>
                {normalizedInstructors.map((inst: any, idx: number) => {
                  const instPhoto = toMediaUrl(inst.photo?.url || inst.photo?.formats?.thumbnail?.url);
                  return (
                    <div
                      key={inst.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        paddingBottom: idx !== normalizedInstructors.length - 1 ? '14px' : '0',
                        marginBottom: idx !== normalizedInstructors.length - 1 ? '14px' : '0',
                        borderBottom: idx !== normalizedInstructors.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none'
                      }}
                    >
                      {instPhoto ? (
                        <img
                          src={instPhoto}
                          alt={inst.name}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '3px solid var(--primary)',
                            boxShadow: '0 4px 16px rgba(37,99,235,0.18)'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            flexShrink: 0
                          }}
                        >
                          👨‍🏫
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                          {inst.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {inst.youtube && (
                            <a 
                              href={inst.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#ff0000', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                padding: '4px 10px', borderRadius: '20px', textDecoration: 'none'
                              }}
                            >
                              ▶ YouTube Kanalı
                            </a>
                          )}
                          {inst.instagram && (
                            <a 
                              href={inst.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'radial-gradient(circle at 30% 110%, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)', 
                                color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                                padding: '4px 10px', borderRadius: '20px', textDecoration: 'none'
                              }}
                            >
                              Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="sidebar-card">
            <h3>📊 Kamp Detayları</h3>
            <div className="detail-row">
              <span className="detail-label">Toplam Ders</span>
              <span className="detail-val">{totalLessons}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Seviye</span>
              <span className="detail-val">Tüm Seviyeler</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>🔗 YouTube'da İzle</h3>
            <a
              href={playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              ▶ Oynatma Listesini Aç
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
