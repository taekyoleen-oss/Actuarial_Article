import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { MemberStatus } from "@/types/domain";

export interface MemberContext {
  readonly authUser: {
    readonly id: string;
    readonly email: string | null;
  };
  readonly member: {
    readonly id: string;
    readonly email: string;
    readonly display_name: string;
    readonly status: MemberStatus;
    readonly domain_classification: string;
  };
  readonly supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Active-member gate. Used by app/(member)/account/* and any code path that
 * requires a fully approved member.
 *
 * Redirects:
 *   - unauthenticated → /auth/login?next=<path>
 *   - authenticated but no aik_members row → /auth/login?error=no_member
 *   - status='pending' / 'rejected' / 'suspended' → /auth/pending
 */
export async function requireActiveMember(currentPath?: string): Promise<MemberContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = currentPath ? `/auth/login?next=${encodeURIComponent(currentPath)}` : "/auth/login";
    redirect(url);
  }

  const { data: member } = await supabase
    .from("aik_members")
    .select("id, email, display_name, status, domain_classification")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!member) {
    redirect("/auth/login?error=no_member");
  }

  const memberRow = member as MemberContext["member"];
  if (memberRow.status !== "active") {
    redirect("/auth/pending");
  }

  return {
    authUser: { id: user.id, email: user.email ?? null },
    member: memberRow,
    supabase,
  };
}

/**
 * Soft version — never redirects. Returns null when not active.
 * Use inside Server Components that need to conditionally render member-only sections
 * (e.g. /library/[slug] showing the translation body if active, CTA otherwise).
 */
export async function getActiveMember(): Promise<MemberContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("aik_members")
    .select("id, email, display_name, status, domain_classification")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member) return null;

  const memberRow = member as MemberContext["member"];
  if (memberRow.status !== "active") return null;
  return {
    authUser: { id: user.id, email: user.email ?? null },
    member: memberRow,
    supabase,
  };
}
