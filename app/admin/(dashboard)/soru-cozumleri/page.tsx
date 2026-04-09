import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";

import BookSelector from "./book-selector";

export const metadata = { title: "Soru Çözümleri | Admin" };

export default async function SoruCozumleriPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book: selectedBook } = await searchParams;
  const token = await requireAdminToken();

  const [booksRes, videosRes] = await Promise.all([
    adminGet("/books?fields[0]=title&fields[1]=documentId&sort=title:asc&pagination[pageSize]=100", token),
    selectedBook
      ? adminGet(
          `/solution-videos?filters[book][documentId][$eq]=${selectedBook}&sort[0]=bolum_no:asc&sort[1]=sira:asc&pagination[pageSize]=200&populate[book][fields][0]=title`,
          token
        )
      : Promise.resolve({ data: { data: [] }, ok: true, status: 200 }),
  ]);

  const books = booksRes.data?.data || [];
  const videos = videosRes.data?.data || [];

  // Group by chapter
  const chapters: Record<string, any[]> = {};
  videos.forEach((v: any) => {
    const ch = v.bolum_adi || "Bölüm";
    if (!chapters[ch]) chapters[ch] = [];
    chapters[ch].push(v);
  });

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">play_circle</span> Soru Çözümleri</h1>
          <p>Kitap bazlı video çözüm yönetimi</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/soru-cozumleri/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Video
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {/* Kitap seçici */}
        <div className="info-card" style={{ marginBottom: "20px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kitap Seçin</label>
            <BookSelector books={books} selectedBook={selectedBook || ""} />
          </div>
        </div>

        {/* Video listesi */}
        {!selectedBook ? (
          <div className="empty-state">
            <span className="ms">menu_book</span>
            Yukarıdan bir kitap seçin
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <span className="ms">play_circle</span>
            Bu kitap için henüz video yüklenmemiş
            <br />
            <Link href="/admin/soru-cozumleri/yeni" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>
              <span className="ms">add</span> İlk Videoyu Ekle
            </Link>
          </div>
        ) : (
          Object.entries(chapters).map(([chName, tests]) => (
            <div key={chName} className="info-card" style={{ marginBottom: "14px" }}>
              <div className="card-title">
                <span className="ms">folder_open</span>
                {chName}
                <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 400 }}>
                  &nbsp;· {tests.length} video
                </span>
              </div>
              <div className="table-card" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Sıra</th>
                      <th>Başlık</th>
                      <th>YouTube ID</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((v: any) => (
                      <tr key={v.documentId || v.id}>
                        <td style={{ color: "#60a5fa", fontWeight: 700, width: "60px" }}>{v.sira}</td>
                        <td style={{ color: "var(--text)" }}>{v.baslik || "—"}</td>
                        <td>
                          <a
                            href={`https://youtu.be/${v.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#60a5fa", fontSize: "0.8rem" }}
                          >
                            {v.youtube_id}
                          </a>
                        </td>
                        <td>
                          <div className="td-actions">
                            <Link href={`/admin/soru-cozumleri/${v.documentId || v.id}`} className="btn btn-ghost btn-sm btn-icon">
                              <span className="ms">edit</span>
                            </Link>
                            <Link href={`/admin/soru-cozumleri/${v.documentId || v.id}/sil`} className="btn btn-danger btn-sm btn-icon">
                              <span className="ms">delete</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

