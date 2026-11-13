import { test } from "node:test";
import assert from "node:assert/strict";
import { HttpException } from "@nestjs/common";
import { parseProfile } from "../src/profiles";
import { ProfilesController } from "../src/profiles.controller";
const input = {
  name: "  Alice  ",
  bio: "Student",
  interests: "React, English",
  goal: "Study together",
  availability: "Weekends",
  avatar: "teal",
  version: 0,
};
test("profiles validate fields and discard ownership/role changes", () => {
  const value = parseProfile({
    ...input,
    id: 10,
    sessionId: 999,
    role: "presenter",
    seedKey: "english-author",
  });
  assert.equal(value?.name, "Alice");
  assert.equal(value?.avatar, "teal");
  assert.ok(!("id" in value!));
  assert.ok(!("role" in value!));
  for (const change of [
    { name: " " },
    { bio: "x".repeat(501) },
    { avatar: "other" },
    { version: -1 },
    { version: 1.5 },
    { interests: [] },
  ])
    assert.equal(parseProfile({ ...input, ...change }), null);
});
test("anonymous requests cannot read/edit a private profile endpoint", async () => {
  let changed = false;
  const auth = {
    require: async () => {
      throw new HttpException({ code: "UNAUTHORIZED" }, 401);
    },
  };
  const profiles = {
    save: async () => {
      changed = true;
    },
    ensure: async () => {
      changed = true;
    },
  };
  const controller = new ProfilesController(auth as never, profiles as never);
  await assert.rejects(
    () => controller.save({ headers: {} } as never, input),
    HttpException,
  );
  await assert.rejects(
    () =>
      controller.mine(
        { headers: {} } as never,
        { setHeader: () => {} } as never,
      ),
    HttpException,
  );
  assert.equal(changed, false);
});
