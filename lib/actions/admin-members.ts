"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import type { MemberStatus } from "@/types/domain";

async function setMemberStatus(memberId: string, status: MemberStatus): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const patch: Record<string, unknown> = {
    status,
    approved_by: status === "active" ? user.id : null,
    approved_at: status === "active" ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from("aik_members").update(patch).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/members");
}

export async function approveMember(formData: FormData): Promise<void> {
  const id = String(formData.get("member_id") ?? "");
  if (!id) throw new Error("missing member_id");
  await setMemberStatus(id, "active");
}

export async function rejectMember(formData: FormData): Promise<void> {
  const id = String(formData.get("member_id") ?? "");
  if (!id) throw new Error("missing member_id");
  await setMemberStatus(id, "rejected");
}

export async function suspendMember(formData: FormData): Promise<void> {
  const id = String(formData.get("member_id") ?? "");
  if (!id) throw new Error("missing member_id");
  await setMemberStatus(id, "suspended");
}

export async function reactivateMember(formData: FormData): Promise<void> {
  const id = String(formData.get("member_id") ?? "");
  if (!id) throw new Error("missing member_id");
  await setMemberStatus(id, "active");
}
