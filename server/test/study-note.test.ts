import { test } from "node:test";
import assert from "node:assert/strict";
import * as Y from "yjs";
import { HttpException } from "@nestjs/common";
import { noteState } from "../src/study-note";
import { StudyToolsController } from "../src/study-tools.controller";

test("notes converge with concurrent edits and duplicate/reordered updates", () => {
  const base = new Y.Doc();
  base.getText("body").insert(0, "Shared notes");
  const original = Y.encodeStateAsUpdate(base);
  const a = new Y.Doc(),
    b = new Y.Doc();
  Y.applyUpdate(a, original);
  Y.applyUpdate(b, original);
  a.getText("body").insert(0, "Alice: ");
  b.getText("body").insert(12, " + Bob");
  const stateA = Buffer.from(Y.encodeStateAsUpdate(a)).toString("base64");
  const stateB = Buffer.from(Y.encodeStateAsUpdate(b)).toString("base64");
  const one = noteState(noteState(original, stateA).state, stateB);
  const two = noteState(noteState(original, stateB).state, stateA);
  const result = new Y.Doc();
  Y.applyUpdate(result, one.state);
  assert.equal(result.getText("body").toString(), "Alice: Shared notes + Bob");
  assert.deepEqual(one.state, two.state);
  assert.deepEqual(noteState(one.state, stateA).state, one.state);
  for (const doc of [base, a, b, result]) doc.destroy();
});
test("notes reject malformed documents and oversized text", () => {
  assert.throws(() => noteState(undefined, "not a document"), HttpException);
  const doc = new Y.Doc();
  doc.getText("body").insert(0, "x".repeat(20001));
  assert.throws(
    () =>
      noteState(
        undefined,
        Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64"),
      ),
    (error: unknown) =>
      error instanceof HttpException &&
      (error.getResponse() as { code: string }).code === "TOOL_LIMIT",
  );
  doc.destroy();
});
test("study tools authorize before reading, writing or broadcasting", async () => {
  let touched = false;
  const auth = {
    roomAccess: async () => {
      throw new HttpException({ code: "FORBIDDEN" }, 403);
    },
  };
  const tools = {
    createNote: async () => {
      touched = true;
    },
  };
  const rt = {
    emit: () => {
      touched = true;
    },
  };
  const controller = new StudyToolsController(
    auth as never,
    rt as never,
    tools as never,
  );
  await assert.rejects(
    () =>
      controller.createNote({ headers: {} } as never, "private", { id: "a" }),
    HttpException,
  );
  assert.equal(touched, false);
});
