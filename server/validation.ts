export const MAX_BODY_BYTES = 16_384;

export type InquiryPayload = {
  lane: "founder" | "training" | "partner";
  subTrack: string;
  fullName: string;
  company: string;
  email: string;
  website: string;
  teamSize: string;
  preferredSession: string;
  message: string;
};

const TRACKS: Record<InquiryPayload["lane"], readonly string[]> = {
  founder: ["investment", "incubation"],
  training: ["governance", "workflow", "workshop"],
  partner: ["model-provider", "bank", "enterprise"],
};
const TEAM_SIZES = ["", "1-10 leaders", "11-30 leaders", "30+ leaders"];

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length <= max ? clean : null;
}

export function validateInquiry(value: unknown): InquiryPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const lane = data.lane;
  if (lane !== "founder" && lane !== "training" && lane !== "partner") return null;

  const subTrack = boundedString(data.subTrack, 40);
  const fullName = boundedString(data.fullName, 120);
  const company = boundedString(data.company, 140);
  const email = boundedString(data.email, 160)?.toLowerCase() ?? null;
  const website = boundedString(data.website, 300);
  const teamSize = boundedString(data.teamSize, 40);
  const preferredSession = boundedString(data.preferredSession ?? "", 140);
  const message = boundedString(data.message, 2000);

  if (!subTrack || !TRACKS[lane].includes(subTrack)) return null;
  if (!fullName || fullName.length < 1 || !company || !email) return null;
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return null;
  if (website === null || teamSize === null || preferredSession === null || message === null) return null;
  if (!TEAM_SIZES.includes(teamSize) || (lane !== "training" && teamSize !== "")) return null;

  let normalizedWebsite = "";
  if (lane === "founder" && website) {
    try {
      const parsed = new URL(/^https?:\\/\\//i.test(website) ? website : `https://${website}`);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      normalizedWebsite = parsed.toString().slice(0, 300);
    } catch {
      return null;
    }
  }
  return { lane, subTrack, fullName, company, email, website: normalizedWebsite,
    teamSize: lane === "training" ? teamSize : "", preferredSession, message };
}
