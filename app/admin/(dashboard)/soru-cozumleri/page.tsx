import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import BookGrid from "./book-grid";
import BookVideos from "./book-videos";

export const metadata = { title: "Soru Çözümleri | Admin" };

export default async function SoruCozumleriPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book: selectedBook } = await searchParams;
  const token = await requireAdminToken();

  if (selectedBook) {
    // ── Book detail view ──────────────────────────────────────────
    const [bookRes, videosRes] = await Promise.all([
      adminGet(`/books/${selectedBook}?fields[0]=title&fields[1]=documentId&populate[cover][fields][0]=url`, token),
      adminGet(
        `/solution-videos?filters[book][documentId][$eq]=${selectedBook}&sort[0]=bolum_no:asc&sort[1]=sira:asc&pagination[pageSize]=200`,
        token
      ),
    ]);

    const book = bookRes.data?.data || bookRes.data;
    const videos = videosRes.data?.data || [];

    return (
      <>
        <div className="admin-topbar">
          <div className="topbar-title">
            <a
              href="/admin/soru-cozumleri"
              style={{ color: "#475569", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "4px", textDecoration: "none" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Kitap Seçimine Dön
            </a>
            <h1><span className="ms">play_circle</span> {book?.title || "Soru Çözümleri"}</h1>
            <p>Bu kitaba ait soru çözüm videoları</p>
          </div>
        </div>

        <div className="admin-content">
          <BookVideos book={book} videos={videos} selectedBook={selectedBook} />
        </div>
      </>
    );
  }

  // ── Book selection view ───────────────────────────────────────
  const booksRes = await adminGet(
    "/books?fields[0]=title&fields[1]=documentId&sort=title:asc&pagination[pageSize]=100&populate[cover][fields][0]=url&populate[subjects][fields][0]=name",
    token
  );
  const books = booksRes.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">play_circle</span> Soru Çözümleri</h1>
          <p>Aşağıdan bir kitap seçerek çözüm videolarını yönetin</p>
        </div>
      </div>

      <div className="admin-content">
        <BookGrid books={books} />
      </div>
    </>
  );
}
