import { ImageResponse } from "next/og";

import { brandLogoDataUrl } from "@/lib/brand/brand-logo-data";

export const alt = "Dordoi.help";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #0f172a 0%, #0369a1 42%, #047857 100%)",
          color: "#ffffff",
        }}
      >
        <img src={brandLogoDataUrl()} alt="" width={128} height={128} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Dordoi.help
          </div>
          <div style={{ fontSize: 30, opacity: 0.88 }}>B2B · Dordoi</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
