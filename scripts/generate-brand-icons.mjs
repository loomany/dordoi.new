import fs from "node:fs";
import sharp from "sharp";

const svg = fs.readFileSync("public/brand/icon.svg");

const outputs = [
  ["public/favicon.ico", 32],
  ["public/apple-touch-icon.png", 180],
  ["public/brand/logo-192.png", 192],
  ["public/brand/logo-512.png", 512],
];

for (const [out, size] of outputs) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("ok", out);
}
