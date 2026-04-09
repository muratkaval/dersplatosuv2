"use client";

import { useState, useEffect } from "react";
import { toMediaUrl } from "@/app/lib/strapi";

interface Props {
  book: any;
  subject: any;
  subjectSlug: string;
  videos: any[];
}

export default function VideoPlayerView({ book, subject, subjectSlug, videos }: Props) {
  const [activeVideo, setActiveVideo] = useState<any>(videos[0] || null);
  const [openChapters, setOpenChapters] = useState<string[]>(
    videos[0]?.bolum_adi ? [videos[0].bolum_adi] : []
  );

  const toggleChapter = (chapterName: string) => {
    setOpenChapters(prev =>
      prev.includes(chapterName)
        ? prev.filter(c => c !== chapterName)
        : [...prev, chapterName]
    );
  };

  // Group videos by chapter
  const chaptersMap: Record<string, any[]> = {};
  videos.forEach(v => {
    const chName = v.bolum_adi || "Bölüm";
    if (!chaptersMap[chName]) chaptersMap[chName] = [];
    chaptersMap[chName].push(v);
  });

  return (
    <div className="player-container">
      <div className="player-book-banner">
        <img
          src={toMediaUrl(book.cover?.url || "") || "https://via.placeholder.com/200x280?text=Kitap"}
          alt={book.title}
          className="player-book-cover"
        />
        <div className="player-book-info">
          <span className="sc-hero-badge green" style={{ marginBottom: "10px", display: "inline-block" }}>✓ Ücretsiz</span>
          <h2>{book.title}</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Bölüme bas → testler açılır → teste bas → video izle.</p>
        </div>
      </div>

      {activeVideo && (
        <div className="video-wrapper">
          <iframe
            key={activeVideo.youtube_id}
            src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?autoplay=1&rel=0`}
            title="Soru Çözümü"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      )}

      <div className="accordion-title">BÖLÜMLER VE TESTLER</div>
      <div className="chapter-list">
        {Object.entries(chaptersMap).map(([chName, tests]) => (
          <div key={chName} className="chapter-item">
            <div className="chapter-header" onClick={() => toggleChapter(chName)}>
              <span className="chapter-name">{chName}</span>
              <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                {tests.length} test {openChapters.includes(chName) ? "▲" : "▼"}
              </span>
            </div>
            {openChapters.includes(chName) && (
              <div className="chapter-tests">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className={`test-item ${activeVideo?.id === test.id ? "active" : ""}`}
                    onClick={() => setActiveVideo(test)}
                  >
                    {test.baslik || "Test"}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {Object.keys(chaptersMap).length === 0 && (
          <div style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
            Bu kitap için henüz video yüklenmemiş.
          </div>
        )}
      </div>
    </div>
  );
}
