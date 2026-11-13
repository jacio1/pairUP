import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseListing, subjects, levels } from "../src/listings";
import {
  listingSubjects,
  listingLevels,
} from "../../client/src/lib/local-data";

const valid = () => ({
  id: randomUUID(),
  title: "  Study React together  ",
  subject: "computerScience",
  level: "beginner",
  goal: "Learn React hooks",
  format: "online",
  schedule: "",
  location: "",
  description: "Looking for a friendly study partner.",
  authorName: "Student",
});

test("listing validation trims text and discards irrelevant online location", () => {
  const input = { ...valid(), location: "A city" };
  const result = parseListing(input)!;
  assert.equal(result.title, "Study React together");
  assert.equal(result.location, "");
  assert.deepEqual(subjects, [...listingSubjects]);
  assert.deepEqual(levels, [...listingLevels]);
});

test("listing validation rejects malformed fields, categories and non-UUID ids", () => {
  for (const body of [
    null,
    [],
    "text",
    {},
    { ...valid(), id: "demo-listing" },
    { ...valid(), title: "     " },
    { ...valid(), title: "x".repeat(151) },
    { ...valid(), subject: "unknown" },
    { ...valid(), level: "unknown" },
    { ...valid(), format: "unknown" },
    { ...valid(), goal: "x" },
    { ...valid(), description: "short" },
    { ...valid(), authorName: "" },
    { ...valid(), schedule: 1 },
    { ...valid(), location: "x".repeat(151) },
  ])
    assert.equal(parseListing(body), null);
});

test("offline and hybrid listings require a location", () => {
  for (const format of ["offline", "hybrid"]) {
    assert.equal(parseListing({ ...valid(), format, location: "  " }), null);
    assert.equal(
      parseListing({ ...valid(), format, location: "  Moscow  " })?.location,
      "Moscow",
    );
  }
});
