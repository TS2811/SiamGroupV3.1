<?php

/**
 * Quick API Test
 */

$baseUrl = 'http://localhost/v3_1/backend/api/core';
$apiKey  = 'sg_v3_api_key_2026_secure';

echo "=== SiamGroup V3.1 — API Test ===\n\n";

// Test 1: Login
echo "1. POST /auth/login (admin/admin123)\n";
$result = apiCall('POST', "$baseUrl/auth/login", [
    'username' => 'admin',
    'password' => 'admin123',
], $apiKey);
echo json_encode($result['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "HTTP Status: " . $result['http_code'] . "\n\n";

// Test 2: Login with wrong password
echo "2. POST /auth/login (wrong password)\n";
$result = apiCall('POST', "$baseUrl/auth/login", [
    'username' => 'admin',
    'password' => 'wrongpass',
], $apiKey);
echo json_encode($result['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "HTTP Status: " . $result['http_code'] . "\n\n";

// Test 3: No API Key
echo "3. POST /auth/login (no API key)\n";
$result = apiCall('POST', "$baseUrl/auth/login", [
    'username' => 'admin',
    'password' => 'admin123',
], '');
echo json_encode($result['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "HTTP Status: " . $result['http_code'] . "\n\n";

// Test 4: 404
echo "4. GET /nonexistent\n";
$result = apiCall('GET', "$baseUrl/nonexistent", null, $apiKey);
echo json_encode($result['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
echo "HTTP Status: " . $result['http_code'] . "\n";

function apiCall(string $method, string $url, ?array $data, string $apiKey): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => array_filter([
            'Content-Type: application/json',
            $apiKey ? "X-API-Key: $apiKey" : null,
        ]),
        CURLOPT_HEADER         => false,
    ]);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'http_code' => $httpCode,
        'body'      => json_decode($response, true),
    ];
}
