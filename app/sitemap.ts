import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actuarial-intel.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    "",
    "/library",
    "/data-catalog",
    "/about",
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  let docs: ReadonlyArray<{ slug: string; published_at: string | null }> = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("aik_public_documents")
      .select("slug, published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1000);
    docs = (data ?? []) as typeof docs;
  } catch {
    docs = [];
  }

  const docEntries: MetadataRoute.Sitemap = docs.map((d) => ({
    url: `${SITE_URL}/library/${d.slug}`,
    lastModified: d.published_at ? new Date(d.published_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...docEntries];
}
