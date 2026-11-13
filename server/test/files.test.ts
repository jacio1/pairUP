import { test } from "node:test";
import assert from "node:assert/strict";
import {
  identifyMedia,
  safeFilename,
  attachmentPath,
} from "../src/file-storage";
test("inline file media is detected from signatures, not a claimed MIME", () => {
  assert.deepEqual(identifyMedia(Buffer.from('<svg onload="alert(1)"/>')), {
    kind: "file",
    mime: "application/octet-stream",
  });
  assert.equal(
    identifyMedia(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])).mime,
    "image/png",
  );
  assert.equal(
    identifyMedia(Buffer.from("0000ftypisom0000")).mime,
    "video/mp4",
  );
  assert.equal(identifyMedia(Buffer.from("0000ftypavif0000")).kind, "file");
  assert.equal(identifyMedia(Buffer.from("report")).kind, "file");
});
test("file paths stay in storage and filenames cannot inject headers", () => {
  assert.throws(() => attachmentPath("../../secret"));
  assert.ok(!safeFilename("../../bad\r\nname.pdf").includes("/"));
  assert.ok(!safeFilename("test\r\nX-Header: secret").includes("\r"));
  assert.equal(
    safeFilename(Buffer.from("Учебные материалы.pdf").toString("latin1")),
    "Учебные материалы.pdf",
  );
});
