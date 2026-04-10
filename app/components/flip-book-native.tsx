"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface FlipBookNativeProps {
  pdfUrl: string;
  accentColor?: string;
}

export default function FlipBookNative({ pdfUrl, accentColor = "#4289F7" }: FlipBookNativeProps) {
  const [pages, setPages] = useState<string[]>([]); // base64 image URLs per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSpread, setCurrentSpread] = useState(0); // index of left page in spread
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev" | null>(null);
  const [isCinema, setIsCinema] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_PAGES = 20; // Demo sınırı

  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const numPages = Math.min(pdf.numPages, MAX_PAGES);
        setTotalPages(pdf.numPages);

        const renderedPages: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport } as any).promise;
          renderedPages.push(canvas.toDataURL("image/jpeg", 0.85));
        }

        setPages(renderedPages);
      } catch (err) {
        console.error("PDF yükleme hatası:", err);
        setError("PDF yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  const goNext = useCallback(() => {
    if (isFlipping || currentSpread + 2 >= pages.length) return;
    setFlipDir("next");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread(p => Math.min(p + 2, pages.length - 1));
      setIsFlipping(false);
      setFlipDir(null);
    }, 500);
  }, [isFlipping, currentSpread, pages.length]);

  const goPrev = useCallback(() => {
    if (isFlipping || currentSpread <= 0) return;
    setFlipDir("prev");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread(p => Math.max(p - 2, 0));
      setIsFlipping(false);
      setFlipDir(null);
    }, 500);
  }, [isFlipping, currentSpread]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isCinema) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setIsCinema(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCinema, goNext, goPrev]);

  const leftPage = pages[currentSpread];
  const rightPage = pages[currentSpread + 1];
  const spreadLabel = `${currentSpread + 1}${rightPage ? `–${currentSpread + 2}` : ""} / ${pages.length}`;

  if (loading) {
    return (
      <div className="flipbook-loading">
        <div className="flipbook-spinner" style={{ borderTopColor: accentColor }} />
        <p>Sayfalar hazırlanıyor...</p>
      </div>
    );
  }

  if (error) {
    return <div className="flipbook-error"><span>⚠️</span> {error}</div>;
  }

  if (pages.length === 0) {
    return <div className="flipbook-error"><span>📄</span> Bu kitap için henüz demo sayfası yüklenmemiş.</div>;
  }

  const viewer = (
    <div className={`flipbook-viewer ${isCinema ? "cinema-mode" : ""}`} ref={containerRef}>
      {isCinema && (
        <button className="cinema-close" onClick={() => setIsCinema(false)}>✕ Kapat</button>
      )}

      {/* The Spread (two pages side by side) */}
      <div className={`flipbook-spread ${flipDir ? `flip-${flipDir}` : ""}`}>
        {/* Left page */}
        <div className="flipbook-page flipbook-page-left">
          {leftPage ? <img src={leftPage} alt={`Sayfa ${currentSpread + 1}`} /> : <div className="flipbook-page-blank" />}
          <div className="page-shadow-left" />
        </div>
        {/* Center spine */}
        <div className="flipbook-spine" />
        {/* Right page */}
        <div className="flipbook-page flipbook-page-right">
          {rightPage ? <img src={rightPage} alt={`Sayfa ${currentSpread + 2}`} /> : <div className="flipbook-page-blank" />}
          <div className="page-shadow-right" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flipbook-nav">
        <button className="flipbook-btn-nav" onClick={goPrev} disabled={currentSpread === 0}>‹</button>
        <span className="flipbook-page-label">{spreadLabel}</span>
        <button className="flipbook-btn-nav" onClick={goNext} disabled={currentSpread + 2 >= pages.length}>›</button>
      </div>

      {totalPages > MAX_PAGES && (
        <p className="flipbook-demo-note">📖 Demo: İlk {MAX_PAGES} sayfa gösteriliyor. Tam kitap için satın alabilirsiniz.</p>
      )}
    </div>
  );

  return (
    <div className="flipbook-container">
      {!isCinema && (
        <div className="flipbook-toolbar">
          <button className="flipbook-cinema-btn" onClick={() => setIsCinema(true)} style={{ borderColor: accentColor, color: accentColor }}>
            🎬 Sinema Modunda İncele
          </button>
        </div>
      )}
      {viewer}
      {isCinema && <div className="cinema-backdrop" onClick={() => setIsCinema(false)} />}
    </div>
  );
}
