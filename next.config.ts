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

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: supabaseStorageRemotePatterns(),
  },
};

export default withNextIntl(nextConfig);
