<?php
header("Content-Type: application/json");

/* -------------------------
   RANDOM DATA SOURCES
   ------------------------- */



$readerRanges = [
  [1.2, 3],
  [3, 8],
  [8, 15],
  [15, 40],
  [40, 120]
];

$lesson = [
  [10, 30],
  [30, 80],
  [80, 150],
  [150, 400],
  [400, 1200]
];
$code = [
  [100, 300],
  [300, 800],
  [800, 1500],
  [1500, 4000],
  [4000, 12000]
];
$srate = [
  [60, 70],
  [70, 80],
  [80, 100]
];

/* -------------------------
   RANDOM PICKERS
   ------------------------- */


$readers = rand($readerRanges[array_rand($readerRanges)][0], $readerRanges[array_rand($readerRanges)][1]);
$le = rand($lesson[array_rand($lesson)][0], $lesson[array_rand($lesson)][1]);
$co = rand($code[array_rand($code)][0], $code[array_rand($code)][1]);
$sr = rand($srate[array_rand($srate)][0], $srate[array_rand($srate)][1]);

/* -------------------------
   RESPONSE
   ------------------------- */

$response = [
  "learners" => number_format($readers). "K+",
  "lessons" => $le,
  "code" => $co,
  "success" => number_format($sr). "%"
];

echo json_encode($response, JSON_PRETTY_PRINT);
