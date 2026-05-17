import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dordoi.help",
    short_name: "Dordoi",
    description: "Оптовая платформа рынка Дордой",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicon-120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/brand/logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
