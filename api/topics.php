<?php
$base = __DIR__ . "/../data/";
$topics = [];

foreach (scandir($base) as $dir) {
    if ($dir === "." || $dir === "..") continue;
    if (is_dir("$base/$dir") && file_exists("$base/$dir/_topicsHandler.js")) {
        $topics[] = "data/$dir/_topicsHandler.js";
    }
}

header("Content-Type: application/json");
echo json_encode($topics);
