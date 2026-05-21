import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminDocument,
  getInterpretation,
  getLatestTranslation,
} from "@/lib/supabase/queries/admin";
import { ReviewWorkspace } from "@/components/admin/ReviewWorkspace";
import {
  archiveDocument,
  promoteDocumentAction,
  publishDocument,
  updateInterpretation,
  updateTranslation,
} from "@/lib/actions/documents";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "문서 검수 — 관리자" };

export default async function ReviewPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getAdminDocument(id);
  if (!doc) notFound();

  const [translation, interpretation] = await Promise.all([
    getLatestTranslation(id),
    getInterpretation(id),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/admin/documents"
          className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
        >
          ← 문서 목록으로
        </Link>
        <h1 className="font-serif text-2xl">{doc.title_ko || doc.title}</h1>
        <p className="text-xs text-[color:var(--color-muted-foreground)]">{doc.title}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{doc.region}</Badge>
          <Badge variant="outline">{doc.track}</Badge>
          <Badge variant="outline">{doc.primary_topic}</Badge>
          <Badge variant="outline">{doc.status}</Badge>
        </div>
        <a
          href={doc.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[color:var(--color-primary)] hover:underline"
        >
          {doc.original_url}
        </a>
      </header>

      <ReviewWorkspace
        documentId={doc.id}
        currentStage={doc.depth_stage}
        targetStage={doc.target_depth_stage}
        status={doc.status}
        translation={translation}
        interpretation={interpretation}
        promote={async (formData) => {
          "use server";
          const result = await promoteDocumentAction(formData);
          return { ok: result.ok, message: result.message };
        }}
        publish={publishDocument}
        archive={archiveDocument}
        saveTranslation={updateTranslation}
        saveInterpretation={updateInterpretation}
      />
    </div>
  );
}
