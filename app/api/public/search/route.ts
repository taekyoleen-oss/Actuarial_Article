import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DocResult {
  id: string;
  slug: string;
  title: string;
  title_ko: string | null;
}
interface TermResult {
  id: string;
  term_en: string;
  term_ko_standard: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ documents: [], terms: [] });
  }
  const pattern = `%${q}%`;

  const supabase = await createClient();

  const [docs, terms] = await Promise.all([
    supabase
      .from("aik_public_documents")
      .select("id, slug, title, title_ko")
      .or(`title.ilike.${pattern},title_ko.ilike.${pattern}`)
      .limit(8),
    supabase
      .from("aik_glossary")
      .select("id, term_en, term_ko_standard")
      .or(`term_en.ilike.${pattern},term_ko_standard.ilike.${pattern}`)
      .limit(8),
  ]);

  return NextResponse.json({
    documents: (docs.data ?? []) as unknown as DocResult[],
    terms: (terms.data ?? []) as unknown as TermResult[],
  });
}
