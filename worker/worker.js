/**
 * AI/GUIDE backend — a Cloudflare Worker (the free plan is enough).
 *
 *   GET  /read?url=https://example.com   → the page as plain text (webpage reader)
 *   POST /gemini/v1beta/...              → Google Gemini API, with YOUR key added on the server
 *   POST /claude/v1/messages             → Anthropic API, with YOUR key added on the server
 *
 * Keys are stored as Cloudflare secrets, never in the code:
 *   npx wrangler secret put GEMINI_API_KEY
 *   npx wrangler secret put ANTHROPIC_API_KEY   (optional)
 *
 * ALLOWED_ORIGIN (wrangler.toml) restricts which websites may use this worker.
 * Also add a Rate Limiting rule in the Cloudflare dashboard so strangers can't burn your quota.
 */
export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
    const allowOrigin = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : "";
    const cors = {
      "access-control-allow-origin": allowOrigin || "null",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, accept, anthropic-version",
      "access-control-max-age": "86400",
      vary: "origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!allowOrigin) return text("Origin not allowed. Add your site to ALLOWED_ORIGIN.", 403, cors);

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/read" && request.method === "GET") return await readPage(url.searchParams.get("url"), cors);
      if (path.startsWith("/gemini/") && request.method === "POST") return await proxyGemini(request, path.slice("/gemini".length), url.search, env, cors);
      if (path === "/claude/v1/messages" && request.method === "POST") return await proxyClaude(request, env, cors);
    } catch (e) {
      return text("Worker error: " + e.message, 502, cors);
    }
    return text("AI/GUIDE backend. Routes: GET /read?url=, POST /gemini/v1beta/..., POST /claude/v1/messages", 200, cors);
  },
};

// ---------- AI proxies ----------
const MAX_BODY = 400_000; // bytes; stops abuse with huge requests

async function proxyGemini(request, subpath, search, env, cors) {
  if (!env.GEMINI_API_KEY) return text("GEMINI_API_KEY secret is not set on the worker", 500, cors);
  // Only allow model calls, nothing else on the Google API
  if (!/^\/v1beta\/models\/[\w.-]+:(generateContent|streamGenerateContent)$/.test(subpath)) return text("Route not allowed", 400, cors);
  const body = await request.text();
  if (body.length > MAX_BODY) return text("Request too large", 413, cors);
  const res = await fetch("https://generativelanguage.googleapis.com" + subpath + search, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body,
  });
  return passThrough(res, cors);
}

async function proxyClaude(request, env, cors) {
  if (!env.ANTHROPIC_API_KEY) return text("ANTHROPIC_API_KEY secret is not set on the worker", 500, cors);
  const body = await request.text();
  if (body.length > MAX_BODY) return text("Request too large", 413, cors);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body,
  });
  return passThrough(res, cors);
}

function passThrough(res, cors) {
  const h = new Headers(cors);
  h.set("content-type", res.headers.get("content-type") || "application/json");
  return new Response(res.body, { status: res.status, headers: h });
}

// ---------- Webpage reader ----------
async function readPage(raw, cors) {
  let target;
  try { target = new URL(raw || ""); } catch { return text("Invalid url", 400, cors); }
  if (!/^https?:$/.test(target.protocol) || isPrivateHost(target.hostname)) return text("URL not allowed", 400, cors);

  const res = await fetch(target.href, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; AIGuideReader/1.0)", accept: "text/html,text/plain;q=0.9,*/*;q=0.5" },
    redirect: "follow",
    cf: { cacheTtl: 300 },
  });
  if (!res.ok) return text(`Upstream returned HTTP ${res.status}`, 502, cors);
  const type = res.headers.get("content-type") || "";
  const body = (await res.text()).slice(0, 2_000_000);
  return text(`URL: ${target.href}\n\n${(type.includes("html") ? htmlToText(body) : body).slice(0, 100_000)}`, 200, cors);
}

function text(body, status, headers) {
  return new Response(body, { status, headers: { ...headers, "content-type": "text/plain; charset=utf-8" } });
}

function isPrivateHost(h) {
  h = h.toLowerCase();
  return h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === "[::1]" || h.startsWith("[fc") || h.startsWith("[fd") || h.startsWith("[fe80");
}

function htmlToText(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const body = html
    .replace(/<(head|script|style|noscript|svg|nav|footer|header|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
  return (title ? `TITLE: ${title.trim()}\n\n` : "") + body;
}
