import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.includes("test"))
  throw new Error("Set TEST_DATABASE_URL to a dedicated test database.");
process.env.DATABASE_URL = database;
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env: process.env, stdio: "pipe" },
);

test("listing publication persists, isolates ownership and tolerates retries", async () => {
  const { NestFactory } = await import("@nestjs/core");
  const { AppModule, Database } = await import("../src/app");
  let app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  let base = await app.getUrl();
  const request = (path: string, cookie = "", body?: unknown) =>
    fetch(`${base}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const input = () => ({
    id: randomUUID(),
    title: "  Learn React together  ",
    subject: "computerScience",
    level: "beginner",
    goal: "Build a small app",
    format: "offline",
    schedule: "Weekends",
    location: "Moscow",
    description: "I would like to find a friendly study partner.",
    authorName: "Student",
  });
  try {
    const loginA = await request("/auth/demo", "", {});
    const loginB = await request("/auth/demo", "", {});
    const a = loginA.headers.get("set-cookie")!.split(";")[0];
    const b = loginB.headers.get("set-cookie")!.split(";")[0];
    assert.equal((await request("/listings", "", input())).status, 401);
    assert.equal((await request("/listings?mine=true")).status, 401);
    assert.equal(
      (await request("/listings", a, { ...input(), title: "" })).status,
      400,
    );
    const body = input();
    const response = await request("/listings", a, body);
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.title, body.title.trim());
    assert.equal(created.location, "Moscow");
    assert.ok(!("ownerSessionId" in created));
    const publicList = await (await request("/listings")).json();
    assert.ok(publicList.some((item: { id: string }) => item.id === body.id));
    const mine = await (await request("/listings?mine=true", a)).json();
    const others = await (await request("/listings?mine=true", b)).json();
    assert.ok(mine.some((item: { id: string }) => item.id === body.id));
    assert.ok(!others.some((item: { id: string }) => item.id === body.id));
    assert.equal((await request("/listings", b, body)).status, 403);
    const retry = await (await request("/listings", a, body)).json();
    assert.equal(retry.id, created.id);
    const concurrent = input();
    const results = await Promise.all([
      request("/listings", a, concurrent),
      request("/listings", a, concurrent),
    ]);
    assert.deepEqual(
      results.map((result) => result.status),
      [201, 201],
    );
    const db = app.get(Database);
    assert.equal(await db.listing.count({ where: { id: concurrent.id } }), 1);
    assert.equal(
      await db.room.count({ where: { id: `listing-${concurrent.id}` } }),
      1,
    );
    const saved = await db.listing.findUniqueOrThrow({
      where: { id: body.id },
    });
    assert.equal(saved.description, body.description);
    await app.close();
    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, "127.0.0.1");
    base = await app.getUrl();
    const afterRestart = await (await request("/listings?mine=true", a)).json();
    assert.ok(afterRestart.some((item: { id: string }) => item.id === body.id));
  } finally {
    await app.close();
  }
});
