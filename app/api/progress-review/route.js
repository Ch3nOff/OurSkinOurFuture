import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, scans } = body;

    if (!userId && !scans) {
      return NextResponse.json({ error: "userId or scans array required" }, { status: 400 });
    }

    let scanData = scans;

    if (userId && !scanData) {
      const supabase = await createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("scans")
        .select("concern_scores, created_at, routine, preferences")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      scanData = data || [];
    }

    if (!scanData || scanData.length === 0) {
      return NextResponse.json({
        review: "No scan history available yet. Complete your first scan to start tracking progress.",
        hasHistory: false,
      });
    }

    const first = scanData[0];
    const latest = scanData[scanData.length - 1];
    const daysTracked = Math.max(1, Math.round((new Date(latest.created_at) - new Date(first.created_at)) / (1000 * 60 * 60 * 24)));

    const concernChanges = {};
    Object.keys(latest.concern_scores || {}).forEach((key) => {
      const initial = first.concern_scores[key];
      const current = latest.concern_scores[key];
      if (typeof initial === "number" && typeof current === "number") {
        concernChanges[key] = { initial, current, delta: initial - current };
      }
    });

    const noticeable = Object.entries(concernChanges)
      .filter(([, v]) => Math.abs(v.delta) >= 5)
      .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))
      .slice(0, 5);

    let review = "";
    if (noticeable.length === 0) {
      review = `Over the last ${daysTracked} days, your skin scores have remained relatively stable. Consistency is key — keep following your routine and track your next scan to see changes over time.`;
    } else {
      const improvements = noticeable.filter(([, v]) => v.delta > 0);
      const declines = noticeable.filter(([, v]) => v.delta < 0);

      if (improvements.length > 0) {
        review += `Great progress over ${daysTracked} days: `;
        review += improvements.map(([key, v]) => `${key} improved by ${v.delta} points`).join(", ");
        review += ". ";
      }
      if (declines.length > 0) {
        review += `Areas to watch: `;
        review += declines.map(([key, v]) => `${key} increased by ${Math.abs(v.delta)} points`).join(", ");
        review += ". ";
      }
      review += `You've completed ${scanData.length} scans. Keep up the routine and re-scan in 2-4 weeks to track continued improvement.`;
    }

    return NextResponse.json({
      review,
      hasHistory: true,
      scanCount: scanData.length,
      daysTracked,
      concernChanges,
      noticeable,
    });
  } catch (err) {
    console.error("Progress review error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
