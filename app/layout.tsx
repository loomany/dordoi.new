import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
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
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
