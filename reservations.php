<?php
// reservations.php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Dynamic relational inner join queries to pull profile records automatically
        $sql = "SELECT r.*, rm.name as room_name, u.full_name as guest_name, u.email 
                FROM reservations r 
                JOIN rooms rm ON r.room_id = rm.id 
                JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC";
        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll());
        exit(); // ◄ Halt right here after outputting JSON
        break;

    case 'POST':
        $userId   = $input['userId'] ?? null;
        $roomId   = $input['roomId'] ?? null;
        $checkIn  = $input['checkIn'] ?? null;
        $checkOut = $input['checkOut'] ?? null;
        $guestCount = $input['guestCount'] ?? null;

        // 1. Check Date Availability Overlap
        $checkSql = "SELECT * FROM reservations 
                     WHERE room_id = ? 
                     AND (check_in < ? AND check_out > ?)";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$roomId, $checkOut, $checkIn]);
        
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(["message" => "This room is already reserved on those dates."]);
            exit(); // ◄ Halt execution immediately
        }

        // 2. Insert mapped relational foreign keys into database rows
        $sql = "INSERT INTO reservations (id, user_id, room_id, check_in, check_out, guest_count, purpose) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $input['id'],
            $userId,
            $roomId,
            $checkIn,
            $checkOut,
            $guestCount,
            $input['purpose']
        ]);

        http_response_code(201);
        echo json_encode(["message" => "Reservation successfully created."]);
        exit(); // ◄ Fixes your frontend error message! Stops PHP instantly.
        break;

    case 'PUT':
        // Added PUT block to support admin reservation editing updates smoothly!
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "Missing reservation ID."]);
            exit();
        }

        $roomId   = $input['roomId'] ?? null;
        $checkIn  = $input['checkIn'] ?? null;
        $checkOut = $input['checkOut'] ?? null;
        $guestCount = $input['guestCount'] ?? null;

        $sql = "UPDATE reservations 
                SET room_id = ?, check_in = ?, check_out = ?, guest_count = ?, purpose = ? 
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $roomId,
            $checkIn,
            $checkOut,
            $guestCount,
            $input['purpose'],
            $id
        ]);

        echo json_encode(["message" => "Reservation updated successfully."]);
        exit(); // ◄ Clean halt
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "Missing reservation ID."]);
            exit();
        }

        $sql = "DELETE FROM reservations WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);

        echo json_encode(["message" => "Reservation canceled successfully."]);
        exit(); // ◄ Clean halt
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method Not Allowed"]);
        exit();
        break;
}