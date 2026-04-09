import Link from "next/link";
import { PageContainer } from "../components/site-layout";

export default function VideoSoruCozumleriPage() {
  return (
    <PageContainer>
      <section style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Videolu Soru Cozumleri</h1>
          </div>
          <p className="section-desc" style={{ marginBottom: "20px" }}>
            Bu alan Next.js'e tasindi. Kategori bazli icerik akisini Strapi'den okuyarak genisletebiliriz.
          </p>
          <Link href="/kitaplar" className="btn-primary">Kitaplara Git</Link>
        </div>
      </section>
    </PageContainer>
  );
}
