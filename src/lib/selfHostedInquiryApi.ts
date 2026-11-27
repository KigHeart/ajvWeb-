import type { CreateInquiryInput } from "./inquiries";

/**
 * Same-origin transport for self-hosted deployments.
 * GitHub Pages builds must leave VITE_USE_SELF_HOSTED_API unset/false.
 */
export async function submitSelfHostedInquiry(
  input: CreateInquiryInput,
  websiteUrl: string,
): Promise<{ id: string }> {
  const response = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      lane: input.lane,
      subTrack: input.subTrack,
      fullName: input.fullName,
      company: input.company,
      email: input.email,
      website: input.website,
      teamSize: input.teamSize,
      preferredSession: input.preferredSession ?? "",
      message: input.message,
      websiteUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("Self-hosted inquiry submission failed.");
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("Unexpected self-hosted inquiry response.");
  }
  return {
    id: "id" in result && typeof result.id === "string" ? result.id : "",
  };
}
