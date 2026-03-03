(function () {
  const theme = localStorage.getItem('amstig-theme') || 'light';
  const color = theme === 'dark' ? '#0f0e0d' : '#f8f7f4';

  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = color;
  document.head.appendChild(meta);

  //document.documentElement.setAttribute('data-theme', theme);
})();
