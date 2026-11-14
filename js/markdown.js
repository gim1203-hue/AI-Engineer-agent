/* markdown.js — a tiny, safe Markdown renderer for AI replies.
   All text is HTML-escaped first, so model output can never inject HTML or scripts. */
(() => {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  }

  window.App = window.App || {};
  window.App.markdown = function (src) {
    const blocks = [];
    // Fenced code blocks first (kept verbatim)
    let text = esc(String(src)).replace(/```[\w-]*\n?([\s\S]*?)```/g, (_, code) => {
      blocks.push(`<pre><code>${code.replace(/\n$/, "")}</code></pre>`);
      return `\u0000${blocks.length - 1}\u0000`;
    });

    const out = [];
    let list = null; // "ul" | "ol"
    const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

    for (const raw of text.split("\n")) {
      const line = raw.trimEnd();
      let m;
      if (/^\u0000\d+\u0000$/.test(line.trim())) { closeList(); out.push(line.trim()); continue; }
      if ((m = line.match(/^\s*[-*•]\s+(.*)/))) {
        if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
        out.push(`<li>${inline(m[1])}</li>`); continue;
      }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
        if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
        out.push(`<li>${inline(m[1])}</li>`); continue;
      }
      closeList();
      if ((m = line.match(/^#{1,4}\s+(.*)/))) { out.push(`<p class="h">${inline(m[1])}</p>`); continue; }
      if (!line.trim()) { out.push(""); continue; }
      out.push(`<p>${inline(line)}</p>`);
    }
    closeList();
    return out.join("").replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
  };

  // Plain text version (for text-to-speech)
  window.App.plainText = (src) => String(src)
    .replace(/```[\s\S]*?```/g, " code example. ")
    .replace(/[*_`#>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "link");
})();
