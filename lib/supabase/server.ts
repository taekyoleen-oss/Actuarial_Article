import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. Reads/writes cookies via Next.js cookies() API.
 * Use in Server Components, Route Handlers, and Server Actions.
 *
 * Note: until `supabase gen types typescript` produces the real Database type,
 * we leave the client untyped (loose). Per-query rows are cast at the boundary
 * to interfaces in lib/supabase/queries/*.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll() may throw in Server Components; the middleware refreshes the session,
            // so the no-op here is safe.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for admin-only server operations.
 * NEVER expose to the browser. Bypasses RLS.
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
