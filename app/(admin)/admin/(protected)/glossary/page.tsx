import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listGlossary } from "@/lib/supabase/queries/glossary";
import { createTerm, deleteTerm } from "@/lib/actions/glossary";

export const dynamic = "force-dynamic";

export const metadata = { title: "용어 사전 — 관리자" };

export default async function AdminGlossaryPage({
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
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">용어 사전 관리</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          영-한 표준 번역어를 관리합니다. 번역 파이프라인이 이 사전을 기준으로 후처리합니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 용어 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTerm} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">영문 (term_en)</span>
              <input
                name="term_en"
                required
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">한국어 표준</span>
              <input
                name="term_ko_standard"
                required
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">한국어 이형 (쉼표 구분, 선택)</span>
              <input
                name="term_ko_alternatives"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">정의 (한국어)</span>
              <textarea
                name="definition_ko"
                required
                rows={3}
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">도메인 (선택)</span>
              <input
                name="domain"
                placeholder="life / non-life / IFRS17 / ..."
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">용어 추가</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">등록된 용어 ({terms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              등록된 용어가 없습니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-[color:var(--color-muted-foreground)]">
                <tr>
                  <th className="py-2 text-left">영문</th>
                  <th className="py-2 text-left">한국어 표준</th>
                  <th className="py-2 text-left">정의</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {terms.map((t) => (
                  <tr key={t.id} className="border-t border-[color:var(--color-border)]">
                    <td className="py-2.5 font-medium">{t.term_en}</td>
                    <td className="py-2.5 text-[color:var(--color-primary)]">{t.term_ko_standard}</td>
                    <td className="py-2.5 text-xs text-[color:var(--color-muted-foreground)]">
                      {t.definition_ko.slice(0, 80)}
                      {t.definition_ko.length > 80 ? "…" : ""}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={deleteTerm.bind(null, t.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-[color:var(--color-destructive)]"
                        >
                          삭제
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
