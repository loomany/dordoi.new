/**
 * Offline: regenerates docs/landing-spec.json using OpenAI Responses API.
 * Requires OPENAI_API_KEY and OPENAI_DESIGN_MODEL (default gpt-5.5-pro).
 * Fails loudly if the model is unavailable — no silent fallback.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "docs", "landing-spec.json");
const briefPath = join(root, "docs", "design-from-ai.md");

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_DESIGN_MODEL ?? "gpt-5.5-pro";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const client = new OpenAI({ apiKey });
const brief = readFileSync(briefPath, "utf8");
const current = readFileSync(outPath, "utf8");

const instructions =
  "You are a UI/UX architect and conversion copywriter for a B2B SaaS landing. " +
  "Output a single JSON object only (no markdown fences) that matches this TypeScript shape: " +
  "{ version: number, hero: { layout: 'split', mockupPosition: 'left'|'right', ctaOrder: ['buyer','supplier','buyerAgent'], " +
  "messageKeys: { title, subtitle, ctas: { buyer, supplier, buyerAgent } } (each value is a next-intl key path string starting with Pages.home.hero.) }, " +
  "sections: Array<{ id: string, variant?: string }>, mobileSectionOrder: string[], typography: Record<string,string>, spacing: Record<string,string> }. " +
  "Use typography token names like d-text-5xl, d-text-xl, d-text-3xl, d-text-lg, d-text-base and spacing tokens d-space-section-y, d-space-section-y-lg, d-block-gap, d-space-lg.";

const input =
  `Product brief:\n${brief}\n\nCurrent landing-spec.json (improve while keeping section ids compatible with the app: valueProps, audiences, howItWorks, ecosystem, ctaBand):\n${current}`;

const res = await client.responses.create({
  model,
  instructions,
  input,
});

const text = res.output_text?.trim();
if (!text) {
  console.error("Empty response from OpenAI. Model:", res.model);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(text);
} catch {
  console.error("Model did not return valid JSON. First 500 chars:\n", text.slice(0, 500));
  process.exit(1);
}

writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
console.log("Wrote", outPath);
