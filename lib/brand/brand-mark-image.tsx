import type { CSSProperties } from "react";

type BrandMarkImageOptions = {
  sizePx: number;
  /** Outer padding as a fraction of size (default 0). */
  paddingRatio?: number;
};

/** Shared «D» mark for favicon / apple-icon / OG (ImageResponse / Satori). */
export function brandMarkImageJsx({ sizePx, paddingRatio = 0 }: BrandMarkImageOptions) {
  const pad = Math.round(sizePx * paddingRatio);
  const inner = sizePx - pad * 2;
  const radius = Math.max(4, Math.round((inner * 8) / 32));
  const fontSize = Math.max(12, Math.round((inner * 19) / 32));

  const shell: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: paddingRatio > 0 ? "transparent" : "#ffffff",
    padding: pad,
    boxSizing: "border-box",
  };

  const tile: CSSProperties = {
    width: inner,
    height: inner,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    borderRadius: radius,
  };

  const letter: CSSProperties = {
    fontSize,
    fontWeight: 700,
    lineHeight: 1,
    color: "#0891b2",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <div style={shell}>
      <div style={tile}>
        <span style={letter}>D</span>
      </div>
    </div>
  );
}
