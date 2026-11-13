import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Api } from "../src/app";
import { HttpException } from "@nestjs/common";

test("voice endpoint checks room access before issuing any token", async () => {
  let issued = false;
  const auth = {
    roomAccess: async () => {
      throw new HttpException({ code: "FORBIDDEN" }, 403);
    },
  };
  const voice = {
    token: async () => {
      issued = true;
    },
  };
  const api = new Api(
    auth as never,
    {} as never,
    {} as never,
    {} as never,
    voice as never,
    {} as never,
  );
  await assert.rejects(
    () => api.voiceToken({ headers: {} } as never, {} as never, "private-room"),
    (error: unknown) =>
      error instanceof HttpException && error.getStatus() === 403,
  );
  assert.equal(issued, false);
});
