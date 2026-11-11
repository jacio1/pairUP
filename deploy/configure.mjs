import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const domain = process.argv[2] || "pairupstudy-demo.app";
if (
  !/^(?=.{1,253}$)[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(domain)
)
  throw new Error("Provide a domain name without https:// or paths");
const env = [
  `DOMAIN=${domain}`,
  `PUBLIC_ORIGIN=https://${domain}`,
  "COOKIE_SECURE=true",
  `POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`,
  `PRESENTER_PASSWORD=${randomBytes(18).toString("hex")}`,
  `WORKER_SECRET=${randomBytes(32).toString("hex")}`,
  "YANDEX_API_KEY=",
  "YANDEX_MODEL=",
  "LOCAL_TIMEOUT_MS=45000",
  "",
].join("\n");
// Never replace existing deployment secrets or reset a database password.
await writeFile(new URL("../.env", import.meta.url), env, {
  flag: "wx",
  mode: 0o600,
});
console.log(
  "Created root .env with fresh deployment secrets. Keep it private. Configure optional cloud AI there.",
);
