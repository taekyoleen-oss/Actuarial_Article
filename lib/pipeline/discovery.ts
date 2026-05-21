import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchExternal, htmlToText } from "./fetch-source";

const MAX_NEW_PER_RUN = Number(process.env.DISCOVERY_MAX_NEW_PER_RUN ?? 20);

export interface DiscoveryCandidate {
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: string;
  readonly summary?: string;
}

export interface DiscoveryRunOutput {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly found: number;
  readonly newCount: number;
  readonly errorMessage?: string;
}

/**
 * Run discovery for a single source.
 * Strategy: try RSS/Atom feed auto-detect (in <link> tags or common feed paths),
 * then fall back to HTML link extraction via discovery_selector_json.
 */
export async function runDiscoveryForSource(sourceId: string): Promise<DiscoveryRunOutput> {
  const supabase = createServiceClient();
  const startedAt = new Date().toISOString();

  const { data: source, error: sourceErr } = await supabase
    .from("aik_sources")
    .select(
      "id, name, base_url, region, track, quotation_policy, members_only_default, discovery_selector_json",
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (sourceErr || !source) {
    await recordRun({
      supabase,
      sourceId,
      startedAt,
      found: 0,
      newCount: 0,
      status: "failed",
      errorMessage: sourceErr?.message ?? "source not found",
    });
    return {
      sourceId,
      sourceName: "(unknown)",
      found: 0,
      newCount: 0,
      errorMessage: sourceErr?.message ?? "source not found",
    };
  }

  const s = source as DiscoverySourceRow;

  try {
    const candidates = await discoverCandidates(s);
    const found = candidates.length;

    // Truncate by configured limit
    const limited = candidates.slice(0, MAX_NEW_PER_RUN);

    // Check which URLs are already in aik_documents
    const urls = limited.map((c) => c.url);
    const { data: existing } = await supabase
      .from("aik_documents")
      .select("original_url")
      .in("original_url", urls);
    const existingSet = new Set(
      (existing ?? []).map((r) => (r as { original_url: string }).original_url),
    );

    const fresh = limited.filter((c) => !existingSet.has(c.url));

    // Insert fresh candidates as pending documents in track=auto_discovery
    if (fresh.length > 0) {
      const rows = fresh.map((c) => ({
        source_id: s.id,
        original_url: c.url,
        title: c.title,
        original_lang: s.region === "domestic" ? "ko" : "en",
        published_at: c.publishedAt ?? null,
        fetched_at: new Date().toISOString(),
        status: "pending",
        depth_stage: "registered",
        target_depth_stage: "summarized",
        region: s.region,
        track: "auto_discovery",
        discovery_method: "auto",
        slug: makeSlug(c.title, c.url),
        primary_topic: "other",
        business_areas: [],
        is_members_only_source: s.members_only_default,
      }));
      const { error: insertErr } = await supabase.from("aik_documents").insert(rows);
      if (insertErr) throw insertErr;
    }

    // Update source.last_discovery_at
    await supabase
      .from("aik_sources")
      .update({ last_discovery_at: new Date().toISOString() })
      .eq("id", s.id);

    await recordRun({
      supabase,
      sourceId: s.id,
      startedAt,
      found,
      newCount: fresh.length,
      status: fresh.length === found ? "success" : "partial",
    });

    // Notification when new candidates appear
    if (fresh.length > 0) {
      await supabase.from("aik_notifications").insert({
        type: "new_discovery_candidates",
        payload_json: {
          source_id: s.id,
          source_name: s.name,
          count: fresh.length,
          first_titles: fresh.slice(0, 3).map((c) => c.title),
        },
      });
    }

    return { sourceId: s.id, sourceName: s.name, found, newCount: fresh.length };
  } catch (err) {
    const message = (err as Error).message;
    await recordRun({
      supabase,
      sourceId: s.id,
      startedAt,
      found: 0,
      newCount: 0,
      status: "failed",
      errorMessage: message,
    });
    return { sourceId: s.id, sourceName: s.name, found: 0, newCount: 0, errorMessage: message };
  }
}

/**
 * Run discovery for all sources where track='auto_discovery' AND is_reputable=true.
 */
export async function runDiscoveryAll(): Promise<DiscoveryRunOutput[]> {
  const supabase = createServiceClient();
  const { data: sources } = await supabase
    .from("aik_sources")
    .select("id")
    .eq("track", "auto_discovery")
    .eq("is_reputable", true);

  const ids = ((sources ?? []) as ReadonlyArray<{ id: string }>).map((r) => r.id);
  const results: DiscoveryRunOutput[] = [];
  // Sequential to respect per-domain rate limits (1 req/sec each, no concurrency).
  for (const id of ids) {
    results.push(await runDiscoveryForSource(id));
  }
  return results;
}

// =====================================================================
// Internal helpers
// =====================================================================

interface DiscoverySourceRow {
  readonly id: string;
  readonly name: string;
  readonly base_url: string;
  readonly region: "overseas" | "domestic";
  readonly track: string;
  readonly quotation_policy: string;
  readonly members_only_default: boolean;
  readonly discovery_selector_json: DiscoverySelector | null;
}

interface DiscoverySelector {
  readonly type?: "rss" | "atom" | "html";
  readonly feed_url?: string;
  readonly list_url?: string;
  readonly link_selector?: string; // CSS selector for <a> tags
  readonly title_selector?: string;
  readonly date_selector?: string;
}

async function discoverCandidates(s: DiscoverySourceRow): Promise<DiscoveryCandidate[]> {
  const cfg = s.discovery_selector_json ?? {};

  // (1) Explicit feed URL — strongest signal
  if (cfg.feed_url) {
    const fetched = await fetchExternal(cfg.feed_url);
    return parseFeedXml(fetched.html);
  }

  // (2) HTML list page with selectors
  if (cfg.list_url && cfg.link_selector) {
    const fetched = await fetchExternal(cfg.list_url);
    return extractLinksFromHtml(
      fetched.html,
      fetched.finalUrl,
      cfg.link_selector,
      cfg.title_selector,
      cfg.date_selector,
    );
  }

  // (3) Fallback: try auto-detecting RSS/Atom at base_url
  try {
    const fetched = await fetchExternal(s.base_url);
    const feedUrl = autoDetectFeedUrl(fetched.html, fetched.finalUrl);
    if (feedUrl) {
      const feedFetched = await fetchExternal(feedUrl);
      return parseFeedXml(feedFetched.html);
    }
    // Last resort: scrape /a[href] under the base page (often noisy, capped by limit)
    return extractLinksFromHtml(fetched.html, fetched.finalUrl, "a[href]", undefined, undefined);
  } catch {
    return [];
  }
}

function autoDetectFeedUrl(html: string, basePageUrl: string): string | null {
  // Look for <link rel="alternate" type="application/rss+xml" href="..."> or atom
  const re =
    /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/gi;
  const match = re.exec(html);
  if (!match) return null;
  return new URL(match[1], basePageUrl).href;
}

function parseFeedXml(xml: string): DiscoveryCandidate[] {
  const items: DiscoveryCandidate[] = [];
  // Very lightweight XML parser — handles standard RSS 2.0 <item> and Atom <entry>.
  const itemRe = /<(item|entry)\b[\s\S]*?<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const chunk = m[0];
    const title = stripTags(firstMatch(chunk, /<title[^>]*>([\s\S]*?)<\/title>/i));
    const link =
      firstMatch(chunk, /<link[^>]*>([\s\S]*?)<\/link>/i) ||
      firstMatch(chunk, /<link[^>]+href=["']([^"']+)["']/i) ||
      firstMatch(chunk, /<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pub =
      firstMatch(chunk, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      firstMatch(chunk, /<published[^>]*>([\s\S]*?)<\/published>/i) ||
      firstMatch(chunk, /<updated[^>]*>([\s\S]*?)<\/updated>/i);
    if (title && link) {
      items.push({
        title: title.slice(0, 280),
        url: link.trim(),
        publishedAt: normalizeDate(pub),
      });
    }
  }
  return items;
}

function extractLinksFromHtml(
  html: string,
  basePageUrl: string,
  linkSelector: string,
  _titleSelector?: string,
  _dateSelector?: string,
): DiscoveryCandidate[] {
  // We don't ship a full DOM parser; use a regex extractor scoped to <a href="..." ...>text</a>.
  // For richer selector support (`.foo a`, `[data-x]`), extend with cheerio later (M2.1).
  const out: DiscoveryCandidate[] = [];
  const linkRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1];
    const text = htmlToText(m[2]).slice(0, 200);
    if (!rawHref || !text || text.length < 8) continue;
    if (rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    try {
      const absolute = new URL(rawHref, basePageUrl).href;
      // Same-host filter to avoid pulling cross-site links from navigation
      if (new URL(absolute).host !== new URL(basePageUrl).host) continue;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      out.push({ title: text, url: absolute });
    } catch {
      // skip malformed URL
    }
  }
  void linkSelector; // selector is informational until cheerio is added
  return out.slice(0, 60);
}

function firstMatch(text: string, re: RegExp): string {
  const m = re.exec(text);
  return m ? stripTags(m[1] ?? "").trim() : "";
}

function stripTags(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeDate(s: string): string | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function makeSlug(title: string, url: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const tail = simpleHash(url).slice(0, 6);
  return `${base || "doc"}-${tail}`;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

async function recordRun(opts: {
  readonly supabase: ReturnType<typeof createServiceClient>;
  readonly sourceId: string;
  readonly startedAt: string;
  readonly found: number;
  readonly newCount: number;
  readonly status: "success" | "partial" | "failed";
  readonly errorMessage?: string;
}) {
  await opts.supabase.from("aik_discovery_runs").insert({
    source_id: opts.sourceId,
    started_at: opts.startedAt,
    finished_at: new Date().toISOString(),
    candidates_found: opts.found,
    candidates_new: opts.newCount,
    status: opts.status,
    error_message: opts.errorMessage ?? null,
  });
}
