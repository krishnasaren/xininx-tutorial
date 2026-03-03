<?php
$theme = $_COOKIE['theme'] ?? 'dark'; // default dark
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dark Mode Site</title>

<!-- IMPORTANT: Status bar color -->
<meta name="theme-color" content="<?= $theme === 'dark' ? '#0d1117' : '#ffffff' ?>">

<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="style.css">
</head>
<body class="<?= $theme ?>">

<header>
  <h1>Dark Mode Website</h1>
  <button onclick="toggleTheme()">Toggle Theme</button>
</header>

<main>
  <p>This is a PHP website with full dark mode.</p>
</main>

<script src="theme.js"></script>
</body>
</html>
