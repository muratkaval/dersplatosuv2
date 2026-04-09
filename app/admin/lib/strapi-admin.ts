const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
export const STRAPI_API_BASE = `${strapiOrigin}/api`;

export async function strapiAdminFetch(
  path: string,
  options: RequestInit = {},
  token: string
) {
  const res = await fetch(`${STRAPI_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
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
