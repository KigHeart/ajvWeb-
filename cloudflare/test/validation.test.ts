import test from "node:test";
import assert from "node:assert/strict";
import { validateInquiry } from "../src/validation";

const valid = {
  lane: "founder",
  subTrack: "investment",
  fullName: "A Founder",
  company: "Example Ltd",
  email: "founder@example.com",
  website: "example.com",
  teamSize: "",
  preferredSession: "",
  message: "We are exploring an investment.",
};

test("accepts a valid founder inquiry and normalizes its website", () => {
  const result = validateInquiry(valid);
  assert.ok(result);
  assert.equal(result.website, "https://example.com/");
  assert.equal(result.email, "founder@example.com");
});

test("rejects invalid lane/sub-track combinations", () => {
  assert.equal(validateInquiry({ ...valid, subTrack: "governance" }), null);
});

test("rejects malformed email addresses", () => {
  assert.equal(validateInquiry({ ...valid, email: "not-an-email" }), null);
});

test("rejects oversized user-controlled fields", () => {
  assert.equal(validateInquiry({ ...valid, message: "x".repeat(2001) }), null);
});

test("requires a supported team size for training inquiries", () => {
  assert.equal(validateInquiry({
    ...valid, lane: "training", subTrack: "governance", teamSize: "unlimited",
  }), null);
});

test("strips founder-only website values from other lanes", () => {
  const result = validateInquiry({
    ...valid, lane: "partner", subTrack: "bank", website: "javascript:alert(1)",
  });
  assert.ok(result);
  assert.equal(result.website, "");
});
