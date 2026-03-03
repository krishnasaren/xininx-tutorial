<?php
$topic = $_GET['topic'] ?? '';
$base = __DIR__ . "/../data/$topic";
$list = [];

if (is_dir($base)) {
  foreach (scandir($base) as $file) {
    if ($file === '.' || $file === '..') continue;
    if ($file === '_topicsHandler.js') continue;
    if (pathinfo($file, PATHINFO_EXTENSION) === 'js') {
      $list[] = "data/$topic/$file";
    }
  }
}

header("Content-Type: application/json");
echo json_encode($list);
