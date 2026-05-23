<?php
// rooms.php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM rooms");
        $rooms = $stmt->fetchAll();

        // Convert JSON database strings back into readable JavaScript arrays
        foreach ($rooms as &$room) {
            $room['images'] = json_decode($room['images']);
            $room['services'] = json_decode($room['services']);
            // Convert numerical integer price to string format for safety if required
            $room['rate'] = "₱" . number_format($room['rate']) . " / night";
        }

        echo json_encode($rooms);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Server Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method Not Allowed"]);
}