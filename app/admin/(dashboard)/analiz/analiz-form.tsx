"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toMediaUrl, CORE_NET_BRANCHES, NET_BRANCH_SHORT, type NetBranch } from "@/app/lib/strapi";

const ALL_BRANCHES: NetBranch[] = [...CORE_NET_BRANCHES, "sosyal"];

const fieldStyle: React.CSSProperties = {
  padding: "10px",
  background: "#060d1a",
  border: "1px solid #1e3a5f",
  color: "#e2e8f0",
  borderRadius: "6px",
  outline: "none",
  width: "100%",
};

function slugify(t: string) {
  return t
    .toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Yükleme hatasında sebebi de döndürür; "yüklenemedi" deyip susmak yerine
// panelde gerçek nedeni gösterebilmek için.
async function uploadFile(file: File): Promise<{ id: number } | { error: string }> {
  if (file.size > 10 * 1024 * 1024) {
    return { error: `dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }
  const fd = new FormData();
  fd.append("files", file);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // JSON değil; ham metni kısaltıp göster.
    }
    if (!res.ok) {
      const msg =
        data?.error?.message ||
        (typeof data?.error === "string" ? data.error : null) ||
        text.slice(0, 120);
      return { error: `HTTP ${res.status} — ${msg || "sunucu yanıtı boş"}` };
    }
    const id = Array.isArray(data) ? data[0]?.id : data?.id;
    if (!id) return { error: "sunucu dosya kimliği döndürmedi" };
    return { id };
  } catch {
    return { error: "sunucuya ulaşılamadı" };
  }
}

export default function AnalizForm({ analysis }: { analysis?: any }) {
  const router = useRouter();
  const isEdit = !!analysis?.documentId;

  const [title, setTitle] = useState(analysis?.title || "");
  const [slug, setSlug] = useState(analysis?.slug || "");
  const [description, setDescription] = useState(analysis?.description || "");

  const [esik, setEsik] = useState<Record<string, string>>({
    mat: String(analysis?.matEsik ?? 15),
    turkce: String(analysis?.turkceEsik ?? 20),
    fen: String(analysis?.fenEsik ?? 10),
    sosyal: String(analysis?.sosyalEsik ?? 10),
  });
  const [sosyalEnabled, setSosyalEnabled] = useState(!!analysis?.sosyalEnabled);
  const [collectSosyal, setCollectSosyal] = useState(analysis?.collectSosyal !== false);
  const [isActive, setIsActive] = useState(analysis?.isActive !== false);

  const [bannerEnabled, setBannerEnabled] = useState(!!analysis?.bannerEnabled);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(toMediaUrl(analysis?.banner?.url));
  const [imageCleared, setImageCleared] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const comboCount = sosyalEnabled ? 16 : 8;

  function esikOf(b: NetBranch): number {
    const v = parseInt(esik[b], 10);
    return Number.isFinite(v) && v > 0 ? v : 1;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Başlık zorunlu", "error");
      return;
    }
    setSaving(true);
    try {
      // Yeni dosya seçildiyse yükle; seçilmediyse alanı hiç göndermeyip
      // mevcut görseli olduğu gibi bırak. Kaldır denmişse null gönder.
      let imagePatch: Record<string, unknown> = {};
      if (imageFile) {
        const up = await uploadFile(imageFile);
        if ("error" in up) {
          showToast(`Görsel yüklenemedi: ${up.error}`, "error");
          return;
        }
        imagePatch = { banner: up.id };
      } else if (imageCleared) {
        imagePatch = { banner: null };
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        description,
        matEsik: esikOf("mat"),
        turkceEsik: esikOf("turkce"),
        fenEsik: esikOf("fen"),
        sosyalEsik: esikOf("sosyal"),
        sosyalEnabled,
        collectSosyal: sosyalEnabled ? true : collectSosyal,
        bannerEnabled,
        isActive,
        ...imagePatch,
      };

      const res = await fetch(
        isEdit ? `/api/admin/analyses/${analysis.documentId}` : "/api/admin/analyses",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || "Kayıt hatası", "error");
        return;
      }
      showToast(isEdit ? "Analiz güncellendi ✓" : "Analiz oluşturuldu ✓");
      setImageFile(null);
      setImageCleared(false);
      if (isEdit) {
        router.refresh();
      } else {
        const created = data?.data?.data || data?.data;
        setTimeout(
          () => router.push(created?.documentId ? `/admin/analiz/${created.documentId}` : "/admin/analiz"),
          800
        );
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="info-card" style={{ marginBottom: "20px" }}>
        <div
          className="card-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}
        >
          <span><span className="ms">tune</span> Analiz Ayarları</span>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <span className="ms">save</span> {saving ? "Kaydediliyor…" : isEdit ? "Kaydet" : "Oluştur"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="form-group" style={{ flex: 1, minWidth: "220px" }}>
            <label>Başlık</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }}
              placeholder="Örn: Maarif Denemesi 3. Etap"
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: "220px" }}>
            <label>URL Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#64748b", fontSize: "0.78rem", whiteSpace: "nowrap" }}>/analiz/</span>
              <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="maarif-3-etap" />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Sayfa başlığının altında görünür."
            style={fieldStyle}
          />
        </div>

        <p style={{ fontSize: "0.74rem", color: "#64748b", margin: "6px 0 12px", lineHeight: 1.55 }}>
          Öğrencinin neti eşiğe <strong style={{ color: "#94a3b8" }}>eşit veya büyükse</strong> &quot;üstü&quot;,
          küçükse &quot;altı&quot; sayılır. Bu değerler yalnızca bu analizi etkiler.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          {ALL_BRANCHES.map((b) => {
            const off = b === "sosyal" && !sosyalEnabled;
            return (
              <div key={b} className="form-group" style={{ width: "120px", marginBottom: 0, opacity: off ? 0.45 : 1 }}>
                <label>{NET_BRANCH_SHORT[b]} eşiği</label>
                <input
                  type="number"
                  min={1}
                  value={esik[b]}
                  disabled={off}
                  onChange={(e) => setEsik((p) => ({ ...p, [b]: e.target.value }))}
                />
              </div>
            );
          })}

          <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: "0 0 9px", padding: "9px 12px", borderRadius: "8px", background: "#0b1628", border: "1px solid #1e3a5f" }}>
            <input
              type="checkbox"
              checked={sosyalEnabled}
              onChange={(e) => setSosyalEnabled(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>Sosyal dahil</span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                color: sosyalEnabled ? "#c4b5fd" : "#94a3b8",
                background: sosyalEnabled ? "rgba(168,85,247,0.18)" : "rgba(148,163,184,0.14)",
              }}
            >
              {comboCount} kombinasyon
            </span>
          </label>
          {!sosyalEnabled && (
            <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: "0 0 9px", padding: "9px 12px", borderRadius: "8px", background: "#0b1628", border: "1px solid #1e3a5f" }}>
              <input
                type="checkbox"
                checked={collectSosyal}
                onChange={(e) => setCollectSosyal(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>Sosyal kutusu görünsün</span>
            </label>
          )}
        </div>

        <p style={{ fontSize: "0.68rem", color: "#475569", margin: "12px 0 16px", lineHeight: 1.55 }}>
          Sosyal kapalıyken 3 branş → 8 program gerekir; net alınır ama programı etkilemez.
          Açıldığında 4 branş → 16 program gerekir.
        </p>

        {/* Banner */}
        <div style={{ borderTop: "1px dashed #1e3a5f", paddingTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>Banner Görseli</span>
            <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: 0, padding: "8px 12px", borderRadius: "8px", background: "#0b1628", border: "1px solid #1e3a5f" }}>
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>
                {bannerEnabled ? "Banner açık" : "Banner kapalı"}
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                width: "190px",
                height: "48px",
                background: imagePreview ? `url(${imagePreview}) repeat-x center / auto 100%` : "#0f172a",
                border: "1.5px dashed #1e3a5f",
                borderRadius: "8px",
                flexShrink: 0,
              }}
            />
            <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
              <span className="ms">upload</span> Görsel Seç
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  setImageCleared(false);
                  if (f) setImagePreview(URL.createObjectURL(f));
                }}
              />
            </label>
            {imagePreview && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                  setImageCleared(true);
                }}
              >
                <span className="ms">close</span> Kaldır
              </button>
            )}
          </div>
          <p style={{ fontSize: "0.68rem", color: "#475569", margin: "10px 0 0", lineHeight: 1.5 }}>
            Sayfa başlığının hemen altında, ekranı boydan boya kaplayan bir şerit olarak görünür.
            Görsel yatayda tekrarlanır.
          </p>
        </div>

        {/* Yayın durumu */}
        <div style={{ borderTop: "1px dashed #1e3a5f", paddingTop: "16px", marginTop: "16px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: 0 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
              {isActive ? "Yayında" : "Taslak"}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>
              — kapalıyken sitede görünmez, adresi 404 döner
            </span>
          </label>
        </div>
      </div>
    </form>
  );
}
