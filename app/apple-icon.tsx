import { ImageResponse } from "next/og";

import { brandMarkImageJsx } from "@/lib/brand/brand-mark-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandMarkImageJsx({ sizePx: size.width }), { ...size });
}
