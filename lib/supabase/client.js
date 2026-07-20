"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use this inside components marked
 * "use client" — it reads the session from cookies automatically.
 * Call this function fresh each time rather than module-level
 * singleton-ing it; @supabase/ssr expects this pattern.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
