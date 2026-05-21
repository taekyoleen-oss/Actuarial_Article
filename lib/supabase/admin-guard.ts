import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Resolves the current authenticated admin user.
 * Redirects to /admin/login if not authenticated or not whitelisted in aik_admin_users.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("aik_admin_users")
    .select("auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    // Authenticated but not admin — sign out and bounce
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_admin");
  }

  return { user, supabase };
}

/**
 * Same as requireAdmin but returns null instead of redirecting.
 * Use inside Route Handlers that need to return JSON 401s.
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("aik_admin_users")
    .select("auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return adminRow ? { user, supabase } : null;
}
