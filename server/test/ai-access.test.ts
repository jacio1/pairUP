import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { HttpException } from "@nestjs/common";
import { AiController } from "../src/ai/ai.controller";

test("TEST room participants can request Neuron", async () => {
  const session = { id: 17, name: "TEST #17", user: { role: "guest" } };
  const body = {
    clientRequestId: "request-123",
    prompt: "Translate",
    locale: "en",
  };
  const auth = {
    roomAccess: async (cookie: string, room: string) => {
      assert.equal(cookie, "test-session");
      assert.equal(room, "study-room");
      return session;
    },
    view: (value: typeof session) => ({ id: value.id, name: value.name }),
  };
  const chat = {
    requestAi: async (actor: unknown, request: unknown, room: string) => {
      assert.deepEqual(actor, { id: 17, name: "TEST #17" });
      assert.equal(request, body);
      assert.equal(room, "study-room");
      return { id: "job-123" };
    },
  };
  const api = new AiController(auth as never, chat as never);
  assert.deepEqual(
    await api.ai(
      { headers: { cookie: "test-session" } } as never,
      "study-room",
      body,
    ),
    { id: "job-123" },
  );
});

test("Neuron requests cannot bypass room access", async () => {
  let called = false;
  const auth = {
    roomAccess: async () => {
      throw new HttpException({ code: "FORBIDDEN" }, 403);
    },
  };
  const chat = {
    requestAi: async () => {
      called = true;
    },
  };
  const api = new AiController(auth as never, chat as never);
  await assert.rejects(
    () => api.ai({ headers: {} } as never, "private-room", {}),
    (error: unknown) =>
      error instanceof HttpException && error.getStatus() === 403,
  );
  assert.equal(called, false);
});
