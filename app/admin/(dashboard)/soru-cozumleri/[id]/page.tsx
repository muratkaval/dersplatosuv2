import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import VideoForm from "../video-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditVideoPage({ params }: Props) {
  const { id } = await params;
  const token = await requireAdminToken();

  const [videoRes, booksRes] = await Promise.all([
    adminGet(`/solution-videos/${id}?populate=*`, token),
    adminGet("/books?fields[0]=title&fields[1]=documentId&sort=title:asc&pagination[pageSize]=100", token),
  ]);

  const video = videoRes.data?.data;
  if (!video) return notFound();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/soru-cozumleri" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">edit</span> Video Çözümünü Düzenle</h1>
          <p>{video.book?.title} - {video.baslik}</p>
        </div>
      </div>

      <div className="admin-content">
        <VideoForm video={video} books={booksRes.data?.data || []} />
      </div>
    </>
  );
}
