import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// Accept the hosting preview's Vite-style flags as well as ordinary Next flags.
const require = createRequire(import.meta.url);
const input = process.argv.slice(2);
const args = [];
for (let i = 0; i < input.length; i++) {
  if (input[i] === "--strictPort") continue;
  if (input[i] === "--host") { args.push("--hostname", input[++i] || "127.0.0.1"); continue; }
  args.push(input[i]);
}
if (!args.includes("--turbopack") && !args.includes("--webpack")) args.push("--webpack");
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...args], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => { process.exitCode = code ?? 0; });
