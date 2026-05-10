#!/usr/bin/env node
/**
 * Production start: always bind to Railway/container PORT.
 * Next.js also reads PORT via CLI, but this makes the contract explicit and cross-platform.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT ?? "3000";

const child = spawn(
  process.execPath,
  [nextCli, "start", "-p", port, "-H", "0.0.0.0"],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
