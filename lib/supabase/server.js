import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, Route
 * Handlers, and Server Actions. Reads the session from the request's
 * cookies. In a Server Component (not a Route Handler), cookie writes
 * are a no-op by design — Next.js only allows setting cookies from a
 * Server Action or Route Handler, so the try/catch below is not a bug
 * workaround, it's the documented @supabase/ssr pattern for this case.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // Session refresh is handled by middleware.js instead.
          }
        },
      },
    }
  );
}
