import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_LANES = new Set(['founder', 'training', 'partner']);
const VALID_SUBTRACKS = new Set([
  'investment',
  'incubation',
  'discovery',
  'governance',
  'workflow',
  'workshop',
  'model-provider',
  'bank',
  'enterprise',
]);

// Simple in-memory sliding window rate limiter for /api/notify
const rateWindowMs = 15 * 60 * 1000;
const maxRequestsPerWindow = 10;
const rateStore = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateStore.get(ip) ?? []).filter((t) => now - t < rateWindowMs);
  if (timestamps.length >= maxRequestsPerWindow) {
    rateStore.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateStore.set(ip, timestamps);
  return false;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isSafeExternalWebhook(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host === 'metadata.google.internal'
    ) {
      return false;
    }
    if (net.isIP(host)) {
      if (
        host.startsWith('10.') ||
        host.startsWith('127.') ||
        host.startsWith('169.254.') ||
        host.startsWith('192.168.') ||
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

interface NotifyPayload {
  referenceId: string;
  lane: string;
  subTrack: string;
  fullName: string;
  company: string;
  email: string;
  website: string;
  teamSize: string;
  message: string;
}

function parseNotifyPayload(body: unknown): NotifyPayload | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;

  const str = (key: string, max: number) =>
    typeof raw[key] === 'string' ? raw[key].trim().slice(0, max) : '';

  const lane = str('lane', 32);
  const subTrack = str('subTrack', 40);
  const fullName = str('fullName', 120);
  const company = str('company', 140);
  const email = str('email', 160);
  const website = str('website', 300);
  const teamSize = str('teamSize', 40);
  const message = str('message', 2000);
  const referenceId = str('referenceId', 64);

  if (!VALID_LANES.has(lane) || !VALID_SUBTRACKS.has(subTrack)) return null;
  if (!fullName || !EMAIL_PATTERN.test(email)) return null;
  if (website && !/^https?:\/\//i.test(website)) return null;

  return { referenceId, lane, subTrack, fullName, company, email, website, teamSize, message };
}

async function dispatchAlerts(payload: NotifyPayload) {
  const results = { emailSent: false, webhookSent: false };

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const alertTo = (process.env.ALERT_TO_EMAIL || 'dejawoot99@gmail.com').trim();
  const alertFrom = (process.env.ALERT_FROM_EMAIL || 'Ajentir Ventures <onboarding@resend.dev>').trim();

  if (resendKey && EMAIL_PATTERN.test(alertTo)) {
    const html = `
      <div style="font-family: sans-serif; color: #0B2228; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">New Ajentir Ventures Inquiry</h2>
        <p style="color: #43585D; margin-top: 0;">Lane: <strong>${escapeHtml(payload.lane)}</strong> (${escapeHtml(payload.subTrack)})${payload.referenceId ? ` · Ref ${escapeHtml(payload.referenceId)}` : ''}</p>
        <p><strong>Name:</strong> ${escapeHtml(payload.fullName)}<br/>
           <strong>Organisation:</strong> ${escapeHtml(payload.company || 'N/A')}<br/>
           <strong>Email:</strong> ${escapeHtml(payload.email)}
           ${payload.teamSize ? `<br/><strong>Leadership Size:</strong> ${escapeHtml(payload.teamSize)}` : ''}
           ${payload.website ? `<br/><strong>Link:</strong> ${escapeHtml(payload.website)}` : ''}
        </p>
        <p><strong>Summary:</strong><br/>${escapeHtml(payload.message || 'No additional message provided.')}</p>
      </div>
    `;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: alertFrom,
          to: [alertTo],
          reply_to: payload.email,
          subject: `[AJV ${payload.lane.toUpperCase()}] ${payload.fullName}${payload.company ? ` — ${payload.company}` : ''}`,
          html,
        }),
      });
      results.emailSent = res.ok;

      if (res.ok && process.env.RESEND_SEND_AUTO_REPLY === 'true') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: alertFrom,
            to: [payload.email],
            subject: 'Ajentir Ventures — Inquiry Received',
            html: `<p>Hi ${escapeHtml(payload.fullName)},</p><p>Thank you for reaching out to Ajentir Ventures regarding <strong>${escapeHtml(payload.subTrack)}</strong>${payload.referenceId ? ` (Ref: ${escapeHtml(payload.referenceId)})` : ''}. Our team reviews inquiries directly and will reply within two business days.</p><p>Best regards,<br/>Ajentir Ventures</p>`,
          }),
        });
      }
    } catch {
      // Non-fatal: inquiry is already safely persisted in Firestore
    }
  }

  const webhookUrl = process.env.ALERT_WEBHOOK_URL?.trim();
  if (webhookUrl && isSafeExternalWebhook(webhookUrl)) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `New AJV Inquiry (${payload.lane} · ${payload.subTrack}): ${payload.fullName} (${payload.company || 'Independent'}) — ${payload.email}`,
          inquiry: payload,
        }),
      });
      results.webhookSent = res.ok;
    } catch {
      // Non-fatal
    }
  }

  return results;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      emailAlertsConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      webhookAlertsConfigured: Boolean(process.env.ALERT_WEBHOOK_URL?.trim()),
    });
  });

  app.post('/api/notify', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({ ok: false, error: 'Too many requests' });
      return;
    }

    const payload = parseNotifyPayload(req.body);
    if (!payload) {
      res.status(400).json({ ok: false, error: 'Invalid inquiry notification payload' });
      return;
    }

    const result = await dispatchAlerts(payload);
    res.json({ ok: true, ...result });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ajentir Ventures server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
