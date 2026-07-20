import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

// Not statically generated — this page reads the user's session and
// their personal scan history on every request, which is inherently
// dynamic per-visitor data.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let history = [];
  if (user) {
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    history = data ?? [];
  }

  return <DashboardClient initialUser={user} initialHistory={history} />;
}
