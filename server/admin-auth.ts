import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_COOKIE_NAME = "ajentir_admin_session";
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function verifyAdminPassword(candidate: unknown, configured: string | undefined): boolean {
  if (typeof candidate !== "string" || !configured || configured.length < 16) return false;
  const actual = Buffer.from(candidate, "utf8");
  const expected = Buffer.from(configured, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Invalid session token");
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name === ADMIN_COOKIE_NAME && TOKEN_PATTERN.test(value)) return value;
  }
  return null;
}

export function sessionCookie(token: string, production: boolean): string {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Invalid session token");
  const name = production ? "__Host-ajentir_admin_session" : ADMIN_COOKIE_NAME;
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_TTL_SECONDS}${production ? "; Secure" : ""}`;
}

export function clearSessionCookie(production: boolean): string {
  const name = production ? "__Host-ajentir_admin_session" : ADMIN_COOKIE_NAME;
  return `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production ? "; Secure" : ""}`;
}

export function constantTimeTokenEqual(actual: unknown, expected: string): boolean {
  if (typeof actual !== "string" || !TOKEN_PATTERN.test(actual) || !TOKEN_PATTERN.test(expected)) return false;
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");
  return timingSafeEqual(a, b);
}
