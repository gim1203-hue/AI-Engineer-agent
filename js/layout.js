/* layout.js — builds the shared header, workspace, chat panel, footer and settings
   on every page, so lesson pages only need their <article>. */
(() => {
  const C = window.APP_CONFIG;
  const here = location.pathname.split("/").pop() || "index.html";

  const nav = C.lessons.map((l) =>
    `<a href="${l.file}"${l.file === here ? ' class="active" aria-current="page"' : ""}>${l.title}</a>`).join("");

  document.body.insertAdjacentHTML("afterbegin", `
<header class="top">
  <div class="wrap">
    <a class="logo" href="index.html">AI<span>/</span>GUIDE</a>
    <div class="conn">
      <span class="chip" id="chipAI">AI</span>
      <span class="chip" id="chipGoogle">Google</span>
      <span class="chip" id="chipBsky">Bluesky</span>
      <button class="btn" id="openSettings">⚙ Settings</button>
    </div>
  </div>
  <nav class="lessons wrap" aria-label="Lessons">${nav}</nav>
</header>`);

  // Workspace goes after the table of contents (or the tags) of the article
  const article = document.getElementById("article");
  const anchor = article.querySelector(".toc") || article.querySelector(".tags");
  anchor.insertAdjacentHTML("afterend", `
<section class="workspace" id="workspace" hidden>
  <div class="ws-head">
    <div class="label" style="color:var(--accent)">Your workspace</div>
    <span class="label">built by the agent</span>
  </div>
  <div class="ws-block" id="planBlock" hidden>
    <div class="ws-title"><span id="planTitle">Study plan</span><button class="btn small" data-clear="plan">Remove</button></div>
    <div class="progress"><div id="planBar"></div></div>
    <div id="planWeeks"></div>
  </div>
  <div class="ws-block" id="quizBlock" hidden>
    <div class="ws-title"><span>Quiz score</span><button class="btn small" data-clear="quiz">Reset</button></div>
    <div class="score"><strong id="quizRight">0</strong> / <span id="quizTotal">0</span> correct</div>
  </div>
  <div class="ws-block" id="notesBlock" hidden>
    <div class="ws-title"><span>Notes</span><button class="btn small" data-clear="notes">Clear all</button></div>
    <div class="notes-list" id="notesList"></div>
  </div>
</section>`);

  document.querySelector("main.layout").insertAdjacentHTML("beforeend", `
<aside class="chat" aria-label="AI agent">
  <div class="chat-head">
    <div class="title"><span class="dot off" id="statusDot"></span>AI agent</div>
    <div class="head-btns">
      <button class="btn small" id="voiceOut" title="Read replies aloud">🔈 Voice off</button>
      <button class="btn small" id="clearChat" title="Clear conversation">Clear</button>
    </div>
  </div>
  <div class="msgs" id="msgs">
    <div class="msg ai"><span class="who">AI AGENT</span>Hi! I'm an agent. I can search this course and the web, read webpages, read your Gmail and calendar, draft emails and events, build study plans, quiz you, take notes and draft social posts. Try one:</div>
  </div>
  <div class="suggest" id="suggest">
    <button>Search the web for the latest AI engineer job trends</button>
    <button>Make me a 4-week study plan to become an AI engineer</button>
    <button>What's on my calendar this week?</button>
    <button>Summarise my 5 most recent unread emails</button>
    <button>Write a TikTok script about what an AI engineer does</button>
    <button>Quiz me on this lesson</button>
  </div>
  <form class="ask" id="askForm">
    <button class="mic" id="micBtn" type="button" title="Speak your message" hidden>🎤</button>
    <textarea id="input" rows="1" placeholder="Ask or give the agent a task…"></textarea>
    <button class="btn primary" id="sendBtn" type="submit">Send</button>
  </form>
</aside>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer>
  <div class="wrap">
    <span>${C.siteName} Agent · keys stay in your browser</span>
    <span><a href="https://github.com/" id="repoLink" target="_blank" rel="noopener">Source</a> · <a href="PRIVACY.md">Privacy</a> · <a href="LICENSE">License</a></span>
  </div>
</footer>

<dialog id="settings">
  <div class="label" style="color:var(--accent)">Settings</div>
  <p>Everything here is saved only in this browser (localStorage) and sent only to the service it belongs to.</p>

  <fieldset>
    <legend>AI model</legend>
    <p id="backendNote" hidden>✓ This site has a shared AI backend, so you don't need a key. Add your own to use your own quota.</p>
    <label for="providerSelect">Provider</label>
    <select id="providerSelect">
      <option value="gemini">Google Gemini (free tier)</option>
      <option value="claude">Anthropic Claude (paid credits)</option>
    </select>
    <p id="providerHelp"></p>
    <label for="keyInput" id="keyLabel">API key</label>
    <input id="keyInput" type="password" autocomplete="off">
    <label for="modelSelect">Model</label>
    <select id="modelSelect"></select>
  </fieldset>

  <fieldset>
    <legend>Backend (optional)</legend>
    <label for="backendUrl">Your worker URL</label>
    <input id="backendUrl" type="text" placeholder="https://ai-guide-reader.you.workers.dev">
    <p>If you deployed the included Cloudflare Worker with your key as a secret, put its URL here. The AI and webpage reading then go through it, so no key is needed in the browser.</p>
  </fieldset>

  <fieldset>
    <legend>Reading webpages</legend>
    <label for="readerUrl">Reader URL</label>
    <input id="readerUrl" type="text" placeholder="https://r.jina.ai/{url}">
    <p>Browsers can't fetch other websites directly, so pages go through a reader. Default: Jina Reader (free). If a backend URL is set, your worker is used instead.</p>
  </fieldset>

  <fieldset>
    <legend>Google (Gmail + Calendar)</legend>
    <label for="googleClientId">Google OAuth Client ID</label>
    <input id="googleClientId" type="text" placeholder="1234-abc.apps.googleusercontent.com">
    <p>See README → "Connect Google". Works on http://localhost / 127.0.0.1 or your GitHub Pages URL, not when opening the file directly. Access: read Gmail, create Gmail drafts (never send), read and add calendar events.</p>
    <div class="inline">
      <button class="btn" id="googleConnect" type="button">Connect Google</button>
      <button class="btn" id="googleDisconnect" type="button">Disconnect</button>
      <span class="chip" id="googleState">not connected</span>
    </div>
  </fieldset>

  <fieldset>
    <legend>Bluesky posting</legend>
    <label for="bskyHandle">Handle</label>
    <input id="bskyHandle" type="text" placeholder="you.bsky.social" autocomplete="off">
    <label for="bskyPassword">App password</label>
    <input id="bskyPassword" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" autocomplete="off">
    <p>Bluesky → Settings → Privacy and security → App passwords. Never use your main password. Posting always needs your click.</p>
  </fieldset>

  <div class="row">
    <button class="btn" id="forgetAll" type="button">Forget everything</button>
    <button class="btn" id="cancelSettings" type="button">Cancel</button>
    <button class="btn primary" id="saveSettings" type="button">Save</button>
  </div>
</dialog>`);
})();
