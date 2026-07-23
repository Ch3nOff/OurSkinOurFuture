import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      analysis,
      simulationResult,
      recommendation,
      plan,
      routine,
      prefs,
      dateStr,
      timeStr,
    } = body;

    if (!analysis) {
      return NextResponse.json({ error: "Missing analysis data" }, { status: 400 });
    }

    const concernsHtml = Object.entries(analysis.concerns || {})
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([key, score]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const pct = Math.min(100, Math.max(0, score));
        const color = pct >= 61 ? "#B85C4A" : pct >= 31 ? "#C9A876" : "#4A6355";
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#1A1A1A;font-size:13px;">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;text-align:right;font-weight:600;color:${color};font-size:13px;">${pct}/100</td>
        </tr>`;
      }).join("");

    const zonesHtml = Object.entries(analysis.zones || {})
      .map(([key, score]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#1A1A1A;font-size:13px;">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;text-align:right;font-weight:600;color:#1A1A1A;font-size:13px;">${score}/100</td>
        </tr>`;
      }).join("");

    const skinTypesHtml = (analysis.skinTypes || [])
      .map((st) => {
        const region = st.region === "whole" ? "SKIN" : st.region.replace(/_/g, " ").toUpperCase();
        return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#F0EBDD;color:#6B5D42;font-size:12px;margin:2px;">${region}: ${st.skinType.toUpperCase()}</span>`;
      })
      .join(" ");

    const simulationText = simulationResult
      ? Object.entries(simulationResult.projectedScores || simulationResult.scores || {})
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 5)
          .map(([k, v]) => `${k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: ${Math.round(v)}/100`)
          .join("<br/>")
      : "Not generated";

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Skin Analysis Report - ${dateStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1A1A1A; margin: 0; padding: 24px; background: #fff; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .logo { width: 48px; height: 48px; border-radius: 12px; background: #1A1A1A; display: flex; align-items: center; justify-content: center; color: #C9A876; font-weight: 700; font-size: 18px; }
    .title { font-size: 20px; font-weight: 700; letter-spacing: -0.2px; }
    .subtitle { font-size: 12px; color: #6B5D42; margin-top: 2px; }
    .card { border: 1px solid #F0EBDD; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
    .section { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6B5D42; margin-bottom: 10px; }
    .meta { font-size: 12px; color: #6B5D42; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    .footer { font-size: 11px; color: #6B5D42; margin-top: 8px; }
    .actions { margin-top: 18px; text-align: right; }
    .actions button { padding: 10px 14px; border-radius: 12px; border: 1px solid #1A1A1A; background: #1A1A1A; color: #fff; font-size: 12px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">OS</div>
      <div>
        <div class="title">OurSkinOurFuture</div>
        <div class="subtitle">Clinical Skin Analysis Report</div>
      </div>
    </div>

    <div class="meta">Exported: ${dateStr} at ${timeStr} · Source: ${analysis.mock ? "Demo model" : "YouCam Skin Analysis"}</div>

    <div class="card">
      <div class="section">Overview</div>
      <table>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#1A1A1A;font-size:13px;">Overall Score</td><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;text-align:right;font-weight:700;font-size:13px;">${analysis.overall ?? "—"}/100</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#1A1A1A;font-size:13px;">Skin Age</td><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;text-align:right;font-weight:700;font-size:13px;">${analysis.skinAge ?? "—"}</td></tr>
        <tr><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#1A1A1A;font-size:13px;">Skin Types</td><td style="padding:8px 12px;border-bottom:1px solid #F0EBDD;text-align:right;font-size:13px;">${skinTypesHtml || "—"}</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="section">Concern Severity</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#6B5D42;font-size:11px;font-weight:600;">Concern</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#6B5D42;font-size:11px;font-weight:600;">Score</th>
          </tr>
        </thead>
        <tbody>${concernsHtml}</tbody>
      </table>
    </div>

    <div class="card">
      <div class="section">Zone Scores</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#6B5D42;font-size:11px;font-weight:600;">Zone</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #F0EBDD;color:#6B5D42;font-size:11px;font-weight:600;">Score</th>
          </tr>
        </thead>
        <tbody>${zonesHtml}</tbody>
      </table>
    </div>

    <div class="card">
      <div class="section">Treatment Simulation</div>
      <div style="font-size:13px;color:#1A1A1A;line-height:1.6;">${simulationText}</div>
    </div>

    ${recommendation ? `<div class="card"><div class="section">Personal Note</div><p style="font-size:13px;color:#1A1A1A;line-height:1.6;white-space:pre-line;">${recommendation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></div>` : ""}

    ${plan ? `<div class="card"><div class="section">Your Plan</div><p style="font-size:13px;color:#1A1A1A;line-height:1.6;white-space:pre-line;">${plan.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></div>` : ""}

    <div class="footer">Generated by OurSkinOurFuture · ${dateStr}</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="skin-report-${dateStr}.html"`,
      },
    });
  } catch (err) {
    console.error("Download route error:", err);
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
