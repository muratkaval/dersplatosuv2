import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getGlobalSettings, toMediaUrl } from "@/app/lib/strapi";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

export async function generateMetadata(): Promise<Metadata> {
  let settings: any = null;
  try {
    const res = await getGlobalSettings();
    settings = res?.attributes || res || {};
  } catch (err) {
    console.error("Failed to fetch global settings for SEO:", err);
    settings = {};
  }

  const siteName = settings.siteName || "Ders Platosu";
  const defaultTitle = settings.ogTitle || "Ders Platosu - TYT AYT Ücretsiz Eğitim Platformu";
  const defaultDescription = settings.ogDescription || "TYT ve AYT hazırlığında uzman hocalar, kamp programları, videolu çözümler ve kitaplarla sınava sistemli hazırlan.";
  
  // Custom media from Strapi or fallback
  const shareImgUrl = settings.shareImage ? toMediaUrl(settings.shareImage?.url || settings.shareImage) : null;
  const defaultOgImage = shareImgUrl || "/logo.png";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    applicationName: siteName,
    keywords: settings.keywords 
      ? settings.keywords.split(",").map((k: string) => k.trim())
      : ["ders platosu", "tyt", "ayt", "yks", "online eğitim", "sınav hazırlık", "videolu soru çözümleri"],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName,
      url: "/",
      title: defaultTitle,
      description: defaultDescription,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [defaultOgImage],
    },
    verification: {
      google: settings.googleSearchConsole || undefined,
      yandex: settings.yandexVerification || undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: settings.favicon ? toMediaUrl(settings.favicon?.url || settings.favicon) : "/favicon.ico",
      shortcut: settings.favicon ? toMediaUrl(settings.favicon?.url || settings.favicon) : "/favicon.ico",
      apple: settings.favicon ? toMediaUrl(settings.favicon?.url || settings.favicon) : "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings: any = {};
  try {
    const res = await getGlobalSettings();
    settings = res?.attributes || res || {};
  } catch (err) {
    console.error("Layout fetch error:", err);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="/style.css" />
        {/* Font links removed in favor of next/font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" 
          rel="stylesheet" 
        />
        {/* Dynamic Header Scripts */}
        {settings.headerScripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.headerScripts }} />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        {/* Dynamic Body Top Scripts */}
        {settings.bodyTopScripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.bodyTopScripts }} />
        )}
        
        {children}

        {/* Dynamic Body Bottom Scripts */}
        {settings.bodyBottomScripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.bodyBottomScripts }} />
        )}
      </body>
    </html>
  );
}
