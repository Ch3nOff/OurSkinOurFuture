// ============================================================
// Shared Qwen (Alibaba DashScope) client — server-side only.
//
// Qwen is called through DashScope's OpenAI-compatible endpoint, so the
// request/response shape matches the OpenAI chat completions API.
// The key (DASHSCOPE_API_KEY) is read ONLY here, server-side.
//
// If the key is missing or the call fails, callers provide their own
// templated fallback so the UI never shows a hard error.
// ============================================================

const DEFAULT_BASE = "https://dashscope-us.aliyuncs.com/compatible-mode/v1";

/**
 * Call Qwen chat completions. Returns the assistant text, or null on any
 * failure (missing key, network error, non-OK status).
 */
export async function callQwen({ system, user, maxTokens = 900, temperature = 0.7 }) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE;
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Qwen API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("Qwen call failed:", err.message);
    return null;
  }
}
