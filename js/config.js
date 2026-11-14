/* config.js — site-wide settings for the site OWNER (safe to commit: no secrets here).
 *
 * backendUrl: the address of your deployed Cloudflare Worker (see worker/).
 *   When set, visitors can use the AI WITHOUT their own key — the worker adds
 *   your secret key on the server. Leave "" to require each visitor's own key.
 *   Example: "https://ai-guide-reader.your-name.workers.dev"
 */
window.APP_CONFIG = {
  siteName: "AI/GUIDE",
  backendUrl: "",
  defaultProvider: "gemini",
  googleClientId: "", // optional: your Google OAuth Client ID so visitors don't have to paste one

  // The course: every lesson page the agent can search. Add new pages here.
  lessons: [
    { file: "index.html", title: "What is an AI engineer?" },
    { file: "prompting.html", title: "Prompt & context engineering" },
    { file: "rag.html", title: "RAG: answering from your data" },
    { file: "agents.html", title: "Tools & agents" },
  ],
};
