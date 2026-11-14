/* workspace.js — article sections, study plan, quiz score and notes */
(() => {
  const App = window.App;
  const { $, store } = App;

  document.addEventListener("DOMContentLoaded", () => {
    // Split the article into sections at each <h2 id="..."> (the agent's mini knowledge base)
    const sections = [];
    let cur = null;
    for (const el of $("article").children) {
      if (el.tagName === "H2" && el.id) {
        cur = { id: el.id, title: el.textContent.trim(), els: [el] };
        sections.push(cur);
      } else if (cur) {
        cur.els.push(el);
      }
    }
    App.SECTIONS = sections.map((s) => ({ ...s, text: s.els.slice(1).map((e) => e.innerText).join("\n").trim() }));

    App.flashSection = (id) => {
      const sec = App.SECTIONS.find((s) => s.id === id);
      if (!sec) return false;
      sec.els[0].scrollIntoView({ behavior: "smooth", block: "start" });
      sec.els.forEach((e) => e.classList.add("flash"));
      setTimeout(() => sec.els.forEach((e) => e.classList.remove("flash")), 2500);
      return true;
    };

    // Workspace state, persisted in localStorage
    const ws = App.ws = {
      plan: store.getJSON("agent_plan", null),
      quiz: store.getJSON("agent_quiz", { right: 0, total: 0 }),
      notes: store.getJSON("agent_notes", []),
    };

    App.saveWorkspace = () => {
      ws.plan ? store.setJSON("agent_plan", ws.plan) : store.del("agent_plan");
      store.setJSON("agent_quiz", ws.quiz);
      store.setJSON("agent_notes", ws.notes);
    };

    App.renderWorkspace = () => {
      $("planBlock").hidden = !ws.plan;
      if (ws.plan) {
        $("planTitle").textContent = ws.plan.title;
        const box = $("planWeeks");
        box.innerHTML = "";
        let done = 0, all = 0;
        ws.plan.weeks.forEach((w, wi) => {
          const div = document.createElement("div");
          div.className = "week";
          const head = document.createElement("b");
          head.textContent = `Week ${w.week}: ${w.focus}`;
          div.appendChild(head);
          w.tasks.forEach((t, ti) => {
            all++; if (t.done) done++;
            const label = document.createElement("label");
            if (t.done) label.className = "done";
            const cb = document.createElement("input");
            cb.type = "checkbox"; cb.checked = t.done;
            cb.onchange = () => { ws.plan.weeks[wi].tasks[ti].done = cb.checked; App.saveWorkspace(); App.renderWorkspace(); };
            const span = document.createElement("span");
            span.textContent = t.text;
            label.append(cb, span);
            div.appendChild(label);
          });
          box.appendChild(div);
        });
        $("planBar").style.width = all ? (100 * done / all) + "%" : "0";
      }

      $("quizBlock").hidden = ws.quiz.total === 0;
      $("quizRight").textContent = ws.quiz.right;
      $("quizTotal").textContent = ws.quiz.total;

      $("notesBlock").hidden = ws.notes.length === 0;
      const list = $("notesList");
      list.innerHTML = "";
      ws.notes.forEach((n, i) => {
        const item = document.createElement("div");
        item.className = "note-item";
        const b = document.createElement("b"); b.textContent = n.title;
        const body = document.createElement("span"); body.textContent = n.text;
        const del = document.createElement("button"); del.textContent = "×"; del.title = "Delete note";
        del.onclick = () => { ws.notes.splice(i, 1); App.saveWorkspace(); App.renderWorkspace(); };
        item.append(b, body, del);
        list.appendChild(item);
      });

      $("workspace").hidden = $("planBlock").hidden && $("quizBlock").hidden && $("notesBlock").hidden;
    };

    document.querySelectorAll("[data-clear]").forEach((btn) => {
      btn.onclick = () => {
        const what = btn.dataset.clear;
        if (what === "plan") ws.plan = null;
        if (what === "quiz") ws.quiz = { right: 0, total: 0 };
        if (what === "notes") ws.notes = [];
        App.saveWorkspace(); App.renderWorkspace();
      };
    });

    App.renderWorkspace();
  });
})();
