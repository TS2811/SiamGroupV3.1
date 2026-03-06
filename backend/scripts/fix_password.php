<?php
// Quick debug: ตรวจ password hash ใน DB
require_once __DIR__ . '/../config/config.php';

$stmt = $pdo->query("SELECT id, username, password_hash FROM core_users WHERE username='admin'");
$user = $stmt->fetch();

echo "User found: " . ($user ? 'YES' : 'NO') . "\n";
if ($user) {
    echo "Hash in DB: " . $user['password_hash'] . "\n";
    echo "Hash length: " . strlen($user['password_hash']) . "\n";

    // Generate correct hash
    $correctHash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);
    echo "Correct hash: " . $correctHash . "\n";

    // Test verify
    echo "Verify with DB hash: " . (password_verify('admin123', $user['password_hash']) ? 'PASS' : 'FAIL') . "\n";
    echo "Verify with new hash: " . (password_verify('admin123', $correctHash) ? 'PASS' : 'FAIL') . "\n";

    // Fix it directly
    $stmt2 = $pdo->prepare("UPDATE core_users SET password_hash = :hash WHERE username = 'admin'");
    $stmt2->execute(['hash' => $correctHash]);
    echo "\n=== Fixed! Updated hash in DB ===\n";
    echo "New hash: $correctHash\n";
    echo "Verify after fix: " . (password_verify('admin123', $correctHash) ? 'PASS' : 'FAIL') . "\n";
}
