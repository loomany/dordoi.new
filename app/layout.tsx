import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { SiteBrandJsonLd } from "@/components/seo/SiteBrandJsonLd";
import { htmlLangFromRouteLocale } from "@/lib/hreflang";
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
      { url: "/favicon.ico", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/brand/logo-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
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
      <body className="flex min-h-dvh flex-col">
        <SiteBrandJsonLd />
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
