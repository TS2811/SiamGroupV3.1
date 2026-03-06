<?php

/**
 * SiamGroup V3.1 — Helper Functions
 */

/**
 * ส่ง JSON Response มาตรฐาน
 */
function jsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Success Response
 */
function jsonSuccess($data = null, string $message = 'สำเร็จ', int $statusCode = 200): void
{
    $response = ['status' => 'success', 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response, $statusCode);
}

/**
 * Error Response
 */
function jsonError(string $message, string $errorCode = 'ERROR', int $statusCode = 400): void
{
    jsonResponse([
        'status'     => 'error',
        'error_code' => $errorCode,
        'message'    => $message
    ], $statusCode);
}

/**
 * ดึง JSON Body จาก Request
 */
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * ดึง request method
 */
function getMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD']);
}

/**
 * ดึง route จาก query string
 */
function getRoute(): string
{
    return trim($_GET['route'] ?? '', '/');
}

/**
 * ดึง IP Address ของ Client
 */
function getClientIp(): string
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * ดึง User Agent
 */
function getUserAgent(): string
{
    return $_SERVER['HTTP_USER_AGENT'] ?? '';
}

/**
 * Sanitize string input
 */
function sanitize(?string $input): ?string
{
    if ($input === null) return null;
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate required fields
 */
function validateRequired(array $data, array $requiredFields): ?string
{
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            return "กรุณากรอก {$field}";
        }
    }
    return null;
}
