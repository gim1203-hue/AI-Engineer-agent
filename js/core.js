/* core.js — shared helpers, provider config, AI endpoints and the settings dialog */
window.App = window.App || {};

(() => {
  const App = window.App;
  const C = window.APP_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  App.$ = $;

  App.store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
    getJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
    setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const store = App.store;

  App.PROVIDERS = {
    gemini: {
      label: "Google AI Studio API key",
      placeholder: "AIza...",
      help: 'Free: get a key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (no card needed).',
      models: [
        ["gemini-flash-latest", "Gemini Flash (latest, free tier)"],
        ["gemini-flash-lite-latest", "Gemini Flash-Lite (faster, higher free limits)"],
      ],
    },
    claude: {
      label: "Anthropic API key",
      placeholder: "sk-ant-...",
      help: 'Needs paid credits: get a key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a>.',
      models: [
        ["claude-sonnet-5-5", "Claude Sonnet 5.5 (balanced)"],
        ["claude-haiku-5-5", "Claude Haiku 5.5 (fast, cheap)"],
        ["claude-opus-5-5", "Claude Opus 5.5 (most capable)"],
      ],
    },
  };

  App.DEFAULT_READER = "https://r.jina.ai/{url}";
  const trimSlash = (s) => (s || "").trim().replace(/\/+$/, "");

  App.cfg = {
    provider: () => {
      const p = store.get("ai_provider") || C.defaultProvider;
      return App.PROVIDERS[p] ? p : "gemini";
    },
    // The visitor's own key (from Settings)
    userKey: (p = App.cfg.provider()) => store.get(p + "_key") || "",
    // The key actually used: the visitor's own, else the site's shared Gemini key
    key: (p = App.cfg.provider()) => App.cfg.userKey(p) || (p === "gemini" ? C.publicGeminiKey || "" : ""),
    // True when Gemini runs on the site owner's quota: the shared key, or the backend worker
    usingSharedKey: (p = App.cfg.provider()) => p === "gemini" && !App.cfg.userKey(p) && !!(C.publicGeminiKey || App.cfg.backend()),
    model: (p = App.cfg.provider()) => store.get(p + "_model")
      || (App.cfg.usingSharedKey(p) && C.publicGeminiModel) || App.PROVIDERS[p].models[0][0],
    backend: () => trimSlash(store.get("backend_url") || C.backendUrl),
    reader: () => store.get("reader_url") || (App.cfg.backend() ? App.cfg.backend() + "/read?url={url_encoded}" : App.DEFAULT_READER),
    googleClientId: () => store.get("google_client_id") || C.googleClientId || "",
    bskyHandle: () => store.get("bsky_handle") || "",
    bskyPassword: () => store.get("bsky_password") || "",
    // The AI works if the visitor has a key OR the site has a backend
    hasAI: (p = App.cfg.provider()) => !!(App.cfg.key(p) || App.cfg.backend()),
  };

  // ---------- AI endpoints: direct with the visitor's key, or through the backend ----------
  App.ai = {
    geminiUrl(path) {
      const useBackend = !App.cfg.key("gemini") && App.cfg.backend();
      return (useBackend ? App.cfg.backend() + "/gemini" : "https://generativelanguage.googleapis.com") + path;
    },
    geminiHeaders() {
      const h = { "content-type": "application/json" };
      if (App.cfg.key("gemini")) h["x-goog-api-key"] = App.cfg.key("gemini");
      return h;
    },
    claudeUrl() {
      const useBackend = !App.cfg.key("claude") && App.cfg.backend();
      return (useBackend ? App.cfg.backend() + "/claude" : "https://api.anthropic.com") + "/v1/messages";
    },
    claudeHeaders() {
      const h = { "content-type": "application/json", "anthropic-version": "2023-06-01" };
      if (App.cfg.key("claude")) {
        h["x-api-key"] = App.cfg.key("claude");
        h["anthropic-dangerous-direct-browser-access"] = "true";
      }
      return h;
    },
  };

  App.refreshStatus = () => {
    const hasAI = App.cfg.hasAI();
    const google = !!App.google?.isConnected();
    $("statusDot")?.classList.toggle("off", !hasAI);
    $("chipAI")?.classList.toggle("on", hasAI);
    $("chipGoogle")?.classList.toggle("on", google);
    $("chipBsky")?.classList.toggle("on", !!(App.cfg.bskyHandle() && App.cfg.bskyPassword()));
    const gs = $("googleState");
    if (gs) gs.textContent = google ? "connected" : "not connected";
  };

  App.errorFrom = async (res) => {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      const e = (Array.isArray(j) ? j[0] : j).error;
      msg = (typeof e === "string" ? e : e?.message) || j.message || msg;
    } catch {}
    return new Error(msg);
  };

  // ---------- Settings dialog ----------
  document.addEventListener("DOMContentLoaded", () => {
    const dlg = $("settings"), providerSelect = $("providerSelect"), keyInput = $("keyInput"), modelSelect = $("modelSelect");

    function fillProviderFields(p) {
      const c = App.PROVIDERS[p];
      const shared = App.cfg.backend() || (p === "gemini" && C.publicGeminiKey);
      $("keyLabel").textContent = c.label + (shared ? " (optional)" : "");
      keyInput.placeholder = shared ? "Leave empty to use this site's shared key" : c.placeholder;
      $("providerHelp").innerHTML = c.help;
      modelSelect.innerHTML = "";
      for (const [value, text] of c.models) modelSelect.add(new Option(text, value));
      keyInput.value = App.cfg.userKey(p);
      modelSelect.value = App.cfg.model(p);
    }
    providerSelect.onchange = () => fillProviderFields(providerSelect.value);

    App.openSettings = () => {
      providerSelect.value = App.cfg.provider();
      fillProviderFields(providerSelect.value);
      $("backendNote").hidden = !(App.cfg.backend() || C.publicGeminiKey);
      $("backendUrl").value = store.get("backend_url") || "";
      $("backendUrl").placeholder = C.backendUrl || "https://ai-guide-reader.you.workers.dev";
      $("readerUrl").value = store.get("reader_url") || "";
      $("googleClientId").value = store.get("google_client_id") || "";
      $("googleClientId").placeholder = C.googleClientId || "1234-abc.apps.googleusercontent.com";
      $("bskyHandle").value = App.cfg.bskyHandle();
      $("bskyPassword").value = App.cfg.bskyPassword();
      App.refreshStatus();
      dlg.showModal();
    };

    const setOrDel = (k, v) => (v ? store.set(k, v) : store.del(k));
    function saveFields() {
      const p = providerSelect.value;
      setOrDel(p + "_key", keyInput.value.trim());
      store.set(p + "_model", modelSelect.value);
      if (p !== App.cfg.provider()) App.onProviderChange?.();
      store.set("ai_provider", p);
      setOrDel("backend_url", trimSlash($("backendUrl").value));
      setOrDel("reader_url", $("readerUrl").value.trim());
      setOrDel("google_client_id", $("googleClientId").value.trim());
      const handle = $("bskyHandle").value.trim().replace(/^@/, "");
      if (handle !== App.cfg.bskyHandle()) App.bsky?.reset();
      setOrDel("bsky_handle", handle);
      setOrDel("bsky_password", $("bskyPassword").value.trim());
    }

    $("openSettings").onclick = App.openSettings;
    $("cancelSettings").onclick = () => dlg.close();
    $("saveSettings").onclick = () => { saveFields(); App.refreshStatus(); dlg.close(); };
    $("forgetAll").onclick = () => {
      if (!confirm("Remove all keys, passwords and settings from this browser? (Your plan, notes and quiz score are kept.)")) return;
      ["gemini_key", "claude_key", "gemini_model", "claude_model", "ai_provider", "backend_url", "reader_url",
        "google_client_id", "bsky_handle", "bsky_password"].forEach(store.del);
      App.google?.disconnect();
      App.bsky?.reset();
      App.openSettings();
    };
    $("googleConnect").onclick = async () => {
      saveFields();
      try { await App.google.connect(); } catch (e) { alert("Google: " + e.message); }
      App.refreshStatus();
    };
    $("googleDisconnect").onclick = () => { App.google.disconnect(); App.refreshStatus(); };

    App.refreshStatus();
  });
})();
