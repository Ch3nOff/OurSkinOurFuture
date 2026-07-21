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

const DEFAULT_BASE = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

/**
 * Call Qwen chat completions. Throws on missing key or failed call so
 * callers can surface the real error instead of silently falling back.
 */
export async function callQwen({ system, user, maxTokens = 900, temperature = 0.7 }) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    const err = new Error("DASHSCOPE_API_KEY is not configured on the server.");
    err.status = 500;
    throw err;
  }

  const baseUrl = process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE;
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus";

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
    const err = new Error(`Qwen API error (${res.status}): ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    const err = new Error("Qwen returned an empty response.");
    err.status = 502;
    throw err;
  }
  return content;
}
