"use client";

export function Narrative({
  text,
  source,
  loading,
}: {
  text: string | null;
  source: "claude" | "fallback" | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <span className="relative flex h-3 w-3">
            <span className="pulse-ring absolute inline-flex h-full w-full" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--accent)]" />
          </span>
          Writing your personal skin read…
        </div>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div className="relative rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--panel)] to-[var(--panel-2)] p-5">
      <p className="text-sm font-semibold text-[var(--accent)]">
        Your skin, in plain language
      </p>
      <p className="mt-2 text-[15px] leading-relaxed">{text}</p>
      {source === "fallback" && (
        <p className="mt-3 text-xs text-[var(--muted)]">
          (Generated locally — set ANTHROPIC_API_KEY to enable the live AI
          narrative.)
        </p>
      )}
    </div>
  );
}
