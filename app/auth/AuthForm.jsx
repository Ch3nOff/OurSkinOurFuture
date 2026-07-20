"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setConfirmSent(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <div className="rounded-3xl p-6 bg-card border border-border text-center">
        <p className="text-sm text-ink leading-relaxed">
          Check <span className="font-semibold">{email}</span> for a confirmation link to finish creating your
          account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl p-6 bg-card border border-border">
      <div className="flex gap-1 mb-6 p-1 rounded-full bg-paper">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
            mode === "signin" ? "bg-ink text-paper" : "text-muted"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors ${
            mode === "signup" ? "bg-ink text-paper" : "text-muted"
          }`}
        >
          Create Account
        </button>
      </div>

      <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5 text-muted">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl px-3.5 py-2.5 mb-4 text-sm bg-paper border border-border text-ink outline-none focus:border-sage transition-colors"
        placeholder="you@example.com"
      />

      <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5 text-muted">Password</label>
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl px-3.5 py-2.5 mb-5 text-sm bg-paper border border-border text-ink outline-none focus:border-sage transition-colors"
        placeholder="At least 6 characters"
      />

      {error && (
        <div className="flex items-start gap-2 mb-4 text-clay">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-paper active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {mode === "signin" ? "Sign In" : "Create Account"}
      </button>
    </form>
  );
}
