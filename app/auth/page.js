import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import AuthForm from "./AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-sm mx-auto px-5 pt-8 pb-2">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-ink">
            <Sparkles size={14} color="#C9A876" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Our<span className="text-gold">Skin</span>Our<span className="text-gold">Future</span>
          </span>
        </Link>
      </header>

      <main className="max-w-sm mx-auto px-5 pt-10 pb-16">
        <h1 className="text-2xl font-bold mb-2 text-ink">Save your progress</h1>
        <p className="text-sm mb-6 leading-relaxed text-muted">
          Sign in to save each scan and get automatic comparisons against your history.
        </p>

        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>

        <Link
          href="/dashboard"
          className="block text-center text-xs mt-5 text-muted hover:text-ink transition-colors"
        >
          Continue without an account →
        </Link>
      </main>
    </div>
  );
}
