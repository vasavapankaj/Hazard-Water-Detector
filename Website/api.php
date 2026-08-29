<?php
header('Content-Type: application/json');

$conn = mysqli_connect("localhost", "root", "", "water_detector");

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Fetch the latest reading
$query_latest = "SELECT * FROM water_data ORDER BY id DESC LIMIT 1";
$result_latest = mysqli_query($conn, $query_latest);
$latest = mysqli_fetch_assoc($result_latest);

// Fetch the last 15 readings for the graph and table
$query_history = "SELECT * FROM (SELECT * FROM water_data ORDER BY id DESC LIMIT 15) sub ORDER BY id ASC";
$result_history = mysqli_query($conn, $query_history);
$history = [];
while ($row = mysqli_fetch_assoc($result_history)) {
    $history[] = $row;
}

// We return both so that the frontend can update charts and current values smoothly
echo json_encode([
    "latest" => $latest,
    "history" => array_reverse($history), // For the table (newest first)
    "chart_data" => $history // For the chart (oldest to newest left-to-right)
]);

mysqli_close($conn);
?>
