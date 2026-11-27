import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./server/database";
import {
  EMAIL_REGEX,
  isValidId,
  MAX_BODY_BYTES,
  validateDiscoveryOrg,
  validateInquiry,
  validateInquiryTriage,
  validateResearchNote,
  validateSiteConfig,
  validateTeamMemberInput,
  validateVentureOpportunity,
  type InquiryPayload,
} from "./server/validation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DB_PATH =
  process.env.AJENTIR_DB_PATH?.trim() || path.resolve(__dirname, "data", "ajentir.sqlite");
const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || "dejawoot99@gmail.com").trim().toLowerCase();

// In-memory random fallback for session signing if SESSION_SECRET env var is unset
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString("hex");
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

interface SessionClaims {
  email: string;
  displayName: string;
  role: "owner" | "admin";
  exp: number;
}

interface AuthenticatedRequest extends Request {
  portalUser?: SessionClaims;
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function verifyEnvPasscode(candidate: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function signToken(claims: Omit<SessionClaims, "exp">): string {
  const fullClaims: SessionClaims = { ...claims, exp: Date.now() + SESSION_TTL_MS };
  const payload = Buffer.from(JSON.stringify(fullClaims), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (!parsed || typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    if (parsed.role !== "owner" && parsed.role !== "admin") return null;
    if (typeof parsed.email !== "string" || typeof parsed.displayName !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function createWindowLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      store.set(key, recent);
      return true;
    }
    recent.push(now);
    store.set(key, recent);
    return false;
  };
}

const isInquiryLimited = createWindowLimiter(5, 60_000);
const isAuthLimited = createWindowLimiter(10, 15 * 60_000);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeExternalWebhook(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host === "metadata.google.internal"
    ) {
      return false;
    }
    if (net.isIP(host)) {
      if (
        host.startsWith("10.") ||
        host.startsWith("127.") ||
        host.startsWith("169.254.") ||
        host.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function dispatchAlerts(referenceId: string, payload: InquiryPayload) {
  const results = { emailSent: false, webhookSent: false };

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const alertTo = (process.env.ALERT_TO_EMAIL || OWNER_EMAIL).trim();
  const alertFrom = (
    process.env.ALERT_FROM_EMAIL || "Ajentir Ventures <onboarding@resend.dev>"
  ).trim();

  if (resendKey && EMAIL_REGEX.test(alertTo)) {
    const html = `
      <div style="font-family: sans-serif; color: #0B2228; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">New Ajentir Ventures Inquiry</h2>
        <p style="color: #43585D; margin-top: 0;">Lane: <strong>${escapeHtml(payload.lane)}</strong> (${escapeHtml(payload.subTrack)})${referenceId ? ` · Ref ${escapeHtml(referenceId)}` : ""}</p>
        <p><strong>Name:</strong> ${escapeHtml(payload.fullName)}<br/>
           <strong>Organisation:</strong> ${escapeHtml(payload.company || "N/A")}<br/>
           <strong>Email:</strong> ${escapeHtml(payload.email)}
           ${payload.teamSize ? `<br/><strong>Leadership Size:</strong> ${escapeHtml(payload.teamSize)}` : ""}
           ${payload.website ? `<br/><strong>Link:</strong> ${escapeHtml(payload.website)}` : ""}
        </p>
        <p><strong>Summary:</strong><br/>${escapeHtml(payload.message || "No additional message provided.")}</p>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: alertFrom,
          to: [alertTo],
          reply_to: payload.email,
          subject: `[AJV ${payload.lane.toUpperCase()}] ${payload.fullName}${payload.company ? ` — ${payload.company}` : ""}`,
          html,
        }),
      });
      results.emailSent = res.ok;

      if (res.ok && process.env.RESEND_SEND_AUTO_REPLY === "true") {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: alertFrom,
            to: [payload.email],
            subject: "Ajentir Ventures — Inquiry Received",
            html: `<p>Hi ${escapeHtml(payload.fullName)},</p><p>Thank you for reaching out to Ajentir Ventures regarding <strong>${escapeHtml(payload.subTrack)}</strong>${referenceId ? ` (Ref: ${escapeHtml(referenceId)})` : ""}. Our team reviews inquiries directly and will reply within two business days.</p><p>Best regards,<br/>Ajentir Ventures</p>`,
          }),
        });
      }
    } catch {
      // Non-fatal: inquiry is already persisted in SQLite
    }
  }

  const webhookUrl = process.env.ALERT_WEBHOOK_URL?.trim();
  if (webhookUrl && isSafeExternalWebhook(webhookUrl)) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `New AJV Inquiry (${payload.lane} · ${payload.subTrack}): ${payload.fullName} (${payload.company || "Independent"}) — ${payload.email}`,
          inquiry: { referenceId, ...payload },
        }),
      });
      results.webhookSent = res.ok;
    } catch {
      // Non-fatal
    }
  }

  return results;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }
  const claims = verifyToken(header.slice("Bearer ".length).trim());
  if (!claims) {
    res.status(401).json({ ok: false, error: "Invalid or expired session" });
    return;
  }
  req.portalUser = claims;
  next();
}

function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAdmin(req, res, () => {
    if (req.portalUser?.role !== "owner") {
      res.status(403).json({ ok: false, error: "Owner access required" });
      return;
    }
    next();
  });
}

async function startServer() {
  const store = openDatabase(DB_PATH);
  const app = express();

  const trustedProxy = process.env.AJENTIR_TRUSTED_PROXY?.trim();
  app.set("trust proxy", trustedProxy || true);
  app.use(express.json({ limit: MAX_BODY_BYTES }));

  app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // Public health endpoint (contract verified by integration tests)
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "ajentir-self-hosted-api" });
  });

  // Public live site config
  app.get("/api/site-config", (_req: Request, res: Response) => {
    res.json(store.getSiteConfig());
  });

  // Public inquiry submission -> SQLite + optional Resend/Webhook alert
  app.post("/api/inquiries", (req: Request, res: Response) => {
    const clientIp = req.ip || "unknown";
    if (isInquiryLimited(clientIp)) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }

    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<
      string,
      unknown
    >;
    const honeypot =
      (typeof body.websiteUrl === "string" && body.websiteUrl.trim()) ||
      (typeof body.honeypot === "string" && body.honeypot.trim());
    if (honeypot) {
      res.status(202).json({ ok: true, id: "" });
      return;
    }

    const payload = validateInquiry(body);
    if (!payload) {
      res.status(400).json({ ok: false, error: "Invalid inquiry submission" });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    store.insertInquiry({
      id,
      ...payload,
      status: "new",
      stageTag: "",
      designPartner: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
    });

    void dispatchAlerts(id.slice(0, 8).toUpperCase(), payload);
    res.status(201).json({ ok: true, id });
  });

  // Portal Auth (Zero MFA: password / team email+password + first-run claim)
  app.get("/api/auth/status", (_req: Request, res: Response) => {
    res.json({
      envPasscodeConfigured: Boolean(process.env.ADMIN_PASSWORD?.trim()),
      ownerClaimed: store.hasOwnerCredential(),
      ownerEmailHint: OWNER_EMAIL,
    });
  });

  app.post("/api/auth/claim", (req: Request, res: Response) => {
    if (isAuthLimited(req.ip || "unknown")) {
      res.status(429).json({ ok: false, error: "Too many attempts. Please wait a few minutes." });
      return;
    }
    if (process.env.ADMIN_PASSWORD?.trim() || store.hasOwnerCredential()) {
      res.status(409).json({ ok: false, error: "Portal password is already configured." });
      return;
    }

    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<
      string,
      unknown
    >;
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
    const emailRaw =
      typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : OWNER_EMAIL;
    const password = typeof body.password === "string" ? body.password : "";

    if (!displayName || !EMAIL_REGEX.test(emailRaw) || password.length < 8 || password.length > 200) {
      res.status(400).json({
        ok: false,
        error: "Provide your name, valid email, and a password of at least 8 characters.",
      });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const claimed = store.claimOwnerCredential({
      email: emailRaw,
      displayName,
      passwordHash: hash,
      salt,
    });
    if (!claimed) {
      res.status(409).json({ ok: false, error: "Portal password is already configured." });
      return;
    }

    const user = { email: emailRaw, displayName, role: "owner" as const };
    res.status(201).json({ ok: true, token: signToken(user), user });
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    if (isAuthLimited(req.ip || "unknown")) {
      res.status(429).json({ ok: false, error: "Too many attempts. Please wait a few minutes." });
      return;
    }

    const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<
      string,
      unknown
    >;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!password || password.length > 200) {
      res.status(400).json({ ok: false, error: "Password is required." });
      return;
    }

    const envPasscode = process.env.ADMIN_PASSWORD?.trim();
    const ownerCred = store.getOwnerCredential();

    // 1. Check owner credentials (env passcode takes precedence if configured)
    const isOwnerTarget = !email || email === (ownerCred?.email || OWNER_EMAIL) || email === OWNER_EMAIL;
    if (isOwnerTarget) {
      if (envPasscode && verifyEnvPasscode(password, envPasscode)) {
        const user = {
          email: ownerCred?.email || OWNER_EMAIL,
          displayName: ownerCred?.displayName || "Account Owner",
          role: "owner" as const,
        };
        res.json({ ok: true, token: signToken(user), user });
        return;
      }
      if (ownerCred && verifyPassword(password, ownerCred.passwordHash, ownerCred.salt)) {
        const user = {
          email: ownerCred.email,
          displayName: ownerCred.displayName,
          role: "owner" as const,
        };
        res.json({ ok: true, token: signToken(user), user });
        return;
      }
    }

    // 2. Check team member account by email
    if (email) {
      const member = store.findTeamMemberByEmail(email);
      if (member && verifyPassword(password, member.passwordHash, member.salt)) {
        const user = {
          email: member.email,
          displayName: member.displayName,
          role: "admin" as const,
        };
        res.json({ ok: true, token: signToken(user), user });
        return;
      }
    }

    res.status(401).json({ ok: false, error: "Invalid credentials." });
  });

  app.get("/api/auth/me", requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    res.json({ ok: true, user: req.portalUser });
  });

  // Admin System Health
  app.get("/api/admin/health", requireAdmin, (_req: Request, res: Response) => {
    res.json({
      ok: true,
      database: "sqlite",
      emailAlertsConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      webhookAlertsConfigured: Boolean(process.env.ALERT_WEBHOOK_URL?.trim()),
    });
  });

  // Admin Site Config Update
  app.put("/api/site-config", requireAdmin, (req: Request, res: Response) => {
    const parsed = validateSiteConfig(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid site configuration" });
      return;
    }
    const updated = store.saveSiteConfig(parsed);
    res.json(updated);
  });

  // Admin Inquiry Management
  app.get("/api/inquiries", requireAdmin, (_req: Request, res: Response) => {
    res.json({ items: store.listInquiries() });
  });

  app.patch("/api/inquiries/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid inquiry ID" });
      return;
    }
    const triage = validateInquiryTriage(req.body);
    if (!triage) {
      res.status(400).json({ ok: false, error: "Invalid triage payload" });
      return;
    }
    const updated = store.updateInquiryTriage(id, triage);
    if (!updated) {
      res.status(404).json({ ok: false, error: "Inquiry not found" });
      return;
    }
    res.json({ ok: true });
  });

  app.delete("/api/inquiries/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid inquiry ID" });
      return;
    }
    const deleted = store.deleteInquiry(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Inquiry not found" });
      return;
    }
    res.json({ ok: true });
  });

  // Owner Team Management
  app.get("/api/team", requireOwner, (_req: Request, res: Response) => {
    res.json({ items: store.listTeamMembers() });
  });

  app.post("/api/team", requireOwner, (req: AuthenticatedRequest, res: Response) => {
    const parsed = validateTeamMemberInput(req.body);
    if (!parsed) {
      res.status(400).json({
        ok: false,
        error: "Valid email, name, and password (min 8 chars) are required.",
      });
      return;
    }
    if (store.findTeamMemberByEmail(parsed.email)) {
      res.status(409).json({ ok: false, error: "A team member with this email already exists." });
      return;
    }
    const { hash, salt } = hashPassword(parsed.password);
    const created = store.createTeamMember({
      id: crypto.randomUUID(),
      email: parsed.email,
      displayName: parsed.displayName,
      passwordHash: hash,
      salt,
      addedBy: req.portalUser?.email || OWNER_EMAIL,
    });
    res.status(201).json({ item: created });
  });

  app.delete("/api/team/:id", requireOwner, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid team member ID" });
      return;
    }
    const deleted = store.deleteTeamMember(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Team member not found" });
      return;
    }
    res.json({ ok: true });
  });

  // Admin Discovery OS — Organisations & Workflows
  app.get("/api/discovery/orgs", requireAdmin, (_req: Request, res: Response) => {
    res.json({ items: store.listDiscoveryOrgs() });
  });

  app.post("/api/discovery/orgs", requireAdmin, (req: Request, res: Response) => {
    const parsed = validateDiscoveryOrg(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid discovery organisation payload" });
      return;
    }
    const created = store.createDiscoveryOrg(crypto.randomUUID(), parsed);
    res.status(201).json({ item: created });
  });

  app.put("/api/discovery/orgs/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid organisation ID" });
      return;
    }
    const parsed = validateDiscoveryOrg(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid discovery organisation payload" });
      return;
    }
    const updated = store.updateDiscoveryOrg(id, parsed);
    if (!updated) {
      res.status(404).json({ ok: false, error: "Organisation not found" });
      return;
    }
    res.json({ ok: true });
  });

  app.delete("/api/discovery/orgs/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid organisation ID" });
      return;
    }
    const deleted = store.deleteDiscoveryOrg(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Organisation not found" });
      return;
    }
    res.json({ ok: true });
  });

  // Admin Discovery OS — Venture Opportunities & 100-Point Scorecard
  app.get("/api/discovery/opportunities", requireAdmin, (_req: Request, res: Response) => {
    res.json({ items: store.listVentureOpportunities() });
  });

  app.post("/api/discovery/opportunities", requireAdmin, (req: Request, res: Response) => {
    const parsed = validateVentureOpportunity(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid venture opportunity payload" });
      return;
    }
    if (parsed.orgId && !store.orgExists(parsed.orgId)) {
      res.status(400).json({ ok: false, error: "Referenced source organisation does not exist" });
      return;
    }
    const created = store.createVentureOpportunity(crypto.randomUUID(), parsed);
    res.status(201).json({ item: created });
  });

  app.put("/api/discovery/opportunities/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid opportunity ID" });
      return;
    }
    const parsed = validateVentureOpportunity(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid venture opportunity payload" });
      return;
    }
    if (parsed.orgId && !store.orgExists(parsed.orgId)) {
      res.status(400).json({ ok: false, error: "Referenced source organisation does not exist" });
      return;
    }
    const updated = store.updateVentureOpportunity(id, parsed);
    if (!updated) {
      res.status(404).json({ ok: false, error: "Opportunity not found" });
      return;
    }
    res.json({ ok: true });
  });

  app.delete("/api/discovery/opportunities/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid opportunity ID" });
      return;
    }
    const deleted = store.deleteVentureOpportunity(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Opportunity not found" });
      return;
    }
    res.json({ ok: true });
  });

  // Public & Admin Research Notes
  app.get("/api/research", (_req: Request, res: Response) => {
    res.json({ items: store.listPublishedResearchNotes() });
  });

  app.get("/api/admin/research", requireAdmin, (_req: Request, res: Response) => {
    res.json({ items: store.listResearchNotes() });
  });

  app.post("/api/research", requireAdmin, (req: Request, res: Response) => {
    const parsed = validateResearchNote(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid research note payload" });
      return;
    }
    const created = store.createResearchNote(crypto.randomUUID(), parsed);
    res.status(201).json({ item: created });
  });

  app.put("/api/research/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid research note ID" });
      return;
    }
    const parsed = validateResearchNote(req.body);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid research note payload" });
      return;
    }
    const updated = store.updateResearchNote(id, parsed);
    if (!updated) {
      res.status(404).json({ ok: false, error: "Research note not found" });
      return;
    }
    res.json({ ok: true });
  });

  app.delete("/api/research/:id", requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ ok: false, error: "Invalid research note ID" });
      return;
    }
    const deleted = store.deleteResearchNote(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Research note not found" });
      return;
    }
    res.json({ ok: true });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*all", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ajentir Ventures SQLite server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      store.close();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void startServer();
