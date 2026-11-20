import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { io, type Socket } from "socket.io-client";
export async function testApp() {
  const database = process.env.TEST_DATABASE_URL;
  if (!database || !new URL(database).pathname.includes("test"))
    throw Error("Use an isolated TEST_DATABASE_URL.");
  Object.assign(process.env, {
    DATABASE_URL: database,
    PRESENTER_PASSWORD: "module-integration-presenter",
    WORKER_SECRET: "module-integration-worker",
    PUBLIC_ORIGIN: "http://localhost:3000",
    COOKIE_SECURE: "false",
    LOCAL_TIMEOUT_MS: "150",
    UPLOAD_DIR: resolve("../artifacts/refactor-modules/uploads"),
    LIVEKIT_URL: "ws://localhost:7880",
    LIVEKIT_API_KEY: "devkey",
    LIVEKIT_API_SECRET: "test-voice-secret",
    YANDEX_API_KEY: "fake-key",
    YANDEX_MODEL: "fake-model",
  });
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: process.env, stdio: "pipe" },
  );
  const { NestFactory } = await import("@nestjs/core");
  const { AppModule } = await import("../../src/app");
  const { Database } = await import("../../src/database/database.service");
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  const base = await app.getUrl(),
    db = app.get(Database),
    sockets: Socket[] = [],
    sessionIds: number[] = [],
    roomIds: string[] = [],
    listingIds: string[] = [];
  async function api(path: string, cookie = "", body?: unknown) {
    const response = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return {
      status: response.status,
      data: text ? JSON.parse(text) : null,
      cookie: response.headers.get("set-cookie")?.split(";")[0] || "",
    };
  }
  async function login(presenter = false) {
    const value = await api(
      "/auth/" + (presenter ? "presenter" : "demo"),
      "",
      presenter ? { password: process.env.PRESENTER_PASSWORD } : {},
    );
    assert.equal(value.status, 201);
    sessionIds.push(value.data.id);
    return value;
  }
  async function room(owner: Awaited<ReturnType<typeof login>>) {
    const id = randomUUID();
    listingIds.push(id);
    const roomId = "listing-" + id;
    roomIds.push(roomId);
    const r = await api("/listings", owner.cookie, {
      id,
      title: "Module integration fixture",
      description: "Temporary test listing",
      subject: "english",
      level: "beginner",
      format: "online",
      goal: "Verify module wiring",
      schedule: "",
      location: "",
      authorName: owner.data.name,
    });
    assert.equal(r.status, 201);
    return roomId;
  }
  function socket(cookie: string, roomId?: string, worker = false) {
    const s = io(base, {
      autoConnect: false,
      transports: ["websocket"],
      extraHeaders: { Cookie: cookie, Origin: "http://localhost:3000" },
      auth: worker
        ? { kind: "worker", secret: process.env.WORKER_SECRET }
        : { roomId },
    });
    sockets.push(s);
    return s;
  }
  async function close() {
    sockets.forEach((s) => s.disconnect());
    const files = await db.attachment.findMany({
      where: { roomId: { in: roomIds } },
      select: { storageKey: true },
    });
    const { removeStoredFile } = await import("../../src/files/file-storage");
    for (const file of files) await removeStoredFile(file.storageKey);
    await db.aiJob.deleteMany({ where: { roomId: { in: roomIds } } });
    await db.message.deleteMany({ where: { roomId: { in: roomIds } } });
    await db.listing.deleteMany({ where: { id: { in: listingIds } } });
    await db.room.deleteMany({ where: { id: { in: roomIds } } });
    await db.publicProfile.deleteMany({
      where: { sessionId: { in: sessionIds } },
    });
    await db.session.deleteMany({ where: { id: { in: sessionIds } } });
    await app.close();
  }
  return { app, db, base, api, login, room, socket, close };
}
export function once(socket: Socket, event: string) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, done);
      reject(Error("Timed out: " + event));
    }, 4000);
    const done = (value: unknown) => {
      clearTimeout(timer);
      resolve(value);
    };
    socket.once(event, done);
  });
}
export async function until(check: () => Promise<boolean> | boolean) {
  for (let i = 0; i < 150; i++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw Error("Condition did not settle");
}
