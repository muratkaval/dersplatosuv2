import { requireAdminToken } from "../../lib/auth";
import { adminGet } from "../../lib/strapi-admin";
import Link from "next/link";
import VideoForm from "../video-form";

export const metadata = { title: "Yeni Video Çözümü | Admin" };

export default async function YeniVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string }>;
}) {
  const { book } = await searchParams;
  const token = await requireAdminToken();

  const booksRes = await adminGet(
    "/books?fields[0]=title&fields[1]=documentId&sort=title:asc&pagination[pageSize]=100",
    token
  );
  const books = booksRes.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <Link href="/admin/soru-cozumleri" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Soru Çözümleri
          </Link>
          <h1><span className="ms">video_call</span> Yeni Video Çözümü</h1>
          <p>Yeni bir video çözümü ekle</p>
        </div>
      </div>

      <div className="admin-content">
        <VideoForm books={books} defaultBookId={book} />
      </div>
    </>
  );
}
