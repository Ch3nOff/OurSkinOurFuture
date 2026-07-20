import Link from "next/link";
import { Sparkles, ScanFace, FlaskConical, TrendingUp, History } from "lucide-react";

const STEPS = [
  {
    icon: ScanFace,
    title: "Scan your skin",
    body: "Use your camera or upload a photo. The analysis reads condition across eight indicators and six facial zones — not just one overall score.",
  },
  {
    icon: FlaskConical,
    title: "Get matched ingredients",
    body: "Your top concerns are mapped to specific active ingredients, explained in plain language — not a generic five-step routine.",
  },
  {
    icon: TrendingUp,
    title: "See the projection",
    body: "A week-by-week simulation shows what consistent care could look like, so you know what you're working toward before you buy anything.",
  },
  {
    icon: History,
    title: "Track it over time",
    body: "Save your results and come back next week. Every new scan compares automatically against your last one — or pick any past scan to compare manually.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-3xl mx-auto px-5 pt-8 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-ink">
            <Sparkles size={14} color="#C9A876" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Our<span className="text-gold">Skin</span>Our<span className="text-gold">Future</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-xs font-medium text-muted hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-ink text-paper hover:opacity-90 transition-opacity"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5">
        {/* Hero */}
        <section className="pt-14 pb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-5 text-ink">
            Understand your skin.
            <br />
            See where it's headed.
          </h1>
          <p className="text-base leading-relaxed max-w-xl mx-auto mb-8 text-muted">
            A skin diagnostic that doesn't stop at "here's what's wrong." OurSkinOurFuture shows you the
            ingredients that address it and a realistic projection of what changes if you follow through —
            powered by YouCam's Skin AI.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-semibold bg-ink text-paper active:scale-[0.98] transition-transform"
          >
            Try It Now!
          </Link>
          <p className="text-[11px] mt-3 text-faint">No account needed to try it — sign in later to save your results.</p>
        </section>

        {/* How it works */}
        <section className="py-10">
          <div className="text-xs font-mono uppercase tracking-widest mb-6 text-center text-muted">How It Works</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-3xl p-5 bg-card border border-border">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#F0EBDD]">
                      <Icon size={15} className="text-[#8A7A52]" />
                    </div>
                    <span className="text-[10px] font-mono text-faint">STEP {i + 1}</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5 text-ink">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-muted">{step.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust / transparency note */}
        <section className="py-10 pb-16">
          <div className="rounded-3xl p-6 bg-ink">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles size={13} className="text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-gold">Built On</span>
            </div>
            <p className="text-sm leading-relaxed text-[#F0EBDD]">
              Skin condition analysis and treatment simulation run on YouCam's Skin AI. Ingredient
              recommendations are written by Claude, grounded in your specific scan results — not a template
              that ignores what your skin actually shows.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
