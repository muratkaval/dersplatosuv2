// Tum panel sayfalarinin ustunde gorunur. strapiAdminFetch artik baglanti
// hatasinda throw etmiyor; bu yuzden Strapi kapaliyken sayfalar cokmez ama
// listeler bos gorunur. Bu bant bos listenin sebebini soyler.
export default async function StrapiStatusBanner() {
  const base = (process.env.STRAPI_URL || "http://localhost:1340").replace(/\/api\/?$/, "");

  let reachable = true;
  try {
    const res = await fetch(`${base}/_health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    reachable = res.ok;
  } catch {
    reachable = false;
  }

  if (reachable) return null;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        margin: "16px 24px 0",
        padding: "12px 16px",
        borderRadius: "8px",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "#fca5a5",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      <span className="ms" style={{ fontSize: "20px", flexShrink: 0 }}>cloud_off</span>
      <span>
        <strong>Strapi sunucusuna bağlanılamıyor.</strong>{" "}
        Sunucu yeniden başlıyor olabilir; listeler boş görünecek ve kayıt işlemleri
        çalışmayacaktır. Birkaç saniye sonra sayfayı yenileyin.
      </span>
    </div>
  );
}
