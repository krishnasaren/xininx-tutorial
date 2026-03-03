<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Amstig — Learn to code interactively. JavaScript, Python, Web Development and more with a built-in live code editor.">
  <!--<meta name="theme-color" content="#0f0e0d">-->
  <script src="js/meta.js"></script>
  <title>Amstig — Learn to Code Interactively</title>

  <!-- Preconnect for fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- Styles -->
  <link rel="stylesheet" href="css/style.css">

  <!-- Favicon SVG -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23e85d26'/><text x='16' y='22' text-anchor='middle' font-size='18' font-family='monospace' fill='white'>A</text></svg>">
</head>
<body>
  <div class="app-layout">

    <!-- ========================
         HEADER
         ======================== -->
    <header class="header">
      <!-- Sidebar toggle (mobile) -->
      <button class="btn-icon btn-sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar" title="Toggle sidebar">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="3" width="16" height="2" rx="1" fill="currentColor"/>
          <rect x="1" y="8" width="16" height="2" rx="1" fill="currentColor"/>
          <rect x="1" y="13" width="16" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>

      <!-- Logo -->
      <a href="#home" class="header-logo">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 6l-4 3 4 3M13 6l4 3-4 3M10 3l-2 12" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>Am<span class="accent">stig</span></span>
      </a>

      <!-- Search -->
      <div class="header-search">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.4"/>
          <path d="M9.5 9.5l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        <input type="search" placeholder="Search lessons..." id="search-input" autocomplete="off">
      </div>

      <!-- Nav -->
      <div class="header-nav">
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" title="Toggle light/dark theme">
          <!-- Moon (shown in light mode) -->
          <span class="moon-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 10.5A6 6 0 1 1 5.5 2.5a5 5 0 0 0 8 8z" fill="currentColor"/>
            </svg>
          </span>
          <!-- Sun (shown in dark mode) -->
          <span class="sun-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l-1.41 1.41M4.95 11.54l-1.41 1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
        </button>
      </div>
    </header>

    <!-- ========================
         BODY
         ======================== -->
    <div class="content-area">

      <!-- Sidebar Overlay (mobile) -->
      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <!-- ========================
           SIDEBAR
           ======================== -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
          <!-- Nav populated by JS -->
          <nav id="sidebar-nav"></nav>

          <!-- Progress -->
          <!--<div class="sidebar-progress">
            <div class="progress-label">
              <span>Overall Progress</span>
              <span style="color: var(--accent-orange); font-weight: 600;">23%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="overall-progress"></div>
            </div>
          </div>-->
          <div class="sidebar-footer">
  <div class="sidebar-footer-brand">
    <span class="brand-name">Amstig</span>
    <span class="brand-year">© 2015–2026</span>
  </div>

  <p class="sidebar-footer-about">
    A modern interactive learning platform for real-world coding skills.
  </p>

  <div class="sidebar-footer-links">
    <a href="/privacy">Privacy</a>
    <span>•</span>
    <a href="/terms">Terms</a>
  </div>
</div>
        </div>
      </aside>

      <!-- ========================
           MAIN CONTENT
           ======================== -->
      <main class="main-content" id="main-content">
        <!-- Rendered by JS -->
        <div style="display:flex;align-items:center;justify-content:center;height:60vh;color:var(--text-muted);font-size:1.5rem;">
          Loading…
        </div>
      </main>
    </div>

  </div>

  <!-- Toast notification -->
  <div class="toast" id="toast"></div>

  <!-- Scripts -->
  <script type="module" src="js/topics.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
