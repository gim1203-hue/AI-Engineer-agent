/* config.js — site-wide settings for the site OWNER (safe to commit: no secrets here).
 *
 * backendUrl: the address of your deployed Cloudflare Worker (see worker/).
 *   When set, visitors can use the AI WITHOUT their own key — the worker adds
 *   your secret key on the server. Leave "" to require each visitor's own key.
 *   Example: "https://ai-guide-reader.your-name.workers.dev"
 */
window.APP_CONFIG = {
  siteName: "AI/GUIDE",
  backendUrl: "https://ai-guide-reader.khantech.workers.dev",
  defaultProvider: "gemini",
  googleClientId: "", // optional: your Google OAuth Client ID so visitors don't have to paste one

  /* Shared Gemini key so visitors can use the agent without their own key.
   * ⚠ This key is PUBLIC: anyone can read it in this file. Protect it in Google Cloud Console →
   * APIs & Services → Credentials → this key:
   *   • Application restrictions → Websites → https://gim1203-hue.github.io/*
   *   • API restrictions → Generative Language API only
   * Create it at https://aistudio.google.com/apikey. If the agent says "API key not valid",
   * the key was deleted, mistyped or is the wrong kind of credential: make a new one there.
   * Never enable billing on this key's project. Visitors who add their own key in Settings use theirs instead. */
  publicGeminiKey: "",
  publicGeminiModel: "gemini-flash-lite-latest", // Flash-Lite has the highest free limits

  // The course: every lesson page the agent can search. Add new pages here.
  lessons: [
    { file: "index.html", title: "What is an AI engineer?" },
    { file: "prompting.html", title: "Prompt & context engineering" },
    { file: "rag.html", title: "RAG: answering from your data" },
    { file: "agents.html", title: "Tools & agents" },
  ],
};
