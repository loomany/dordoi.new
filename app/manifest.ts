import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dordoi.help",
    short_name: "Dordoi",
    description: "Оптовая платформа рынка Дордой",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0891b2",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
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
