<?php
$conn = mysqli_connect("localhost", "root", "", "water_detector");

if (!$conn) {
    die("Database connection failed");
}

// The ESP32 can send data via GET or POST. We use $_REQUEST to support both.
// Example ESP32 GET Request: http://<your_ip_address>/Hazard%20water%20detector/insert_data.php?tds=320&turbidity=2.5

if (isset($_REQUEST['tds']) && isset($_REQUEST['turbidity'])) {
    
    // Get and sanitize the sensor values
    $tds = floatval($_REQUEST['tds']);
    $turbidity = floatval($_REQUEST['turbidity']);
    
    // Calculate the status logic automatically
    // Rule: If TDS is over 500 or Turbidity is over 5, it is considered UNSAFE
    if ($tds > 500 || $turbidity > 5) {
        $status = "UNSAFE";
    } else {
        $status = "SAFE";
    }
    
    // Secure SQL insertion to prevent SQL injection
    $stmt = $conn->prepare("INSERT INTO water_data (tds, turbidity, status) VALUES (?, ?, ?)");
    $stmt->bind_param("dds", $tds, $turbidity, $status);
    
    if ($stmt->execute()) {
        echo "Success: Data inserted into database.";
    } else {
        echo "Error: Failed to insert data. " . $stmt->error;
    }
    
    $stmt->close();
    
} else {
    echo "Error: Missing 'tds' or 'turbidity' parameters in request.";
}

mysqli_close($conn);
?>
