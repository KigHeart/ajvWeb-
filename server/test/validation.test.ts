import test from "node:test";
import assert from "node:assert/strict";
import { validateInquiry } from "../validation";

const valid = {
  lane: "founder", subTrack: "investment", fullName: "A Founder",
  company: "Example Ltd", email: "founder@example.com", website: "example.com",
  teamSize: "", preferredSession: "", message: "We are exploring an investment.",
};

test("accepts and normalizes a valid inquiry", () => {
  const result = validateInquiry(valid);
  assert.ok(result);
  assert.equal(result.website, "https://example.com/");
  assert.equal(result.email, "founder@example.com");
});
test("rejects invalid lane/sub-track combinations", () => {
  assert.equal(validateInquiry({ ...valid, subTrack: "governance" }), null);
});
test("rejects malformed email and oversized messages", () => {
  assert.equal(validateInquiry({ ...valid, email: "invalid" }), null);
  assert.equal(validateInquiry({ ...valid, message: "x".repeat(2001) }), null);
});
test("enforces training team-size choices", () => {
  assert.equal(validateInquiry({ ...valid, lane: "training", subTrack: "governance", teamSize: "unlimited" }), null);
});
test("does not retain website values outside founder inquiries", () => {
  const result = validateInquiry({ ...valid, lane: "partner", subTrack: "bank", website: "javascript:alert(1)" });
  assert.ok(result);
  assert.equal(result.website, "");
});
