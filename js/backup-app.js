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

  function handleRoute() {
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
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('amstig-theme', theme);
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
  function renderMarkdown(md) {
    if (!md) return '';
    let html = md.trim();

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'code';
      const highlighted = highlightCode(code.trim(), language);
      return `<div class="code-block">
        <div class="code-block-header">
          <span class="code-block-lang">${language}</span>
          <button class="code-block-copy" onclick="copyCodeBlock(this)">Copy</button>
        </div>
        <pre><code class="language-${language}">${highlighted}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // H1, H2, H3
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Simple table
    html = html.replace(/^\|(.+)\|$/gm, (line) => {
      if (line.match(/^\|[-| ]+\|$/)) return '';
      const cells = line.slice(1, -1).split('|').map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    });
    html = html.replace(/(<tr>[\s\S]*?<\/tr>(\s*<tr>[\s\S]*?<\/tr>)*)/g,
      '<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse;font-size:0.875rem">$1</table></div>');

    // Lists
    html = html.replace(/(^- .+\n?)+/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    html = html.replace(/(^\d+\. .+\n?)+/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Paragraphs
    const lines = html.split('\n');
    const result = [];
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBlock = line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') ||
                      line.startsWith('<div') || line.startsWith('<table') || line.startsWith('<tr') ||
                      line.startsWith('<pre') || line === '';

      if (isBlock) {
        if (inBlock) { result.push('</p>'); inBlock = false; }
        result.push(line);
      } else if (!inBlock) {
        result.push('<p>' + line);
        inBlock = true;
      } else {
        result.push(' ' + line);
      }
    }

    if (inBlock) result.push('</p>');
    return result.join('\n');
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

  // ===========================
  // RENDER HOME
  // ===========================
  function renderHome() {
    const main = $('main-content');
    if (!main) return;

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
            <div class="stat-number">10K+</div>
            <div class="stat-label">Learners</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">200+</div>
            <div class="stat-label">Lessons</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">500+</div>
            <div class="stat-label">Code Examples</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">95%</div>
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
  function renderLesson(topicId, subtopicId) {
    const main = $('main-content');
    if (!main) return;

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
              <div class="meta-item">⏱ ~15 min read</div>
              <div class="meta-item">📗 Beginner</div>
              <div class="meta-item">👤 1.2k+ learners</div>
              ${hasCode ? '<div class="meta-item interactive">⚡ Interactive</div>' : ''}
            </div>
          </div>

          <!-- Body: Content + Code Editor -->
          <div class="lesson-body">
            <!-- Content -->
            <div class="lesson-text">
              <div class="lesson-text-inner md-content">
                ${renderMarkdown(subtopic.content)}
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

  // ===========================
  // INIT
  // ===========================
  function init() {
    // Apply saved theme
    applyTheme(state.theme);

    // Build sidebar
    buildSidebar();

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
