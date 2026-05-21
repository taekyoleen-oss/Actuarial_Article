"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { classifyEmailDomain } from "@/lib/auth/domain-classifier";

const signupInput = z.object({
  email: z.string().email("올바른 이메일 주소를 입력하세요."),
  display_name: z.string().min(2, "이름은 2자 이상이어야 합니다.").max(60),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(128),
});

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Sign-up flow per §2.2:
 *   1) Supabase Auth creates user (default: email confirmation)
 *   2) aik_members row INSERT via service role (anon RLS would block — chicken-and-egg)
 *   3) Redirect to /auth/pending
 *
 * The aik_admin_users insert + status='active' is the admin's job in /admin/members.
 */
export async function signUpMember(formData: FormData): Promise<void> {
  const parsed = signupInput.safeParse({
    email: formData.get("email")?.toString().trim(),
    display_name: formData.get("display_name")?.toString().trim(),
    password: formData.get("password")?.toString(),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" / ");
    redirect(`/auth/signup?error=${encodeURIComponent(msg)}`);
  }
  const { email, display_name, password } = parsed.data;

  const supabase = await createClient();
  const { data: signupData, error: signupErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name } },
  });
  if (signupErr) {
    redirect(`/auth/signup?error=${encodeURIComponent(signupErr.message)}`);
  }
  const authUserId = signupData.user?.id;
  if (!authUserId) {
    // Email confirmation flow without immediate user; ask user to verify mailbox.
    redirect("/auth/pending?reason=verify_email");
  }

  // Service-role insert (RLS otherwise: aik_members policy requires auth.uid()=auth_user_id,
  // which works for the inserter, but the membership table is sensitive — service role
  // gives us a clean atomic create regardless of session-cookie race).
  const admin = createServiceClient();
  const classification = classifyEmailDomain(email);
  const { error: memberErr } = await admin.from("aik_members").insert({
    auth_user_id: authUserId,
    email,
    display_name,
    domain_classification: classification,
    status: "pending",
  });
  if (memberErr) {
    redirect(`/auth/signup?error=${encodeURIComponent(memberErr.message)}`);
  }

  await admin.from("aik_notifications").insert({
    type: "new_member",
    payload_json: {
      email,
      display_name,
      domain_classification: classification,
    },
  });

  redirect("/auth/pending");
}

export async function signInMember(formData: FormData): Promise<void> {
  const parsed = loginInput.safeParse({
    email: formData.get("email")?.toString().trim(),
    password: formData.get("password")?.toString(),
  });
  if (!parsed.success) {
    redirect(`/auth/login?error=${encodeURIComponent("이메일·비밀번호를 모두 입력하세요.")}`);
  }
  const { email, password } = parsed.data;
  const next = formData.get("next")?.toString() || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }
  // status='pending' members are intercepted by requireActiveMember on member routes;
  // for public pages they can log in but won't see member-only content.
  redirect(next);
}

export async function signOutMember(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
