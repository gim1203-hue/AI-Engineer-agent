/* tools.js — every tool the agent can call.
   To add a tool: add an entry with a description, JSON-schema parameters and a run() function.
   Both AI providers pick it up automatically. */
(() => {
  const App = window.App;

  const PLATFORM_LIMITS = { tiktok: 4000, instagram: 2200, x: 280, bluesky: 300, linkedin: 3000, facebook: 63206, youtube: 5000, threads: 500 };
  App.PLATFORM_LIMITS = PLATFORM_LIMITS;

  App.TOOLS = {
    // ----- Course knowledge -----
    search_course: {
      description: "Search all lessons of this course (current page first) and return the most relevant sections. Use before answering questions about AI engineering topics covered by the course.",
      parameters: { type: "object", properties: { query: { type: "string", description: "Keywords, e.g. 'RAG chunking'" } }, required: ["query"] },
      async run({ query = "" }) {
        const words = String(query).toLowerCase().split(/\W+/).filter((w) => w.length > 2);
        const all = await App.courseSections();
        const hits = all.map((s) => {
          const hay = (s.title + " " + s.text).toLowerCase();
          let score = 0;
          for (const w of words) { score += hay.split(w).length - 1; if (s.title.toLowerCase().includes(w)) score += 3; }
          if (s.current) score *= 1.2;
          return { s, score };
        }).sort((a, b) => b.score - a.score).filter((x) => x.score > 0).slice(0, 3);
        if (!hits.length) return { results: [], lessons: window.APP_CONFIG.lessons };
        return { results: hits.map(({ s }) => ({ page: s.page, lesson: s.lesson, section_id: s.id, title: s.title, on_current_page: s.current, text: s.text.slice(0, 1500) })) };
      },
    },

    show_section: {
      description: "Show the user a section. If it's on the current page, scroll to it and highlight it; otherwise show a link to open that lesson.",
      parameters: {
        type: "object",
        properties: { page: { type: "string", description: "Lesson file, e.g. 'rag.html'" }, section_id: { type: "string" } },
        required: ["page", "section_id"],
      },
      run({ page, section_id }) {
        const here = location.pathname.split("/").pop() || "index.html";
        const lesson = window.APP_CONFIG.lessons.find((l) => l.file === page);
        if (!lesson) return { ok: false, error: "Unknown page", lessons: window.APP_CONFIG.lessons.map((l) => l.file) };
        if (page === here) {
          return App.flashSection(section_id) ? { ok: true, shown: section_id }
            : { ok: false, error: "Unknown section", valid_ids: App.SECTIONS.map((s) => s.id) };
        }
        App.ui.renderLink(`Open lesson: ${lesson.title}`, `${page}#${encodeURIComponent(section_id)}`);
        return { ok: true, status: "Link shown to the user (opening it leaves this page)." };
      },
    },

    // ----- Internet -----
    web_search: {
      description: "Search the internet for current information (news, jobs, salaries, docs, anything). Returns a summary and source links.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      async run({ query }) {
        const r = await App.webSearch(String(query));
        if (r.sources.length) App.ui.addSources(r.sources);
        return r;
      },
    },

    read_webpage: {
      description: "Fetch a public webpage by URL and return its text. Cannot log in to sites.",
      parameters: { type: "object", properties: { url: { type: "string", description: "Full http(s) URL" } }, required: ["url"] },
      run({ url }) { return App.readWebpage(String(url)); },
    },

    // ----- Gmail -----
    gmail_search: {
      description: "Search the user's Gmail using Gmail search syntax, e.g. 'is:unread', 'from:boss@x.com', 'subject:invoice newer_than:7d'.",
      parameters: { type: "object", properties: { query: { type: "string" }, max_results: { type: "integer", description: "1-15, default 5" } }, required: ["query"] },
      run({ query, max_results }) { return App.google.searchMail(String(query), max_results); },
    },

    gmail_read: {
      description: "Read the full text of one email by its id (from gmail_search).",
      parameters: { type: "object", properties: { message_id: { type: "string" } }, required: ["message_id"] },
      run({ message_id }) { return App.google.readMail(String(message_id)); },
    },

    draft_email: {
      description: "Show an email draft card. The user can edit it and click 'Save to Gmail Drafts'. Nothing is ever sent; the user sends it from Gmail. Use reply_to_message_id when replying to an email from gmail_search.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address(es)" },
          subject: { type: "string" },
          body: { type: "string" },
          reply_to_message_id: { type: "string", description: "Optional: Gmail message id being replied to" },
        },
        required: ["to", "subject", "body"],
      },
      run(a) {
        App.ui.renderEmailDraft({ to: String(a.to || ""), subject: String(a.subject || ""), body: String(a.body || ""), replyToId: a.reply_to_message_id ? String(a.reply_to_message_id) : "" });
        return { ok: true, status: "Draft card shown. The user decides whether to save it. Nothing was sent." };
      },
    },

    // ----- Calendar -----
    calendar_list_events: {
      description: "List upcoming events from the user's Google Calendar.",
      parameters: {
        type: "object",
        properties: { days_ahead: { type: "integer", description: "1-60, default 7" }, query: { type: "string", description: "Optional text filter" } },
      },
      run({ days_ahead, query }) { return App.google.listEvents(days_ahead, query || ""); },
    },

    propose_calendar_event: {
      description: "Show an event card the user can confirm with 'Add to Google Calendar'. Nothing is added until they click. Use the user's local time, ISO 8601 without timezone offset, e.g. 2026-11-20T15:00:00.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          start: { type: "string", description: "Local start, e.g. 2026-11-20T15:00:00 (or 2026-11-20 for all-day)" },
          end: { type: "string", description: "Local end, e.g. 2026-11-20T16:00:00" },
          all_day: { type: "boolean" },
          location: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "start", "end"],
      },
      run(a) {
        if (isNaN(new Date(a.start)) || isNaN(new Date(a.end))) return { ok: false, error: "start/end must be valid ISO dates" };
        App.ui.renderEventCard({ title: String(a.title), start: String(a.start), end: String(a.end), allDay: !!a.all_day, location: a.location ? String(a.location) : "", description: a.description ? String(a.description) : "" });
        return { ok: true, status: "Event card shown. Not added until the user clicks." };
      },
    },

    // ----- Learning -----
    create_study_plan: {
      description: "Create (or replace) a week-by-week study plan with checkable tasks in the user's workspace.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: { week: { type: "integer" }, focus: { type: "string" }, tasks: { type: "array", items: { type: "string" }, description: "2-5 concrete tasks" } },
              required: ["week", "focus", "tasks"],
            },
          },
        },
        required: ["title", "weeks"],
      },
      run({ title = "Study plan", weeks = [] }) {
        if (!Array.isArray(weeks) || !weeks.length) return { ok: false, error: "weeks must be a non-empty array" };
        App.ws.plan = {
          title: String(title),
          weeks: weeks.map((w, i) => ({ week: w.week ?? i + 1, focus: String(w.focus ?? ""), tasks: (w.tasks || []).map((t) => ({ text: String(t), done: false })) })),
        };
        App.saveWorkspace(); App.renderWorkspace();
        App.$("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
        return { ok: true, weeks: App.ws.plan.weeks.length };
      },
    },

    ask_quiz_question: {
      description: "Show ONE multiple-choice question as clickable buttons. Then end your turn without revealing the answer; the user's choice arrives as their next message.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, description: "2 to 4 options" },
          correct_index: { type: "integer", description: "0-based index of the correct option" },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correct_index", "explanation"],
      },
      run(a) {
        const opts = Array.isArray(a.options) ? a.options.map(String).slice(0, 4) : [];
        const ci = Number(a.correct_index);
        if (opts.length < 2 || !(ci >= 0 && ci < opts.length)) return { ok: false, error: "Need 2-4 options and a valid correct_index" };
        App.ui.renderQuiz(String(a.question), opts, ci, String(a.explanation || ""));
        return { ok: true, status: "Question shown. End your turn now and do NOT reveal the answer." };
      },
    },

    save_note: {
      description: "Save a short note to the user's notes panel.",
      parameters: { type: "object", properties: { title: { type: "string" }, text: { type: "string" } }, required: ["title", "text"] },
      run({ title = "Note", text = "" }) {
        App.ws.notes.push({ title: String(title), text: String(text) });
        App.saveWorkspace(); App.renderWorkspace();
        return { ok: true, total_notes: App.ws.notes.length };
      },
    },

    // ----- Content Studio -----
    create_post_draft: {
      description: "Show a social media post draft card the user can edit, copy or download. For Bluesky the card has a 'Post' button the USER must click; you can never post yourself. Respect the platform's length limit.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: Object.keys(PLATFORM_LIMITS) },
          text: { type: "string", description: "The post/caption text, including hashtags at the end" },
          script: { type: "string", description: "Optional: video script / shot list for TikTok, Reels or YouTube" },
          image_idea: { type: "string", description: "Optional: description of an image or thumbnail to make" },
        },
        required: ["platform", "text"],
      },
      run(a) {
        const platform = PLATFORM_LIMITS[a.platform] ? a.platform : "x";
        App.ui.renderDraft({ platform, text: String(a.text || ""), script: a.script ? String(a.script) : "", imageIdea: a.image_idea ? String(a.image_idea) : "" });
        return { ok: true, status: "Draft shown to the user. They decide whether to copy or post it. Do not claim it was posted." };
      },
    },
  };
})();
