import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SiteBrandJsonLd } from "@/components/seo/SiteBrandJsonLd";
import {
  GoogleTagManagerBody,
  GoogleTagManagerHead,
} from "@/components/seo/GoogleTagManager";
import { YandexMetrikaBody, YandexMetrikaHead } from "@/components/seo/YandexMetrika";
import { htmlLangFromRouteLocale } from "@/lib/hreflang";
import { YANDEX_WEBMASTER_VERIFICATION_ID } from "@/lib/seo/yandex-webmaster-verification";
import { baseUrl, siteIndexable } from "@/lib/site";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  ...(!siteIndexable()
    ? {
        robots: {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        },
      }
    : {}),
  metadataBase: new URL(baseUrl()),
  title: {
    default: "Dordoi.help",
    template: "%s | Dordoi.help",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/logo-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    yandex: YANDEX_WEBMASTER_VERIFICATION_ID,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const routeLocale = headersList.get("x-dordoi-route-locale") ?? "ru";
  const htmlLang = htmlLangFromRouteLocale(routeLocale);

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} min-h-dvh h-full antialiased`}
    >
      <head>
        <YandexMetrikaHead />
        <GoogleTagManagerHead />
      </head>
      <body className="flex min-h-dvh flex-col">
        <YandexMetrikaBody />
        <GoogleTagManagerBody />
        <GoogleAnalytics />
        <SiteBrandJsonLd />
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
