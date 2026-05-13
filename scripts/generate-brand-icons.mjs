import fs from "node:fs";
import sharp from "sharp";

const svg = fs.readFileSync("public/brand/icon.svg");

function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const outputs = [
  ["public/favicon-32.png", 32, "png"],
  ["public/apple-touch-icon.png", 180, "png"],
  ["public/brand/logo-192.png", 192, "png"],
  ["public/brand/logo-512.png", 512, "png"],
];

for (const [out, size, format] of outputs) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("ok", out);
}

const faviconPng = await sharp(svg).resize(32, 32).png().toBuffer();
fs.writeFileSync("public/favicon.ico", pngToIco(faviconPng, 32));
console.log("ok", "public/favicon.ico");

fs.copyFileSync("public/brand/icon.svg", "public/apple-icon.svg");
console.log("ok", "public/apple-icon.svg");
