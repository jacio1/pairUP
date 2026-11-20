import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { io, type Socket } from "socket.io-client";

const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.includes("test"))
  throw new Error("Set TEST_DATABASE_URL to an isolated test database.");
process.env.DATABASE_URL = database;
process.env.PRESENTER_PASSWORD = "auth-integration-presenter-secret";
process.env.WORKER_SECRET = "auth-integration-worker-secret";
process.env.PUBLIC_ORIGIN = "http://localhost:3000";
process.env.COOKIE_SECURE = "true";
execFileSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    env: process.env,
    stdio: "pipe",
  },
);

test("AuthModule preserves HTTP sessions, room access and socket logout", async (t) => {
  const { NestFactory } = await import("@nestjs/core");
  const { AppModule } = await import("../src/app");
  const { AuthService } = await import("../src/auth/auth.service");
  const { Database } = await import("../src/database/database.service");
  const { DatabaseModule } = await import("../src/database/database.module");
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, "127.0.0.1");
  const base = await app.getUrl(),
    db = app.get(Database);
  const sockets: Socket[] = [],
    sessionIds: number[] = [];
  const listingId = randomUUID(),
    roomId = `listing-${listingId}`;
  const request = async (path: string, cookie = "", body?: unknown) => {
    const response = await fetch(`${base}/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (path.startsWith("/auth/") && response.ok && data.id)
      sessionIds.push(data.id);
    const setCookie = response.headers.get("set-cookie") || "";
    return {
      status: response.status,
      data,
      setCookie,
      cookie: setCookie.split(";")[0],
    };
  };
  const socket = (cookie: string) => {
    const value = io(base, {
      autoConnect: false,
      transports: ["websocket"],
      extraHeaders: { Cookie: cookie, Origin: "http://localhost:3000" },
      auth: { roomId },
    });
    sockets.push(value);
    return value;
  };
  const event = (value: Socket, name: string) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        value.off(name, done);
        reject(new Error(`No ${name} event`));
      }, 4000);
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      value.once(name, done);
    });
  try {
    assert.equal(
      db,
      app.select(DatabaseModule).get(Database, { strict: true }),
    );
    assert.equal((await request("/me")).data, null);
    assert.equal(
      (await request("/auth/presenter", "", { password: "wrong" })).status,
      401,
    );
    const owner = await request("/auth/demo", "", {}),
      guest = await request("/auth/demo", "", {});
    await t.test("TEST identities and cookie flags are unchanged", async () => {
      assert.equal(owner.status, 201);
      assert.equal(owner.data.role, "guest");
      assert.notEqual(owner.data.id, guest.data.id);
      assert.equal(owner.data.name, `TEST #${owner.data.id}`);
      assert.match(owner.setCookie, /HttpOnly/i);
      assert.match(owner.setCookie, /Secure/i);
      assert.match(owner.setCookie, /SameSite=Lax/i);
      assert.match(owner.setCookie, /Max-Age=604800/i);
      assert.equal(
        (await request("/auth/demo", owner.cookie, {})).data.id,
        owner.data.id,
      );
      assert.equal((await request("/me", owner.cookie)).data.id, owner.data.id);
      const token = owner.cookie.split("=")[1];
      assert.notEqual(
        (await db.session.findUniqueOrThrow({ where: { id: owner.data.id } }))
          .tokenHash,
        token,
      );
    });
    await t.test(
      "Presenter login upgrades the session and retains role checks",
      async () => {
        const presenter = await request("/auth/presenter", guest.cookie, {
          password: process.env.PRESENTER_PASSWORD,
        });
        assert.equal(presenter.data.role, "presenter");
        assert.notEqual(presenter.data.id, guest.data.id);
        assert.equal(
          (await app.get(AuthService).require(presenter.cookie, true)).id,
          presenter.data.id,
        );
        await assert.rejects(() =>
          app.get(AuthService).require(owner.cookie, true),
        );
      },
    );
    const listing = await request("/listings", owner.cookie, {
      id: listingId,
      title: "Auth integration fixture",
      description: "Isolated test listing",
      subject: "english",
      level: "beginner",
      goal: "Verify access",
      format: "online",
      schedule: "",
      location: "",
      authorName: owner.data.name,
    });
    assert.equal(listing.status, 201);
    await t.test(
      "pending participants cannot enter a room; accepted ones can",
      async () => {
        assert.equal((await request(`/rooms/${roomId}/messages`)).status, 401);
        assert.equal(
          (await request(`/rooms/${roomId}/messages`, guest.cookie)).status,
          403,
        );
        const denied = socket(guest.cookie),
          denial = event(denied, "room:denied");
        denied.connect();
        await denial;
        denied.disconnect();
        const proposal = await request(
          `/listings/${listingId}/proposals`,
          guest.cookie,
          {},
        );
        assert.equal(proposal.status, 201);
        assert.equal(
          (await request(`/rooms/${roomId}/messages`, guest.cookie)).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/proposals/${proposal.data.id}/respond`,
              owner.cookie,
              { accept: true },
            )
          ).status,
          201,
        );
        assert.equal(
          (await request(`/rooms/${roomId}/messages`, guest.cookie)).status,
          200,
        );
        assert.equal(
          (await request(`/rooms/${roomId}/reset`, guest.cookie, {})).status,
          403,
        );
        assert.equal(
          (await request(`/rooms/${roomId}/ai/requests`, guest.cookie, {}))
            .status,
          400,
        );
      },
    );
    await t.test(
      "chat delivery, history and logout work across multiple sockets",
      async () => {
        const a = socket(guest.cookie),
          b = socket(guest.cookie);
        for (const value of [a, b]) {
          const ready = event(value, "room:ready");
          value.connect();
          await ready;
        }
        const ack = await new Promise<any>((resolve, reject) =>
          a
            .timeout(3000)
            .emit(
              "message:send",
              {
                clientRequestId: randomUUID(),
                text: "Auth integration message",
              },
              (error: Error | null, result: unknown) =>
                error ? reject(error) : resolve(result),
            ),
        );
        assert.equal(ack.ok, true);
        const history = await request(
          `/rooms/${roomId}/messages`,
          owner.cookie,
        );
        assert.ok(
          history.data.messages.some(
            (m: { text: string }) => m.text === "Auth integration message",
          ),
        );
        const closed = [event(a, "disconnect"), event(b, "disconnect")];
        const logout = await request("/auth/logout", guest.cookie, {});
        assert.equal(logout.status, 201);
        assert.match(logout.setCookie, /Max-Age=0/i);
        await Promise.all(closed);
        assert.equal((await request("/me", guest.cookie)).data, null);
        assert.equal(
          (await request(`/rooms/${roomId}/messages`, guest.cookie)).status,
          401,
        );
        assert.equal((await request("/auth/logout", "", {})).status, 201);
      },
    );
    await t.test(
      "expired sessions are rejected by HTTP and Socket.IO",
      async () => {
        await db.session.update({
          where: { id: owner.data.id },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
        assert.equal((await request("/me", owner.cookie)).data, null);
        assert.equal(
          (await request(`/rooms/${roomId}/messages`, owner.cookie)).status,
          401,
        );
        const expired = socket(owner.cookie),
          rejection = event(expired, "session:expired");
        expired.connect();
        await rejection;
      },
    );
  } finally {
    sockets.forEach((value) => value.disconnect());
    // Delete only this test's fixtures, never the seeded/shared room.
    await db.message.deleteMany({ where: { roomId } });
    await db.listing.deleteMany({ where: { id: listingId } });
    await db.room.deleteMany({ where: { id: roomId } });
    await db.session.deleteMany({ where: { id: { in: sessionIds } } });
    await app.close();
  }
});
