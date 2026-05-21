import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdoptionBadge } from "@/components/shared/AdoptionBadge";
import { DepthBadge } from "@/components/shared/DepthBadge";
import { RegionPill } from "@/components/shared/RegionPill";
import { PRIMARY_TOPIC_LABELS } from "@/types/domain";
import { formatDateKR } from "@/lib/utils";
import type { PublicDocumentRow } from "@/types/database";

interface DocumentCardProps {
  readonly doc: PublicDocumentRow;
  readonly summary?: string | null;
}

export function DocumentCard({ doc, summary }: DocumentCardProps) {
  return (
    <Card className="relative flex h-full flex-col">
      <div className="absolute left-3 top-3 z-10">
        <RegionPill region={doc.region} />
      </div>
      <div className="absolute right-3 top-3 z-10">
        <DepthBadge stage={doc.depth_stage} />
      </div>
      <CardHeader className="pt-12">
        <CardTitle>
          <Link
            href={`/library/${doc.slug}`}
            className="hover:text-[color:var(--color-primary)]"
          >
            {doc.title_ko || doc.title}
          </Link>
        </CardTitle>
        {doc.title_ko ? (
          <p className="text-xs text-[color:var(--color-muted-foreground)]">{doc.title}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {summary ? (
          <p className="line-clamp-3 text-sm text-[color:var(--color-muted-foreground)]">
            {summary}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[color:var(--color-muted-foreground)]">
            {doc.source_organization}
          </span>
          <span className="text-[color:var(--color-muted-foreground)]">·</span>
          <span className="text-[color:var(--color-muted-foreground)]">
            {formatDateKR(doc.published_at)}
          </span>
          <span className="text-[color:var(--color-muted-foreground)]">·</span>
          <span className="text-[color:var(--color-muted-foreground)]">
            {PRIMARY_TOPIC_LABELS[doc.primary_topic]}
          </span>
          {doc.adoption_grade ? <AdoptionBadge grade={doc.adoption_grade} className="ml-auto" /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
