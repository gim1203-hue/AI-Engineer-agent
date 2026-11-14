# Project write-up (for your portfolio, CV or LinkedIn)

Copy and adapt this text. Replace the bracketed parts.

---

## AI/GUIDE: an AI agent for learning AI engineering

**Live demo:** https://[your-username].github.io/[repo-name]/  ·  **Code:** https://github.com/[your-username]/[repo-name]

### One-liner
A four-lesson AI engineering course with a built-in AI agent. The agent searches the course and the web, reads webpages, Gmail and Google Calendar, drafts emails, events and social posts, and quizzes the learner. It's a static site with no framework.

### What I built
- An **agent loop** that works with two model providers (Google Gemini and Anthropic Claude) through one adapter interface, with tool calling, step limits and history rollback on errors.
- **13 tools**: course search (mini RAG), web search with sources, a webpage reader, Gmail search, read and drafts, Calendar read and add, study plans, quizzes, notes, and a social Content Studio.
- **OAuth 2.0 in the browser** with Google Identity Services, using minimal scopes. Gmail can be read and drafted but never sent.
- **Human-in-the-loop safety**: drafts, calendar events and Bluesky posts only happen on a user click. External content is labelled untrusted to resist prompt injection.
- **A serverless backend** on a Cloudflare Worker that hides API keys, proxies model calls, and reads webpages with SSRF protection.
- A safe Markdown renderer, voice input and output (Web Speech API), and a responsive dark UI.

### Tech
HTML, CSS and vanilla JavaScript · Gemini API · Claude API · Google OAuth, Gmail and Calendar APIs · Bluesky AT Protocol · Cloudflare Workers · GitHub Pages

### What I learned
- How tool calling and agent loops work under the hood, and how the providers' message formats differ.
- Why browser security (CORS, origin isolation) shapes what a web app can do, and how a small backend solves it.
- How to design agent permissions: read-only by default, with a click for anything that has effects.

### Next steps
Embeddings-based RAG, an eval suite for the agent's answers, and TikTok and Instagram posting through official APIs.

---

## Making a demo GIF (5 minutes)
1. Open the site and press **Win + Shift + R** (Windows Snipping Tool screen recording), or use the free tool ScreenToGif.
2. Record yourself asking: *"Search the web for AI engineer salaries, make me a 4-week plan and write a LinkedIn post about it."*
3. Save it as `docs/demo.gif` and add `![Demo](docs/demo.gif)` near the top of the README.

## Screenshots to take
- The chat with 🔧 tool steps and source links
- The workspace with a study plan and quiz score
- An email or calendar draft card
- The settings dialog (with your keys hidden)
