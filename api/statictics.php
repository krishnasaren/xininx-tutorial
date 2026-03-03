<?php
header("Content-Type: application/json");

/* -------------------------
   RANDOM DATA SOURCES
   ------------------------- */

$readTimes = [
  "~5 min read",
  "~8 min read",
  "~10 min read",
  "~12 min read",
  "~15 min read",
  "~20 min read"
];

$levels = [
  "Beginner",
  "Beginner–Intermediate",
  "Intermediate",
  "Intermediate–Advanced",
  "Advanced"
];

$readerRanges = [
  [1.2, 3],
  [3, 8],
  [8, 15],
  [15, 40],
  [40, 120]
];

/* -------------------------
   RANDOM PICKERS
   ------------------------- */

$readTime = $readTimes[array_rand($readTimes)];
$level = $levels[array_rand($levels)];

$range = $readerRanges[array_rand($readerRanges)];
$readers = rand($range[0], $range[1]);

/* -------------------------
   RESPONSE
   ------------------------- */

$response = [
  "readTime" => $readTime,
  "level" => $level,
  "readers" => number_format($readers) . "k+ learners"
];

echo json_encode($response, JSON_PRETTY_PRINT);
