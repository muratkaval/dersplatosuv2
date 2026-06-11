import { notFound } from "next/navigation";
import { PageContainer } from "../components/site-layout";
import { flattenStrapi, getCountdownBySlug, getCountdowns } from "../lib/strapi";
import ExamCountdown from "../components/exam-countdown";
import type { Metadata } from "next";

async function getPageBySlug(slug: string) {
  const token = process.env.STRAPI_TOKEN || "";
  const strapiUrl = (process.env.STRAPI_URL || "http://localhost:1340").replace(/\/api\/?$/, "");
  try {
    const res = await fetch(
      `${strapiUrl}/api/pages?filters[slug][$eq]=${slug}&pagination[pageSize]=1`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return flattenStrapi(data?.data?.[0] || null);
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const countdowns = await getCountdowns();
  return countdowns.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const countdown = await getCountdownBySlug(slug);
  if (countdown) {
    return {
      title: countdown.metaTitle || countdown.title,
      description: countdown.metaDescription || countdown.description || countdown.title,
    };
  }

  const page = await getPageBySlug(slug);
  if (page) {
    return {
      title: page.title,
      description: page.title,
    };
  }

  return {};
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) Countdown'u dene
  const countdown = await getCountdownBySlug(slug);
  if (countdown && countdown.enabled !== false) {
    return (
      <PageContainer>
        <ExamCountdown countdown={countdown} />
      </PageContainer>
    );
  }

  // 2) Strapi pages'i dene
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <PageContainer>
      <section className="page-hero" style={{ padding: "60px 0 40px" }}>
        <div className="page-hero-inner">
          <h1>{page.title}</h1>
        </div>
      </section>

      <section style={{ padding: "20px 0 80px" }}>
        <div className="container" style={{ maxWidth: "820px" }}>
          <div
            className="page-content"
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        </div>
      </section>
    </PageContainer>
  );
}
