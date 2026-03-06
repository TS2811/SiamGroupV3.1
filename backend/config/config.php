<?php
/**
 * SiamGroup V3.1 — Configuration
 * 
 * โหลด .env + สร้าง PDO Connection
 */

// ========================================
// 1. Load Environment Variables
// ========================================
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            putenv($line);
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// ========================================
// 2. Helper function
// ========================================
function env(string $key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        return $_ENV[$key] ?? $default;
    }
    // Cast booleans
    if ($value === 'true') return true;
    if ($value === 'false') return false;
    return $value;
}

// ========================================
// 3. Database Connection (PDO)
// ========================================
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        env('DB_HOST', '127.0.0.1'),
        env('DB_PORT', '3306'),
        env('DB_NAME', 'siamgroup_v3')
    );

    $pdo = new PDO($dsn, env('DB_USER', 'root'), env('DB_PASS', ''), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    $response = ['status' => 'error', 'message' => 'Database connection failed'];
    if (env('APP_DEBUG', false)) {
        $response['debug'] = $e->getMessage();
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

// ========================================
// 4. Timezone
// ========================================
date_default_timezone_set('Asia/Bangkok');
