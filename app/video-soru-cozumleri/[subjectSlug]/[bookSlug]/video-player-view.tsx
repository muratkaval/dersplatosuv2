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
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [openChapters, setOpenChapters] = useState<string[]>([]);

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
                  <div key={test.id} style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className={`test-item ${activeVideo?.id === test.id ? "active" : ""}`}
                      onClick={() => setActiveVideo(activeVideo?.id === test.id ? null : test)}
                      style={{ 
                        borderBottomLeftRadius: activeVideo?.id === test.id ? 0 : '', 
                        borderBottomRightRadius: activeVideo?.id === test.id ? 0 : '' 
                      }}
                    >
                      {test.baslik || "Test"}
                    </div>
                    {activeVideo?.id === test.id && (
                      <div className="video-wrapper" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none", marginBottom: "8px" }}>
                        <iframe
                          key={test.youtube_id}
                          src={`https://www.youtube.com/embed/${test.youtube_id}?autoplay=1&rel=0`}
                          title={test.baslik || "Soru Çözümü"}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                      </div>
                    )}
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
