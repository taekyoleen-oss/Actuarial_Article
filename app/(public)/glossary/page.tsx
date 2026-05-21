import { listGlossary } from "@/lib/supabase/queries/glossary";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 600;

export const metadata = {
  title: "용어 사전",
  robots: { index: false, follow: true },
};

export default async function GlossaryPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let terms: Awaited<ReturnType<typeof listGlossary>> = [];
  try {
    terms = await listGlossary(q);
  } catch {
    terms = [];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl">용어 사전</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
          영-한 계리 용어 {terms.length}건 (검색·필터)
        </p>
      </header>

      <form action="/glossary" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="용어 검색 (영어 또는 한국어)"
          className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-primary-foreground)]"
        >
          검색
        </button>
      </form>

      {terms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
            등록된 용어가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((term) => (
            <Card key={term.id}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-serif text-base font-semibold">{term.term_en}</p>
                  <p className="text-sm text-[color:var(--color-primary)]">
                    {term.term_ko_standard}
                  </p>
                </div>
                <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                  {term.definition_ko}
                </p>
                {term.term_ko_alternatives.length > 0 ? (
                  <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                    이형: {term.term_ko_alternatives.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
