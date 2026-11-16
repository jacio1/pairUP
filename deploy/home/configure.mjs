import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
const file = new URL("../../.env.home", import.meta.url);
try {
  await writeFile(
    file,
    [
      "PUBLIC_ORIGIN=http://localhost:18080",
      `POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`,
      `PRESENTER_PASSWORD=${randomBytes(18).toString("hex")}`,
      `WORKER_SECRET=${randomBytes(32).toString("hex")}`,
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Created private .env.home. Existing development data is separate.",
  );
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}
const env = await readFile(file, "utf8");
const secret = env.match(/^WORKER_SECRET=(.+)$/m)?.[1]?.trim();
if (!secret) throw Error("Missing WORKER_SECRET in .env.home");
await writeFile(
  new URL("../../worker/.env.home", import.meta.url),
  [
    "SERVER_URL=http://127.0.0.1:18080",
    `WORKER_SECRET=${secret}`,
    "OLLAMA_URL=http://127.0.0.1:11434",
    "OLLAMA_MODEL=qwen3:8b",
    "",
  ].join("\n"),
  { mode: 0o600 },
);
console.log("Home worker settings ready; no secrets printed.");
