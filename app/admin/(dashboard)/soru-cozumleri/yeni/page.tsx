import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import VideoForm from "../video-form";

export const metadata = { title: "Yeni Video Çözümü | Admin" };

export default async function NewVideoPage() {
  const token = await requireAdminToken();

  const booksRes = await adminGet("/books?fields[0]=title&fields[1]=documentId&sort=title:asc&pagination[pageSize]=100", token);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <Link href="/admin/soru-cozumleri" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Soru Çözümleri
          </Link>
          <h1><span className="ms">video_call</span> Yeni Video Çözümü</h1>
          <p>Sisteme yeni bir video çözüm kaydı ekleyin</p>
        </div>
      </div>

      <div className="admin-content">
        <VideoForm books={booksRes.data?.data || []} />
      </div>
    </>
  );
}
