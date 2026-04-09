"use client";

import { useState, useEffect } from "react";
import { toMediaUrl, getSolutionVideos } from "@/app/lib/strapi";

function toSlug(v: string) {
  return (v || '')
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function SolutionsView({ books, subjects }: { books: any[], subjects: any[] }) {
  const [view, setView] = useState<'categories' | 'books' | 'player'>('categories');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Group books by subject for easy counts/filtering
  const solvedBooks = books.filter(b => b.solution_link || true); // Orijinal sitede tumu varsa biz de gorebiliriz
  
  // Categorization Logic
  const categories = subjects.filter(s => {
    // Sadece icinde kitap olanlari gosterelim
    return solvedBooks.some(b => {
      const bSubs = Array.isArray(b.subjects) ? b.subjects : (b.subjects?.data || []);
      return bSubs.some((bs: any) => bs.id === s.id);
    });
  });

  // Handle Book Selection
  const handleSelectBook = async (book: any) => {
    setSelectedBook(book);
    setLoadingVideos(true);
    setView('player');
    try {
      const vids = await getSolutionVideos(book.documentId || book.id.toString());
      setVideos(vids);
      if (vids.length > 0) {
        setActiveVideo(vids[0]);
        setOpenChapters([vids[0].bolum_adi]);
      }
    } catch (err) {
      console.error("Video yukleme hatasi:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const toggleChapter = (chapterName: string) => {
    setOpenChapters(prev => 
      prev.includes(chapterName) 
        ? prev.filter(c => c !== chapterName) 
        : [...prev, chapterName]
    );
  };

  // Group videos by Chapter
  const chaptersMap: Record<string, any[]> = {};
  videos.forEach(v => {
    const chName = v.bolum_adi || "Bölüm";
    if (!chaptersMap[chName]) chaptersMap[chName] = [];
    chaptersMap[chName].push(v);
  });

  // Level 1: Categories View
  if (view === 'categories') {
    return (
      <div className="category-grid">
        {categories.map(cat => (
          <div key={cat.id} className="category-card" onClick={() => { setSelectedSubject(cat); setView('books'); }}>
            <h3>{cat.name}</h3>
            <p>Kitapları Görüntüle</p>
            <div className="category-arrow">→</div>
          </div>
        ))}
      </div>
    );
  }

  // Level 2: Books in Category
  if (view === 'books') {
    const filteredBooks = solvedBooks.filter(b => {
      const bSubs = Array.isArray(b.subjects) ? b.subjects : (b.subjects?.data || []);
      return bSubs.some((bs: any) => bs.id === selectedSubject.id);
    });

    return (
      <div className="player-container">
        <div className="sc-section-header">
          <button className="btn-back" onClick={() => setView('categories')}>← Tüm Kategoriler</button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedSubject?.name} Kitapları</h2>
        </div>
        <div className="books-all-grid" style={{ minHeight: '400px' }}>
          {filteredBooks.map((book) => (
            <div key={book.id} className="book-item" onClick={() => handleSelectBook(book)} style={{ cursor: 'pointer' }}>
               <div className="book-cover-wrap">
                <img src={toMediaUrl(book.cover?.url || "") || "https://via.placeholder.com/200x280?text=Kitap"} alt={book.title} />
                <div className="solution-badge">VİDEO ÇÖZÜMLÜ</div>
              </div>
              <div className="book-details">
                <h4>{book.title}</h4>
                <div className="btn-solution" style={{ marginTop: 'auto' }}>Video Çözümlerini İzle</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Level 3: Player View
  return (
    <div className="player-container">
      <button className="btn-back" onClick={() => setView('books')} style={{ marginBottom: '20px' }}>← {selectedSubject?.name} Kitaplarına Dön</button>
      
      <div className="player-book-banner">
        <img 
          src={toMediaUrl(selectedBook.cover?.url || "")} 
          alt={selectedBook.title} 
          className="player-book-cover" 
        />
        <div className="player-book-info">
          <span className="sc-hero-badge green" style={{ marginBottom: '10px', display: 'inline-block' }}>✓ Ücretsiz</span>
          <h2>{selectedBook.title}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Bölüme bas → testler açılır → teste bas → video izle.</p>
        </div>
      </div>

      {loadingVideos ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>Videolar Yükleniyor...</div>
      ) : (
        <>
          {activeVideo && (
            <div className="video-wrapper">
              <iframe 
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
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{tests.length} test {openChapters.includes(chName) ? '▲' : '▼'}</span>
                </div>
                {openChapters.includes(chName) && (
                  <div className="chapter-tests">
                    {tests.map((test) => (
                      <div 
                        key={test.id} 
                        className={`test-item ${activeVideo?.id === test.id ? 'active' : ''}`}
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
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Bu kitap için henüz video yüklenmemiş.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
