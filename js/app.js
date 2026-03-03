// ===========================
// AMSTIG - Main App
// ===========================

(function() {
  'use strict';

  // ===========================
  // STATE
  // ===========================
  const state = {
    currentTopicId: null,
    currentSubtopicId: null,
    sidebarOpen: false,
    theme: localStorage.getItem('amstig-theme') || 'light',
    executingCode: false,
    originalCode: '',
  };

  // ===========================
  // DOM REFS
  // ===========================
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ===========================
  // ROUTER
  // ===========================
  function parseHash() {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/').filter(Boolean);
    return { page: parts[0] || 'home', topicId: parts[1], subtopicId: parts[2] };
  }

  function navigate(page, topicId, subtopicId) {
    if (page === 'home') {
      window.location.hash = '#home';
    } else if (page === 'topic' && topicId && subtopicId) {
      window.location.hash = `#topic/${topicId}/${subtopicId}`;
    }
  }

  async function handleRoute() {
    const { page, topicId, subtopicId } = parseHash();
    if (page === 'topic' && topicId && subtopicId) {
      state.currentTopicId = topicId;
      state.currentSubtopicId = subtopicId;
      renderLesson(topicId, subtopicId);
    } else {
      state.currentTopicId = null;
      state.currentSubtopicId = null;
      renderHome();
    }
    updateSidebarActive();
    closeSidebar();
  }

  // ===========================
  // THEME
  // ===========================
  let visit = 0;
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('amstig-theme', theme);
    if(visit > 0){
      window.location.reload();
    }
    visit += 1;

  }

  function toggleTheme() {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  // ===========================
  // SIDEBAR
  // ===========================
  function openSidebar() {
    state.sidebarOpen = true;
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
  }

  function closeSidebar() {
    state.sidebarOpen = false;
    const sidebar = $('sidebar');
    const overlay = $('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }

  function toggleSidebar() {
    state.sidebarOpen ? closeSidebar() : openSidebar();
  }

  function updateSidebarActive() {
    $$('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      const active = href === `#topic/${state.currentTopicId}/${state.currentSubtopicId}`;
      link.classList.toggle('active', active);
    });

    $$('.sidebar-topic-header').forEach(btn => {
      const topicId = btn.dataset.topic;
      const active = topicId === state.currentTopicId;
      btn.classList.toggle('active', active);
    });
  }

  function buildSidebar() {
    const nav = $('sidebar-nav');
    if (!nav) return;

    nav.innerHTML = '';

    TOPICS.forEach(topic => {
      const section = document.createElement('div');
      section.className = 'sidebar-section';

      const header = document.createElement('button');
      header.className = 'sidebar-topic-header';
      header.dataset.topic = topic.id;
      header.innerHTML = `
        <span class="topic-emoji">${topic.icon}</span>
        <span>${topic.title}</span>
        <span class="chevron">▶</span>
      `;

      const subtopicsDiv = document.createElement('div');
      subtopicsDiv.className = 'sidebar-subtopics';
      subtopicsDiv.dataset.topicSubtopics = topic.id;

      topic.subtopics.forEach(sub => {
        const link = document.createElement('a');
        link.className = 'sidebar-link';
        link.href = `#topic/${topic.id}/${sub.id}`;
        link.textContent = sub.title;
        subtopicsDiv.appendChild(link);
      });

      header.addEventListener('click', () => {
        const isExpanded = subtopicsDiv.classList.contains('expanded');
        header.classList.toggle('expanded', !isExpanded);
        subtopicsDiv.classList.toggle('expanded', !isExpanded);
      });

      section.appendChild(header);
      section.appendChild(subtopicsDiv);
      nav.appendChild(section);
    });

    // Auto-expand current topic
    expandCurrentTopic();
  }

  function expandCurrentTopic() {
    const topicId = state.currentTopicId || TOPICS[0]?.id;
    if (!topicId) return;

    const header = document.querySelector(`.sidebar-topic-header[data-topic="${topicId}"]`);
    const subtopics = document.querySelector(`.sidebar-subtopics[data-topic-subtopics="${topicId}"]`);
    if (header) header.classList.add('expanded');
    if (subtopics) subtopics.classList.add('expanded');
  }

  // ===========================
  // MARKDOWN RENDERER
  // ===========================
  /* =========================================================
   AMSTIG — ADVANCED MARKDOWN + CODE ENGINE (v2.5)
   ========================================================= */

/* =========================
   UTIL
   ========================= */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* =========================
   LANGUAGE REGISTRY
   ========================= */
const LanguageRegistry = (() => {
  const map = new Map();
  return {
    register(lang, fn) { map.set(lang, fn); },
    highlight(lang, code) {
      const fn = map.get(lang);
      return fn ? fn(code) : escapeHtml(code);
    }
  };
})();

/* =========================
   EXINIX HIGHLIGHTER
   (Java + JavaScript compatible)
   ========================= */
   LanguageRegistry.register("exinix", raw => {
  let code = escapeHtml(raw);

  const STR = [];
  const CMT = [];

  /* 1️⃣ Extract strings */
  code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, m => {
    const id = STR.length;
    STR.push(m);
    return `@@STR${id}@@`;
  });

  /* 2️⃣ Extract MULTILINE comments */
  code = code.replace(/\/\*[\s\S]*?\*\//g, m => {
    const id = CMT.length;
    CMT.push(m);
    return `@@CMT${id}@@`;
  });

  /* 3️⃣ Extract SINGLE-LINE comments */
  code = code.replace(/\/\/[^\n]*/g, m => {
    const id = CMT.length;
    CMT.push(m);
    return `@@CMT${id}@@`;
  });

  /* 4️⃣ Keywords (Java + JS + Exinix) */
  code = code.replace(
    /\b(class|static|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|import|export|public|private|protected|new|this|super|async|await)\b/g,
    `<span class="tok-keyword">$1</span>`
  );

  /* 5️⃣ Types */
  code = code.replace(
    /\b(int|float|double|bool|boolean|string|str|char|long|short|byte|coll|mem|set|map|list)\b/g,
    `<span class="tok-type">$1</span>`
  );

  /* 6️⃣ Numbers */
  code = code.replace(/\b\d+(\.\d+)?\b/g,
    `<span class="tok-number">$&</span>`);

  /* 7️⃣ Functions */
  code = code.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    `<span class="tok-function">$1</span>(`
  );

  /* 8️⃣ Restore strings */
  STR.forEach((s, i) => {
    code = code.replace(
      `@@STR${i}@@`,
      `<span class="tok-string">${s}</span>`
    );
  });

  /* 9️⃣ Restore comments (same style for both) */
  CMT.forEach((c, i) => {
    code = code.replace(
      `@@CMT${i}@@`,
      `<span class="tok-comment">${c}</span>`
    );
  });

  return code;
});

/* =========================
   JAVASCRIPT HIGHLIGHTER
   ========================= */
LanguageRegistry.register("javascript", code => {
  code = escapeHtml(code);

  code = code.replace(/("(?:[^"\\]|\\.)*")/g,
    `<span class="tok-string">$1</span>`);

  code = code.replace(/\/\/.*/g,
    m => `<span class="tok-comment">${m}</span>`);

  code = code.replace(
    /\b(const|let|var|function|return|if|else|for|while|class|new|this|async|await)\b/g,
    `<span class="tok-keyword">$1</span>`
  );

  code = code.replace(/\b\d+(\.\d+)?\b/g,
    `<span class="tok-number">$&</span>`);

  return code;
});

/* =========================
   MARKDOWN PARSER (AST)
   ========================= */
function parseMarkdown(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      let code = "";
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code += lines[i] + "\n";
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, code });
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      blocks.push({ type: "quote", text: line.slice(1).trim() });
      i++;
      continue;
    }

    // List
    if (/^\s*(-|\d+\.)\s+/.test(line)) {
      const { items, index } = parseList(lines, i);
      blocks.push({ type: "list", items });
      i = index;
      continue;
    }

    // Paragraph
    if (line.trim()) {
      let text = line;
      i++;
      while (i < lines.length && lines[i].trim()) {
        text += " " + lines[i].trim();
        i++;
      }
      blocks.push({ type: "paragraph", text });
      continue;
    }

    i++;
  }

  return blocks;
}

function parseList(lines, start, indent = 0) {
  const items = [];
  let i = start;

  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)(-|\d+\.)\s+(.*)$/);
    if (!m) break;

    const curIndent = m[1].length;
    if (curIndent < indent) break;

    if (curIndent > indent) {
      const nested = parseList(lines, i, curIndent);
      items[items.length - 1].children = nested.items;
      i = nested.index;
      continue;
    }

    items.push({ text: m[3], children: [] });
    i++;
  }

  return { items, index: i };
}

/* =========================
   INLINE RENDER
   ========================= */
function renderInline(text) {
  text = escapeHtml(text);
  text = text.replace(/`([^`]+)`/g, `<code>$1</code>`);
  text = text.replace(/\*\*(.+?)\*\*/g, `<strong>$1</strong>`);
  text = text.replace(/\*(.+?)\*/g, `<em>$1</em>`);
  text = text.replace(/\[(.+?)\]\((.+?)\)/g,
    `<a href="$2" target="_blank">$1</a>`);
  return text;
}

/* =========================
   BLOCK RENDER
   ========================= */
function renderBlock(b) {
  switch (b.type) {
    case "heading":
      return `<h${b.level}>${renderInline(b.text)}</h${b.level}>`;

    case "paragraph":
      return `<p>${renderInline(b.text)}</p>`;

    case "quote":
      return `<blockquote>${renderInline(b.text)}</blockquote>`;

    case "list":
      return renderList(b.items);

    case "code":
      return `
<div class="code-block">
  <div class="code-block-header">
    <span class="code-block-lang">${b.lang}</span>
    <button onclick="copyCodeBlock(this)">Copy</button>
  </div>
  <pre><code class="language-${b.lang}">${LanguageRegistry.highlight(b.lang, b.code.trim())}</code></pre>
</div>`;

    default:
      return "";
  }
}

function renderList(items) {
  return `<ul>` + items.map(it =>
    `<li>${renderInline(it.text)}${
      it.children.length ? renderList(it.children) : ""
    }</li>`
  ).join("") + `</ul>`;
}





//Advance V3 code PARSER

/* =========================================================
   AMSTIG — FULL MARKDOWN ENGINE (LEVEL 3 / GFM STYLE)
   ========================================================= */

/* =========================
   BLOCK PARSER
   ========================= */
function parseMarkdownV3(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    /* -------- CODE BLOCK -------- */
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || "code";
      let code = "";
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code += lines[i] + "\n";
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, code });
      continue;
    }

    /* -------- HR -------- */
    if (/^(\*\*\*|---)$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    /* -------- HEADING (1–6) -------- */
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({
        type: "heading",
        level: h[1].length,
        text: h[2]
      });
      i++;
      continue;
    }

    /* -------- BLOCKQUOTE (NESTED) -------- */
    if (/^>+/.test(line)) {
      let depth = line.match(/^>+/)[0].length;
      let text = line.slice(depth).trim();
      blocks.push({
        type: "quote",
        depth,
        content: text
      });
      i++;
      continue;
    }

    /* -------- TABLE (GFM) -------- */
    /* -------- TABLE (GFM + HEADERLESS) -------- */
if (line.includes("|")) {
  const firstRow = splitTableRow(line);
  const next = lines[i + 1];

  // Case 1: Standard GFM table (has separator)
  if (next && /^[\s\|\-:]+$/.test(next)) {
    const header = firstRow;
    const rows = [];
    i += 2;

    while (i < lines.length && lines[i].includes("|")) {
      rows.push(splitTableRow(lines[i]));
      i++;
    }

    blocks.push({ type: "table", header, rows });
    continue;
  }

  // Case 2: Headerless table
  if (firstRow.length >= 2) {
    const rows = [firstRow];
    i++;

    while (i < lines.length && lines[i].includes("|")) {
      rows.push(splitTableRow(lines[i]));
      i++;
    }

    blocks.push({
      type: "table",
      header: null,
      rows
    });
    continue;
  }
}

    /* -------- LIST -------- */
    if (/^\s*(-|\d+\.|\[.\])/.test(line)) {
      const { list, index } = parseListV3(lines, i);
      blocks.push({ type: "list", list });
      i = index;
      continue;
    }

    /* -------- PARAGRAPH -------- */
    if (line.trim()) {
      let text = line;
      i++;
      while (i < lines.length && lines[i].trim()) {
        text += " " + lines[i].trim();
        i++;
      }
      blocks.push({ type: "paragraph", text });
      continue;
    }

    i++;
  }

  return blocks;
}

/* =========================
   LIST PARSER
   ========================= */
function parseListV3(lines, start, indent = 0) {
  const items = [];
  let i = start;

  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)(-|\d+\.|\[[ x]\])\s+(.*)$/);
    if (!m) break;

    const curIndent = m[1].length;
    if (curIndent < indent) break;

    const checked = m[2].startsWith("[")
      ? m[2].includes("x")
      : null;

    items.push({
      text: m[3],
      checked,
      children: []
    });

    i++;
  }

  return { list: items, index: i };
}

/* =========================
   INLINE RENDERER
   ========================= */
function renderInlineV3(text) {
  text = escapeHtml(text);

  text = text.replace(/!\[(.*?)\]\((.*?)\)/g,
    `<img src="$2" alt="$1">`);

  text = text.replace(/\[(.*?)\]\((.*?)\)/g,
    `<a href="$2" target="_blank">$1</a>`);

  text = text.replace(/`([^`]+)`/g,
    `<code>$1</code>`);

  text = text.replace(/\*\*(.*?)\*\*/g,
    `<strong>$1</strong>`);

  text = text.replace(/\*(.*?)\*/g,
    `<em>$1</em>`);

  text = text.replace(/~~(.*?)~~/g,
    `<del>$1</del>`);

  return text;
}

/* =========================
   BLOCK RENDERER
   ========================= */
function renderMarkdownV3(md) {
  const blocks = parseMarkdownV3(md);

  return blocks.map(b => {
    switch (b.type) {

      case "heading":
        return `<h${b.level}>${renderInlineV3(b.text)}</h${b.level}>`;

      case "paragraph":
        return `<p>${renderInlineV3(b.text)}</p>`;

      case "hr":
        return `<hr>`;

      case "quote":
        return `<blockquote>${renderInlineV3(b.content)}</blockquote>`;

      case "list":
        return renderListV3(b.list);

      case "table":
        return renderTableV3(b);

      case "code":
        return `
<div class="code-block">
  <div class="code-block-header">
    <span class="code-block-lang">${b.lang}</span>
    <button onclick="copyCodeBlock(this)">Copy</button>
  </div>
  <pre><code class="language-${b.lang}">
${LanguageRegistry.highlight(b.lang, b.code.trim())}
</code></pre>
</div>`;

      default:
        return "";
    }
  }).join("");
}

/* =========================
   HELPERS
   ========================= */
function renderListV3(items) {
  return `<ul>` + items.map(it => `
<li>
  ${it.checked !== null
    ? `<input type="checkbox" disabled ${it.checked ? "checked" : ""}> `
    : ""}
  ${renderInlineV3(it.text)}
</li>`).join("") + `</ul>`;
}

/*function splitTableRow(row) {
  return row.split("|").map(c => c.trim()).filter(Boolean);
}*/
function splitTableRow(row) {
  const cells = [];
  let cur = "";
  let inCode = false;

  // trim outer pipes
  row = row.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];

    // toggle inline code
    if (ch === "`") {
      inCode = !inCode;
      cur += ch;
      continue;
    }

    // split ONLY if not inside `code`
    if (ch === "|" && !inCode) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur.trim()) cells.push(cur.trim());
  return cells;
}

function renderTableV3(t) {
  return `
<table>
  ${t.header ? `
  <thead>
    <tr>${t.header.map(h => `<th>${renderInlineV3(h)}</th>`).join("")}</tr>
  </thead>` : ""}
  <tbody>
    ${t.rows.map(r =>
      `<tr>${r.map(c => `<td>${renderInlineV3(c)}</td>`).join("")}</tr>`
    ).join("")}
  </tbody>
</table>`;
}

/* =========================
   PUBLIC API
   ========================= */
function renderMarkdown(md) {
  if (!md) return "";
  return renderMarkdownV3(md);
  //return parseMarkdown(md).map(renderBlock).join("");
}

  // ===========================
  // SYNTAX HIGHLIGHTING
  // ===========================
  function highlightCode(code, lang) {
    // Escape HTML
    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (lang === 'javascript' || lang === 'js' || lang === 'exinix') {
      // Comments
      html = html.replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>');
      html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>');
      // Strings
      html = html.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
        '<span class="tok-string">$1</span>');
      // Keywords
      html = html.replace(/\b(const|let|var|function|return|if|else|for|while|class|new|this|typeof|instanceof|of|in|import|export|default|async|await|try|catch|throw|break|continue|switch|case)\b/g,
        '<span class="tok-keyword">$1</span>');
      // Numbers
      html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');
      // Builtins
      html = html.replace(/\b(console|Math|Array|Object|String|Number|JSON|Promise|window|document|undefined|null|true|false)\b/g,
        '<span class="tok-builtin">$1</span>');
      // Functions
      html = html.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        '<span class="tok-function">$1</span>(');
    } else if (lang === 'css') {
      html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>');
      html = html.replace(/([.#][a-zA-Z_-][a-zA-Z0-9_-]*)/g, '<span class="tok-function">$1</span>');
      html = html.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>');
      html = html.replace(/#([0-9a-fA-F]{3,6})\b/g, '<span class="tok-number">#$1</span>');
    } else if (lang === 'html') {
      html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>');
      html = html.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-keyword">$2</span>');
      html = html.replace(/([\w-]+)(=)("(?:[^"\\]|\\.)*")/g,
        '<span class="tok-property">$1</span>$2<span class="tok-string">$3</span>');
    }

    return html;
  }

  // ===========================
  // CODE EXECUTION
  // ===========================
  function executeCode(code) {
    const outputEl = $('output-display');
    const statusEl = document.querySelector('.output-status');
    const runBtn = $('run-btn');
    const runIndicator = $('run-indicator');

    if (!outputEl) return;

    outputEl.innerHTML = '';
    if (statusEl) { statusEl.className = 'output-status running'; }
    if (runBtn) runBtn.disabled = true;
    if (runIndicator) runIndicator.classList.add('active');

    const logs = [];

    // Safe sandbox
    const sandbox = {
      console: {
        log: (...args) => logs.push({ type: 'log', text: args.map(formatArg).join(' ') }),
        error: (...args) => logs.push({ type: 'error', text: 'ERROR: ' + args.map(formatArg).join(' ') }),
        warn: (...args) => logs.push({ type: 'warn', text: 'WARN: ' + args.map(formatArg).join(' ') }),
        info: (...args) => logs.push({ type: 'log', text: args.map(formatArg).join(' ') }),
      },
      Math, JSON, Array, Object, String, Number, Boolean, Date, RegExp,
      parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
      setTimeout: (fn, ms) => { /* noop for safety */ },
      clearTimeout: () => {},
      undefined, null: null,
    };

    const sandboxKeys = Object.keys(sandbox);
    const sandboxValues = Object.values(sandbox);

    setTimeout(() => {
      try {
        const fn = new Function(...sandboxKeys, `"use strict";\n${code}`);
        const result = fn(...sandboxValues);

        if (result !== undefined && logs.length === 0) {
          logs.push({ type: 'success', text: formatArg(result) });
        }

        displayOutput(logs, outputEl, false);
        if (statusEl) statusEl.className = 'output-status success';
      } catch (err) {
        const cleanMsg = err.message.replace(/\bat\s+.*$/gm, '').trim();
        logs.push({ type: 'error', text: '⚠ ' + cleanMsg });
        displayOutput(logs, outputEl, true);
        if (statusEl) statusEl.className = 'output-status error';
      } finally {
        if (runBtn) runBtn.disabled = false;
        if (runIndicator) runIndicator.classList.remove('active');
      }
    }, 50);
  }

  function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg, null, 2); }
      catch { return String(arg); }
    }
    return String(arg);
  }

  function displayOutput(logs, container, isError) {
    if (logs.length === 0) {
      container.innerHTML = '<span class="output-line success-line">✓ Code ran successfully (no output)</span>';
      return;
    }

    container.innerHTML = logs.map(log => {
      let cls = 'output-line';
      if (log.type === 'error') cls += ' error-line';
      else if (log.type === 'success') cls += ' success-line';
      else if (log.type === 'warn') cls += ' warn-line';

      const escaped = log.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<div class="${cls}">${escaped}</div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  // async load data Stats
  // async load data Stats
async function loadStats(url) {
  try {
    if (!url) return null;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch home stats");
    }

    return await response.json();
  } catch (err) {
    console.error("Home meta error:", err);
    return null;
  }
}

let homeStatsCache = null;

async function getHomeStats() {
  if (homeStatsCache) return homeStatsCache;
  homeStatsCache = await loadStats("api/homestt_aa.php");
  return homeStatsCache;
}




  // ===========================
  // RENDER HOME
  // ===========================
  async function renderHome() {
    const main = $('main-content');
    if (!main) return;

    const stats = await getHomeStats("api/homestt_aa.php") || {
    learners: "12K+",
    lessons: "80",
    code: "1210",
    success: "90%"
  };

    main.innerHTML = `
      <div class="home-page fade-in">
        <!-- Hero -->
        <div class="hero">
          <div class="hero-badge">✦ Interactive Learning Platform</div>
          <h1 class="hero-title">
            Learn to Code.<br>
            <span class="highlight">Build Anything.</span>
          </h1>
          <p class="hero-subtitle">
            Master programming through interactive lessons and a built-in code editor.
            Real code. Real feedback. Real skills.
          </p>
          <div class="hero-actions">
            <a href="#topic/exinix-basics/introduction" class="btn-primary">
              ▶ Start Learning
            </a>
            <button class="btn-secondary" onclick="scrollToTopics()">
              View Courses →
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-number">${stats.learners}</div>
            <div class="stat-label">Learners</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.lessons}</div>
            <div class="stat-label">Lessons</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.code}</div>
            <div class="stat-label">Code Examples</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.success}</div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>

        <!-- Features -->
        <div class="section">
          <h2 class="section-title">Why Amstig?</h2>
          <p class="section-subtitle">Everything you need to go from beginner to confident developer.</p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon orange">⚡</div>
              <div class="feature-title">Live Code Editor</div>
              <div class="feature-desc">Run JavaScript directly in your browser. See results instantly with our sandboxed execution environment.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon teal">📖</div>
              <div class="feature-title">Structured Curriculum</div>
              <div class="feature-desc">Carefully crafted lessons that build on each other — from variables to advanced patterns.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon blue">🎯</div>
              <div class="feature-title">Focused Learning</div>
              <div class="feature-desc">No fluff. Clear explanations, real-world examples, and practical exercises on every topic.</div>
            </div>
          </div>
        </div>

        <!-- Topics -->
        <div class="section" style="border-top: 1px solid var(--border-light); background: var(--bg-secondary);" id="topics-section">
          <h2 class="section-title">Learning Paths</h2>
          <p class="section-subtitle">Choose your starting point and follow a guided path to mastery.</p>
          <div class="topics-grid">
            ${TOPICS.map(topic => `
              <a href="#topic/${topic.id}/${topic.subtopics[0].id}" class="topic-card">
                <div class="topic-card-header">
                  <div class="topic-emoji">${topic.icon}</div>
                  <div class="topic-card-meta">
                    <div class="topic-card-title">${topic.title}</div>
                    <div class="topic-card-count">${topic.subtopics.length} lessons</div>
                  </div>
                </div>
                <p class="topic-card-desc">${topic.description}</p>
                <div class="topic-card-footer">
                  <span class="topic-badge">📌 Beginner Friendly</span>
                  <span class="topic-arrow">→</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-section">
          <div class="cta-box">
            <h2 class="cta-title">Ready to start building?</h2>
            <p class="cta-desc">Join thousands of learners turning ideas into working code.</p>
            <a href="#topic/exinix-basics/introduction" class="btn-primary">
              Begin Your Journey ✦
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ===========================
  // RENDER LESSON
  // ===========================
  async function renderLesson(topicId, subtopicId) {
    const main = $('main-content');
    if (!main) return;
    const stats = await loadStats("api/statictics_ad.php") || {
    readTime: "~12 min read",
    level: "Intermediate",
    readers: "110k+ learners"
  };




    const topic = TOPICS.find(t => t.id === topicId);
    const subtopic = topic?.subtopics.find(s => s.id === subtopicId);

    if (!topic || !subtopic) {
      main.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Lesson Not Found</div>
          <p class="empty-desc">This content couldn't be found.</p>
          <a href="#home" class="btn-primary">Back to Home</a>
        </div>`;
      return;
    }

    const subtopicIndex = topic.subtopics.findIndex(s => s.id === subtopicId);
    const prevSub = subtopicIndex > 0 ? topic.subtopics[subtopicIndex - 1] : null;
    const nextSub = subtopicIndex < topic.subtopics.length - 1 ? topic.subtopics[subtopicIndex + 1] : null;
    const progress = Math.round(((subtopicIndex + 1) / topic.subtopics.length) * 100);

    const hasCode = !!subtopic.codeExample;

    main.innerHTML = `
      <div class="lesson-layout fade-in">
        <div class="lesson-content-area">
          <!-- Lesson Header -->
          <div class="lesson-header">
            <div class="lesson-breadcrumb">
              <a href="#home" style="color: var(--text-muted); transition: color 0.15s" onmouseover="this.style.color='var(--accent-orange)'" onmouseout="this.style.color='var(--text-muted)'">Home</a>
              <span class="breadcrumb-sep">›</span>
              <span>${topic.icon} ${topic.title}</span>
              <span class="breadcrumb-sep">›</span>
              <span class="breadcrumb-current">${subtopic.title}</span>
            </div>
            <h1 class="lesson-title">${subtopic.title}</h1>
            <div class="lesson-meta">
              <div class="meta-item">⏱ ${stats.readTime}</div>
              <div class="meta-item">📗 ${stats.level}</div>
              <div class="meta-item">👤 ${stats.readers}</div>
              ${hasCode ? '<div class="meta-item interactive">⚡ Interactive</div>' : ''}
            </div>
          </div>

          <!-- Body: Content + Code Editor -->
          <div class="lesson-body">
            <!-- Content -->
            <div class="lesson-text">
              <div class="lesson-text-inner md-content">
                ${renderMarkdown(subtopic.content.trim())}
              </div>
            </div>

            <!-- Code Panel -->
            ${hasCode ? `
            <div class="code-panel" id="code-panel">
              <div class="code-panel-header">
                <div class="code-panel-title">
                  <div class="code-dots">
                    <div class="code-dot red"></div>
                    <div class="code-dot yellow"></div>
                    <div class="code-dot green"></div>
                  </div>
                  <span>Try it yourself</span>
                </div>
                <div class="code-panel-actions">
                  <div class="running-indicator" id="run-indicator"></div>
                  <button class="code-action-btn run-btn" id="run-btn" onclick="runCurrentCode()">
                    ▶ Run
                  </button>
                  <button class="code-action-btn copy-btn" onclick="copyCurrentCode()">Copy</button>
                  <button class="code-action-btn reset-btn" onclick="resetCode()">Reset</button>
                </div>
              </div>

              <div class="code-editor-wrap">
                <textarea id="code-editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off">${escapeHtml(subtopic.codeExample)}</textarea>
              </div>

              <div class="output-panel">
                <div class="output-header">
                  <div class="output-title">
                    <div class="output-status" id="output-status"></div>
                    Output
                  </div>
                  <button class="clear-output-btn" onclick="clearOutput()">Clear</button>
                </div>
                <div id="output-display">
                  <span class="output-placeholder">Run your code to see output here…</span>
                </div>
              </div>
            </div>` : ''}
          </div>

          <!-- Navigation -->
          <div class="lesson-nav">
            <div>
              ${prevSub ? `
                <button class="nav-btn nav-btn-prev" onclick="navigate('topic', '${topicId}', '${prevSub.id}')">
                  ← ${prevSub.title}
                </button>` : '<div></div>'}
            </div>

            <div class="nav-progress">
              <span>${subtopicIndex + 1} / ${topic.subtopics.length}</span>
              <div class="nav-progress-bar">
                <div class="nav-progress-fill" style="width: ${progress}%"></div>
              </div>
            </div>

            <div>
              ${nextSub ? `
                <button class="nav-btn nav-btn-next" onclick="navigate('topic', '${topicId}', '${nextSub.id}')">
                  ${nextSub.title} →
                </button>
              ` : `
                <button class="nav-btn nav-btn-complete">
                  🎉 Complete!
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Store original code for reset
    if (subtopic.codeExample) {
      state.originalCode = subtopic.codeExample;
      setupCodeEditor();
    }

    // Update sidebar expand
    expandCurrentTopic();
    updateSidebarActive();

    // Scroll to top
    main.scrollTop = 0;
  }

  // ===========================
  // CODE EDITOR SETUP
  // ===========================
  function setupCodeEditor() {
    const editor = $('code-editor');
    if (!editor) return;

    // Tab support
    editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const val = editor.value;
        editor.value = val.substring(0, start) + '  ' + val.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
      }
      // Ctrl/Cmd + Enter to run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCurrentCode();
      }
    });
  }

  // ===========================
  // GLOBAL FUNCTIONS
  // ===========================
  window.runCurrentCode = function() {
    const editor = $('code-editor');
    if (!editor || state.executingCode) return;
    executeCode(editor.value);
  };

  window.copyCurrentCode = function() {
    const editor = $('code-editor');
    if (!editor) return;
    navigator.clipboard?.writeText(editor.value).then(() => showToast('Code copied!', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
  };

  window.resetCode = function() {
    const editor = $('code-editor');
    if (!editor) return;
    editor.value = state.originalCode;
    clearOutput();
    showToast('Code reset', 'success');
  };

  window.clearOutput = function() {
    const out = $('output-display');
    if (out) out.innerHTML = '<span class="output-placeholder">Run your code to see output here…</span>';
    const status = document.querySelector('.output-status');
    if (status) status.className = 'output-status';
  };

  window.copyCodeBlock = function(btn) {
    const pre = btn.closest('.code-block').querySelector('pre code');
    if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard?.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    });
  };

  window.scrollToTopics = function() {
    const el = $('topics-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  window.navigate = navigate;

  // ===========================
  // TOAST
  // ===========================
  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ===========================
  // UTILITY
  // ===========================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  function setupTopicSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filterSidebar(q);
  });
}

function filterSidebar(query) {
  const sections = document.querySelectorAll(".sidebar-section");

  sections.forEach(section => {
    const header = section.querySelector(".sidebar-topic-header");
    const subtopics = section.querySelectorAll(".sidebar-link");

    let topicMatch = false;
    let anySubMatch = false;

    const topicTitle = header.textContent.toLowerCase();
    topicMatch = topicTitle.includes(query);

    subtopics.forEach(link => {
      const text = link.textContent.toLowerCase();
      const match = text.includes(query);
      link.style.display = match || !query ? "" : "none";
      if (match) anySubMatch = true;
    });

    // Show section if topic OR any subtopic matches
    const visible = topicMatch || anySubMatch || !query;
    section.style.display = visible ? "" : "none";

    // Auto-expand matched topics
    const subWrap = section.querySelector(".sidebar-subtopics");
    if (query && anySubMatch) {
      header.classList.add("expanded");
      subWrap.classList.add("expanded");
    }

    if (!query) {
      header.classList.remove("expanded");
      subWrap.classList.remove("expanded");
    }
  });
}

  // ===========================
  // INIT
  // ===========================
  function init() {
    // Apply saved theme
    applyTheme(state.theme);

    // Build sidebar
    buildSidebar();

    //Search
    setupTopicSearch();

    // Theme toggle
    const themeToggle = $('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Sidebar toggle (mobile)
    const sidebarToggle = $('sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

    // Sidebar overlay close
    const overlay = $('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Router
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
