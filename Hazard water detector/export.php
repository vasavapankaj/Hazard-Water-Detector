<?php
$conn = mysqli_connect("localhost", "root", "", "water_detector");

if (!$conn) {
    die("Database connection failed");
}

// Set headers to trigger a file download
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="water_quality_data.csv"');

// Create a file pointer connected to the output stream
$output = fopen('php://output', 'w');

// Output the column headings
fputcsv($output, array('Date & Time', 'TDS (ppm)', 'Turbidity (NTU)', 'Status'));

// Fetch the data
$query = "SELECT created_at, tds, turbidity, status FROM water_data ORDER BY id DESC";
$result = mysqli_query($conn, $query);

// Output each row of the data
while ($row = mysqli_fetch_assoc($result)) {
    fputcsv($output, $row);
}

fclose($output);
mysqli_close($conn);
?>
