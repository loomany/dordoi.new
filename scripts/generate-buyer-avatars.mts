/**
 * Generates three buyer avatar JPEGs via OpenAI Images API (DALL·E 3).
 * Reads OPENAI_API_KEY from `.env.local`. Run: npx tsx scripts/generate-buyer-avatars.mts
 */
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

function loadEnvLocal(): void {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const m = /^OPENAI_API_KEY=(.+)$/.exec(line.trim());
    if (m) {
      process.env.OPENAI_API_KEY = m[1].trim();
      return;
    }
  }
  console.error("OPENAI_API_KEY not found in .env.local");
  process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), "public", "buyers");

const shots: { file: string; prompt: string }[] = [
  {
    file: "portrait-arman.png",
    prompt:
      "Professional corporate headshot photograph of one Kazakh man from Kazakhstan, Central Asian East Asian facial features, age 35–45, short dark hair, confident subtle smile, wearing a dark blazer over white shirt, soft neutral gray studio backdrop, soft diffused lighting, sharp focus on eyes, photorealistic, DSLR quality, square crop friendly portrait orientation",
  },
  {
    file: "portrait-aisuluu.png",
    prompt:
      "Professional corporate headshot photograph of one Kazakh woman from Kazakhstan, Central Asian features, age 30–40, shoulder-length dark hair, subtle makeup, wearing a gray blazer, warm approachable expression, soft neutral studio background, natural lighting, photorealistic DSLR portrait, square crop friendly",
  },
  {
    file: "portrait-daniyar.png",
    prompt:
      "Professional corporate headshot photograph of one Kazakh man from Kazakhstan, Central Asian features, age 30–38, short hair, clean-shaven or light stubble, wearing a dark green polo shirt, friendly professional smile, neutral light background, photorealistic DSLR portrait lighting, square crop friendly",
  },
];

async function downloadUrlToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

async function main(): Promise<void> {
  loadEnvLocal();
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: key });

  for (const { file, prompt } of shots) {
    console.error(`Generating ${file}…`);
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const url = response.data?.[0]?.url;
    if (!url) {
      throw new Error(`No image URL for ${file}`);
    }

    const dest = path.join(OUTPUT_DIR, file);
    await downloadUrlToFile(url, dest);
    console.error(`Wrote ${dest} (${fs.statSync(dest).size} bytes)`);
  }

  console.error("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
