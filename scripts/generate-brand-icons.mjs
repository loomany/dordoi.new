import fs from "node:fs";
import sharp from "sharp";

const svg = fs.readFileSync("public/brand/icon.svg");

/** Encode RGBA as classic BMP-in-ICO (not PNG-in-ICO) for older crawlers e.g. YandexFavicons. */
function encodeBmpIcoEntry(rgba, width, height) {
  const xorRowBytes = width * 4;
  const andRowBytes = Math.ceil(width / 32) * 4;
  const xorSize = xorRowBytes * height;
  const andSize = andRowBytes * height;

  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0);
  dibHeader.writeInt32LE(width, 4);
  dibHeader.writeInt32LE(height * 2, 8);
  dibHeader.writeUInt16LE(1, 12);
  dibHeader.writeUInt16LE(32, 14);
  dibHeader.writeUInt32LE(0, 16);
  dibHeader.writeUInt32LE(xorSize + andSize, 20);

  const xor = Buffer.alloc(xorSize);
  for (let y = 0; y < height; y += 1) {
    const srcY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const src = (srcY * width + x) * 4;
      const dst = y * xorRowBytes + x * 4;
      xor[dst] = rgba[src + 2];
      xor[dst + 1] = rgba[src + 1];
      xor[dst + 2] = rgba[src];
      xor[dst + 3] = rgba[src + 3];
    }
  }

  const and = Buffer.alloc(andSize);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (alpha >= 128) continue;
      const row = height - 1 - y;
      and[row * andRowBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }

  return Buffer.concat([dibHeader, xor, and]);
}

function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let offset = 6 + dirSize;
  const dir = Buffer.alloc(dirSize);
  const images = [];

  entries.forEach(({ size, imageData }, index) => {
    const entryOffset = index * 16;
    dir[entryOffset] = size >= 256 ? 0 : size;
    dir[entryOffset + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, entryOffset + 4);
    dir.writeUInt16LE(32, entryOffset + 6);
    dir.writeUInt32LE(imageData.length, entryOffset + 8);
    dir.writeUInt32LE(offset, entryOffset + 12);
    offset += imageData.length;
    images.push(imageData);
  });

  return Buffer.concat([header, dir, ...images]);
}

const outputs = [
  ["public/favicon-32.png", 32, "png"],
  ["public/favicon-16.png", 16, "png"],
  /** Yandex search snippets prefer 120×120 PNG or SVG (see yandex.ru/support/webmaster favicon). */
  ["public/favicon-120.png", 120, "png"],
  ["public/apple-touch-icon.png", 180, "png"],
  ["public/icon-192.png", 192, "png"],
  ["public/icon-512.png", 512, "png"],
  ["public/brand/logo-192.png", 192, "png"],
  ["public/brand/logo-512.png", 512, "png"],
];

for (const [out, size, format] of outputs) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log("ok", out);
}

const icoEntries = [];
for (const size of [16, 32]) {
  const { data, info } = await sharp(svg)
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  icoEntries.push({
    size,
    imageData: encodeBmpIcoEntry(data, info.width, info.height),
  });
}

fs.writeFileSync("public/favicon.ico", buildIco(icoEntries));
console.log("ok", "public/favicon.ico");

fs.copyFileSync("public/brand/icon.svg", "public/apple-icon.svg");
console.log("ok", "public/apple-icon.svg");

fs.copyFileSync("public/brand/icon.svg", "public/favicon.svg");
console.log("ok", "public/favicon.svg");
