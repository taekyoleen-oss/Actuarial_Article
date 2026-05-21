import { requireAdmin } from "@/lib/supabase/admin-guard";
import { AdminSidebar, AdminMobileNotice } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { user, supabase } = await requireAdmin();

  const { count: unreadCount } = await supabase
    .from("aik_notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        notificationCount={unreadCount ?? 0}
        adminEmail={user.email ?? undefined}
      />
      <div className="flex flex-1 flex-col">
        <AdminMobileNotice />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
