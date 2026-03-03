function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';

  document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  location.reload();
}
