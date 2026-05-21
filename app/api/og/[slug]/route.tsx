import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  type OgDoc = {
    title: string;
    title_ko: string | null;
    source_organization: string;
    depth_stage: string;
  };
  let doc: OgDoc | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("aik_public_documents")
      .select("title, title_ko, source_organization, depth_stage")
      .eq("slug", slug)
      .maybeSingle();
    doc = data ? (data as unknown as OgDoc) : null;
  } catch {
    doc = null;
  }

  const titleKo = doc?.title_ko ?? doc?.title ?? "Actuarial Intel Korea";
  const org = doc?.source_organization ?? "Actuarial Intel Korea";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FAFAF8",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            color: "#0F2A4A",
          }}
        >
          <div
            style={{
              backgroundColor: "#0F2A4A",
              color: "#FAFAF8",
              padding: "6px 12px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            AIK
          </div>
          <span>Actuarial Intel Korea</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#1A1A1A",
              maxWidth: 1000,
            }}
          >
            {titleKo.slice(0, 80)}
          </div>
          <div style={{ fontSize: 32, color: "#5B5B58" }}>{org}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#5B5B58",
          }}
        >
          <span>한국 실무 도입 큐레이션</span>
          <span style={{ color: "#C89B3C", fontWeight: 600 }}>
            depth: {doc?.depth_stage ?? "registered"}
          </span>
        </div>
      </div>
    ),
    { width: SIZE.width, height: SIZE.height },
  );
}
