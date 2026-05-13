/**
 * Крутит `npm run sync:all-media` в цикле: при падении (exit ≠ 0) ждёт 90 с и запускает снова.
 * Прогресс между запусками подхватывает `.sync-all-media.checkpoint.json` (если не --no-checkpoint).
 * Лог дублируется в `sync-all-media-overnight.log` в корне репо.
 *
 * Запуск:
 *   npm run sync:all-media:overnight
 *   npm run sync:all-media:overnight -- --delay-ms=500 --batch-size=2 --upload-timeout-ms=600000
 */
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logPath = join(root, "sync-all-media-overnight.log");
const log = createWriteStream(logPath, { flags: "a" });

function stamp() {
  return new Date().toISOString();
}

function line(msg) {
  const s = `[${stamp()}] ${msg}\n`;
  log.write(s);
  process.stdout.write(s);
}

const passthrough = process.argv.slice(2);
const defaultArgs = ["--dry-run=false", "--delay-ms=500", "--batch-size=2"];
const syncArgs = passthrough.length > 0 ? passthrough : defaultArgs;
const npmArgs = ["run", "sync:all-media", "--", ...syncArgs];

function runLap(lap) {
  line(`lap ${lap}: npm ${npmArgs.join(" ")}`);
  return new Promise((resolve) => {
    const child = spawn("npm", npmArgs, {
      cwd: root,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env },
    });
    child.stdout?.on("data", (buf) => {
      process.stdout.write(buf);
      log.write(buf);
    });
    child.stderr?.on("data", (buf) => {
      process.stderr.write(buf);
      log.write(buf);
    });
    child.on("error", (err) => {
      line(`lap ${lap} spawn error: ${err.message}`);
      resolve(1);
    });
    child.on("close", (code, signal) => {
      line(`lap ${lap} closed code=${code ?? "?"} signal=${signal ?? ""}`);
      resolve(code === 0 ? 0 : code ?? 1);
    });
  });
}

const pauseMs = 90_000;
let lap = 0;
try {
  line("=== overnight wrapper start ===");
  for (;;) {
    lap += 1;
    const code = await runLap(lap);
    if (code === 0) {
      line("=== overnight wrapper: sync finished OK, exit 0 ===");
      process.exit(0);
    }
    line(`non-zero exit (${code}), sleep ${pauseMs / 1000}s then restart (checkpoint resumes)…`);
    await new Promise((r) => setTimeout(r, pauseMs));
  }
} finally {
  log.end();
}
