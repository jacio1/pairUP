import { NestFactory } from "@nestjs/core";
import "dotenv/config";
import { json } from "express";
import "reflect-metadata";
import { AppModule } from "./app";
import { allowedOrigins } from "./config/origins";

async function main() {
  for (const key of ["DATABASE_URL", "PRESENTER_PASSWORD", "WORKER_SECRET"]) {
    if (
      !process.env[key] ||
      (key !== "DATABASE_URL" && process.env[key]!.length < 16)
    )
      throw new Error(
        `Set ${key}; secrets must contain at least 16 characters`,
      );
    if (
      process.env.NODE_ENV === "production" &&
      key !== "DATABASE_URL" &&
      /^(replace-|local-)/.test(process.env[key]!)
    ) {
      throw new Error(
        `Replace the example ${key} before production deployment`,
      );
    }
  }
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: "384kb" }));
  const origins = allowedOrigins();
  app.enableCors({ origin: origins, credentials: true });
  app.use(
    (
      req: { method: string; headers: Record<string, string> },
      res: { status: (n: number) => { json: (v: unknown) => void } },
      next: () => void,
    ) => {
      if (
        !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.headers.origin &&
        !origins.includes(req.headers.origin)
      )
        return res.status(403).json({ code: "FORBIDDEN" });
      next();
    },
  );
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 4000), "0.0.0.0");
}
void main();
