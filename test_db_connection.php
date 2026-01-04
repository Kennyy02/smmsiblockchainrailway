<?php
$host = 'yamanote.proxy.rlwy.net';
$port = 59154;
$db = 'railway';
$user = 'root';
$pass = 'QcZagiIHkFzESoouEYYHYUbDMKOECyfh';

echo "Testing connection to Railway MySQL...\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "Database: $db\n";
echo "Username: $user\n\n";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connection successful!\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT DATABASE()");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Connected to database: " . $result['DATABASE()'] . "\n";
} catch (PDOException $e) {
    echo "❌ Connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
}

