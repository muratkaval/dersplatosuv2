import { NextRequest } from "next/server";

function getStrapiOrigin() {
  const raw = process.env.STRAPI_URL || "http://localhost:1340";
  return raw.replace(/\/api\/?$/, "");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const origin = getStrapiOrigin();
  const targetPath = Array.isArray(path) ? path.join("/") : "";
  const url = `${origin}/api/${targetPath}${req.nextUrl.search || ""}`;

  const headers: HeadersInit = {};
  const token = process.env.STRAPI_TOKEN || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/json";

  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": contentType,
    },
  });
}
