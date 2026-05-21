import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/supabase/admin-guard";
import { runDiscoveryAll, runDiscoveryForSource } from "@/lib/pipeline/discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Discovery trigger — invoked by Vercel Cron weekly OR by an admin manually.
 *
 * Auth modes (either is accepted):
 *   1. Vercel Cron: header `Authorization: Bearer ${CRON_SECRET}` (Vercel injects this when configured)
 *   2. Admin session: `getAdminUser()` returns non-null
 *
 * Query params:
 *   ?source=all          → discover every track=auto_discovery + is_reputable source
 *   ?source=<source-uuid>  → discover one source
 */
export async function GET(request: NextRequest) {
  // --- auth ---
  const auth = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  const isCron = !!expected && auth === `Bearer ${expected}`;
  const adminCtx = !isCron ? await getAdminUser() : null;
  if (!isCron && !adminCtx) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // --- target ---
  const source = request.nextUrl.searchParams.get("source") ?? "all";

  try {
    if (source === "all") {
      const results = await runDiscoveryAll();
      return NextResponse.json({
        ok: true,
        invoked_by: isCron ? "cron" : "admin",
        results,
        total_sources: results.length,
        total_new: results.reduce((sum, r) => sum + r.newCount, 0),
      });
    } else {
      const result = await runDiscoveryForSource(source);
      return NextResponse.json({
        ok: true,
        invoked_by: isCron ? "cron" : "admin",
        result,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

// Vercel Cron only sends GET; this POST is a defensive alias for tools that wrap.
export const POST = GET;
