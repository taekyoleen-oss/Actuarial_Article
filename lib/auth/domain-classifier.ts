import type { DomainClassification } from "@/types/domain";

/**
 * Classifies a sign-up email into whitelist/other/blocked based on
 * MEMBER_DOMAIN_WHITELIST (comma-separated host list).
 *
 * - whitelist: domain matches one of the whitelisted hosts
 * - blocked:   domain matches a hard-coded deny list (disposable mail providers)
 * - other:     anything else (manual review required)
 */
const BLOCKED_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwaway.email",
]);

export function classifyEmailDomain(email: string): DomainClassification {
  const host = email.toLowerCase().split("@")[1]?.trim();
  if (!host) return "blocked";
  if (BLOCKED_DOMAINS.has(host)) return "blocked";

  const whitelist = (process.env.MEMBER_DOMAIN_WHITELIST ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (whitelist.some((d) => host === d || host.endsWith(`.${d}`))) {
    return "whitelist";
  }
  return "other";
}
