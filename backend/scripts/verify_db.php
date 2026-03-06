<?php
require_once __DIR__ . '/../config/config.php';

echo "=== Verify Thai text in DB ===\n\n";

echo "-- Companies --\n";
$rows = $pdo->query("SELECT code, name_th FROM core_companies")->fetchAll();
foreach ($rows as $r) echo "{$r['code']}: {$r['name_th']}\n";

echo "\n-- Menu (first 10) --\n";
$rows = $pdo->query("SELECT slug, name_th FROM core_app_structure ORDER BY id LIMIT 10")->fetchAll();
foreach ($rows as $r) echo "{$r['slug']}: {$r['name_th']}\n";

echo "\n-- Admin user --\n";
$row = $pdo->query("SELECT username, first_name_th, last_name_th FROM core_users LIMIT 1")->fetch();
echo "{$row['username']}: {$row['first_name_th']} {$row['last_name_th']}\n";

echo "\n-- Total rows --\n";
echo "Companies: " . $pdo->query("SELECT COUNT(*) FROM core_companies")->fetchColumn() . "\n";
echo "Menus: " . $pdo->query("SELECT COUNT(*) FROM core_app_structure")->fetchColumn() . "\n";
echo "Users: " . $pdo->query("SELECT COUNT(*) FROM core_users")->fetchColumn() . "\n";
