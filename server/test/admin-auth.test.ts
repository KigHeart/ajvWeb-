import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_SESSION_TTL_SECONDS,
  clearSessionCookie,
  constantTimeTokenEqual,
  createCsrfToken,
  createOpaqueToken,
  hashSessionToken,
  readSessionCookie,
  sessionCookie,
  verifyAdminPassword,
} from "../admin-auth";

test("admin password requires a configured strong secret and compares safely", () => {
  assert.equal(verifyAdminPassword("correct horse battery staple", "correct horse battery staple"), true);
  assert.equal(verifyAdminPassword("wrong password", "correct horse battery staple"), false);
  assert.equal(verifyAdminPassword("short", "short"), false);
  assert.equal(verifyAdminPassword("correct horse battery staple", undefined), false);
  assert.equal(verifyAdminPassword({} , "correct horse battery staple"), false);
});

test("opaque session and CSRF tokens are cryptographically random hex values", () => {
  const session = createOpaqueToken();
  const csrf = createCsrfToken();
  assert.match(session, /^[a-f0-9]{64}$/);
  assert.match(csrf, /^[a-f0-9]{64}$/);
  assert.notEqual(session, csrf);
  assert.equal(hashSessionToken(session).length, 64);
  assert.throws(() => hashSessionToken("not-a-token"));
});

test("session cookies are HttpOnly, SameSite Strict, and Secure in production", () => {
  const token = createOpaqueToken();
  const local = sessionCookie(token, false);
  const production = sessionCookie(token, true);
  assert.match(local, /^ajentir_admin_session=/);
  assert.match(local, /HttpOnly/);
  assert.match(local, /SameSite=Strict/);
  assert.doesNotMatch(local, /; Secure/);
  assert.match(production, /^__Host-ajentir_admin_session=/);
  assert.match(production, /; Secure/);
  assert.match(production, /Path=\//);
  assert.match(production, new RegExp(`Max-Age=${ADMIN_SESSION_TTL_SECONDS}`));
  assert.match(clearSessionCookie(true), /Max-Age=0; Secure/);
});

test("reads only the expected environment-specific session cookie", () => {
  const token = createOpaqueToken();
  assert.equal(readSessionCookie(`other=x; ajentir_admin_session=${token}`), token);
  assert.equal(readSessionCookie(`__Host-ajentir_admin_session=${token}`, true), token);
  assert.equal(readSessionCookie(`ajentir_admin_session=${token}`, true), null);
  assert.equal(readSessionCookie("ajentir_admin_session=invalid"), null);
  assert.equal(readSessionCookie(undefined), null);
});

test("CSRF token comparisons are constant-time and reject malformed values", () => {
  const token = createCsrfToken();
  assert.equal(constantTimeTokenEqual(token, token), true);
  assert.equal(constantTimeTokenEqual(createCsrfToken(), token), false);
  assert.equal(constantTimeTokenEqual("bad", token), false);
  assert.equal(constantTimeTokenEqual(undefined, token), false);
});
