import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** Stable project root — avoids Turbopack mis-inferring `app/` as workspace root (Windows). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseStorageRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    return [];
  }
  try {
    const host = new URL(raw).hostname;
    return [
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

/** Импорт заявок из 2GIS — превью в админке (`VendorModerationView`). */
function twoGisPhotoRemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  return [
    {
      protocol: "https",
      hostname: "*.photo.2gis.com",
      pathname: "/**",
    },
  ];
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon" },
      { source: "/apple-touch-icon.png", destination: "/apple-icon" },
    ];
  },
  images: {
    remotePatterns: [
      ...supabaseStorageRemotePatterns(),
      ...twoGisPhotoRemotePatterns(),
    ],
  },
  experimental: {
    // Включаем экспериментальные `unauthorized()` / `forbidden()` —
    // их используют наши server actions модерации (vendor-moderation,
    // vendor-photo-batch-moderation), чтобы корректно прерывать RSC при
    // отсутствии админской сессии.
    authInterrupts: true,
    // Подстраховка от ошибки Next 16 «x-forwarded-host does not match origin»
    // в dev/прокси-окружениях: разрешаем явно тот же hostname, на котором
    // мы слушаем локально и в проде.
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "dordoi.help",
        "www.dordoi.help",
      ],
    },
  },
};

export default withNextIntl(nextConfig);
