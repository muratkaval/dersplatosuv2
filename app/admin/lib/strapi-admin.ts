const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
export const STRAPI_API_BASE = `${strapiOrigin}/api`;

// Always use the full-access API token for Strapi requests.
// The user JWT (stored in cookie) is used only to verify the admin
// session in Next.js — not for actual Strapi API calls.
function getStrapiToken(): string {
  return (process.env.STRAPI_TOKEN || "").trim();
}

export const STRAPI_UNREACHABLE_MESSAGE =
  "Strapi sunucusuna bağlanılamadı. Sunucu yeniden başlıyor olabilir, birkaç saniye sonra tekrar deneyin.";

export async function strapiAdminFetch(
  path: string,
  options: RequestInit = {},
  _userToken?: string  // kept for back-compat, but STRAPI_TOKEN is used
) {
  const token = getStrapiToken();
  try {
    const res = await fetch(`${STRAPI_API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    const contentType = res.headers.get("content-type") || "";
    const hasBody = contentType.includes("application/json") && res.status !== 204;
    const data = hasBody ? await res.json() : {};
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Strapi kapaliysa ya da yeniden basliyorsa fetch throw eder. Bunu yukari
    // birakirsak cagiran Server Component komple coker (kirmizi hata ekrani).
    // Yapisal hata donerek sayfalarin bos/uyarili render olmasini sagliyoruz;
    // API rotalari da zaten res.ok kontrol edip 503 ve bu mesaji donuyor.
    console.error(`[strapi-admin] ${path} istegi basarisiz:`, err);
    return {
      ok: false,
      status: 503,
      data: { error: { message: STRAPI_UNREACHABLE_MESSAGE } },
    };
  }
}

export async function adminGet(path: string, token: string) {
  return strapiAdminFetch(path, { method: "GET" }, token);
}

export async function adminPost(path: string, body: object, token: string) {
  return strapiAdminFetch(
    path,
    {
      method: "POST",
      body: JSON.stringify({ data: { ...body, publishedAt: new Date().toISOString() } }),
    },
    token
  );
}

export async function adminPut(path: string, body: object, token: string) {
  return strapiAdminFetch(
    path,
    {
      method: "PUT",
      body: JSON.stringify({ data: body }),
    },
    token
  );
}

export async function adminDelete(path: string, token: string) {
  return strapiAdminFetch(path, { method: "DELETE" }, token);
}

// Upload a file to Strapi media library
export async function adminUpload(file: File, token: string) {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch(`${STRAPI_API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return res.json();
}

// Login to Strapi
export async function strapiLogin(identifier: string, password: string) {
  const res = await fetch(`${STRAPI_API_BASE}/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
    cache: "no-store",
  });
  return res.json();
}
