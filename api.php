<?php
/**
 * Amstig - Optional PHP API endpoint
 * For future server-side features (user progress, etc.)
 * Currently the app runs entirely client-side.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? 'ping';

switch ($action) {
    case 'ping':
        echo json_encode([
            'status' => 'ok',
            'message' => 'Amstig API is running',
            'version' => '1.0.0',
            'timestamp' => date('c')
        ]);
        break;

    case 'progress':
        // Future: save/load user progress
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $body = json_decode(file_get_contents('php://input'), true);
            // Store in session or database
            session_start();
            $_SESSION['progress'] = $body['progress'] ?? [];
            echo json_encode(['success' => true]);
        } else {
            session_start();
            echo json_encode([
                'progress' => $_SESSION['progress'] ?? []
            ]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown action']);
}
