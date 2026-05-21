import "server-only";

const USER_AGENT =
  process.env.CRAWLER_USER_AGENT ??
  "ActuarialIntelKR/1.0 (+https://actuarial-intel.kr; contact:admin@actuarial-intel.kr)";

const FETCH_TIMEOUT_MS = 20_000;
const MEMBERS_ONLY_PATTERNS = [
  /\/members-only\//i,
  /\/login\.aspx\?/i,
  /\/sign-?in[/?]/i,
  /\/account\/login/i,
  /\/restricted\//i,
];

export interface FetchedSource {
  readonly html: string;
  readonly contentType: string;
  readonly finalUrl: string;
  readonly status: number;
}

/**
 * Crawl an external URL with robots-friendly defaults.
 * - Identifies itself via UA
 * - 20s timeout
 * - Rejects URLs that match Members-only patterns (defense-in-depth, per §C.1)
 * NOTE: caller is responsible for robots.txt verification at source-registration time.
 */
export async function fetchExternal(rawUrl: string): Promise<FetchedSource> {
  if (MEMBERS_ONLY_PATTERNS.some((re) => re.test(rawUrl))) {
    throw new Error(
      "URL matches a Members-only pattern. Members-only content cannot be ingested.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(rawUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,application/pdf" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`Fetch failed: HTTP ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    // PDF: we don't store binaries (per §C.2). For now return a placeholder text marker.
    if (contentType.includes("application/pdf")) {
      return {
        html: "[PDF binary — admin will upload extracted text separately]",
        contentType,
        finalUrl: res.url,
        status: res.status,
      };
    }
    const html = await res.text();
    return { html, contentType, finalUrl: res.url, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Very lightweight HTML → text extraction. Strips scripts/styles and tags.
 * For PDFs the admin pastes text in the registration form (M1 scope).
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractMetaFromHtml(html: string): {
  readonly title: string | null;
  readonly description: string | null;
  readonly publishedAt: string | null;
} {
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
    null;
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    null;
  const publishedAt =
    html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] ??
    null;
  return { title, description, publishedAt };
}
