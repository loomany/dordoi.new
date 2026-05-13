import { ImageResponse } from "next/og";

import { brandMarkImageJsx } from "@/lib/brand/brand-mark-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(brandMarkImageJsx({ sizePx: size.width }), { ...size });
}
