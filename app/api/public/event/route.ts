import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const eventInput = z.object({
  event_type: z.enum([
    "view_document",
    "click_tag",
    "click_term",
    "click_external",
    "search",
  ]),
  target_id: z.string().max(120).optional(),
  anon_session_hash: z.string().max(128).optional(),
});

const RATE_WINDOW_MS = 5_000;
const RATE_MAX = 20;
const ipBuckets = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = ipBuckets.get(ip) ?? [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  ipBuckets.set(ip, recent);
  return recent.length > RATE_MAX;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = eventInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const supabase = createServiceClient();
  await supabase.from("aik_event_log").insert({
    event_type: parsed.data.event_type,
    target_id: parsed.data.target_id ?? null,
    anon_session_hash: parsed.data.anon_session_hash ?? null,
  });
  return NextResponse.json({ ok: true });
}
