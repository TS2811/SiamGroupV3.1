<?php

/**
 * SiamGroup V3.1 — Auth Middleware (JWT)
 * 
 * ตรวจสอบ JWT Token จาก HttpOnly Cookie
 * ใช้ firebase/php-jwt library
 */

require_once __DIR__ . '/../vendor/firebase/php-jwt/src/JWT.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/Key.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/ExpiredException.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/SignatureInvalidException.php';
require_once __DIR__ . '/../vendor/firebase/php-jwt/src/BeforeValidException.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

/**
 * สร้าง Access Token (short-lived)
 */
function createAccessToken(array $userData): string
{
    $secret = env('JWT_SECRET');
    $expire = (int)env('JWT_ACCESS_EXPIRE', 1800); // 30 min

    $payload = [
        'iss' => 'siamgroup_v3',
        'iat' => time(),
        'exp' => time() + $expire,
        'sub' => $userData['user_id'],
        'emp' => $userData['employee_id'] ?? null,
        'cmp' => $userData['company_id'] ?? null,
        'brn' => $userData['branch_id'] ?? null,
        'lvl' => $userData['level_id'] ?? null,
        'adm' => $userData['is_admin'] ?? false,
    ];

    return JWT::encode($payload, $secret, 'HS256');
}

/**
 * สร้าง Refresh Token (long-lived)
 */
function createRefreshToken(array $userData): string
{
    $secret = env('JWT_SECRET');
    $expire = (int)env('JWT_REFRESH_EXPIRE', 604800); // 7 days

    $payload = [
        'iss'  => 'siamgroup_v3',
        'iat'  => time(),
        'exp'  => time() + $expire,
        'sub'  => $userData['user_id'],
        'type' => 'refresh',
        'jti'  => bin2hex(random_bytes(16)), // unique token ID
    ];

    return JWT::encode($payload, $secret, 'HS256');
}

/**
 * Set JWT Cookies
 */
function setAuthCookies(string $accessToken, string $refreshToken): void
{
    $basePath = '/v3_1/backend/api/';
    $secure = env('APP_ENV') !== 'development';

    // Access Token — session cookie
    setcookie('access_token', $accessToken, [
        'expires'  => 0,
        'path'     => $basePath,
        'secure'   => $secure,
        'httponly'  => true,
        'samesite' => 'Lax',
    ]);

    // Refresh Token — persistent cookie
    $refreshExpire = (int)env('JWT_REFRESH_EXPIRE', 604800);
    setcookie('refresh_token', $refreshToken, [
        'expires'  => time() + $refreshExpire,
        'path'     => $basePath . 'core/auth/',
        'secure'   => $secure,
        'httponly'  => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * ลบ JWT Cookies (Logout)
 */
function clearAuthCookies(): void
{
    $basePath = '/v3_1/backend/api/';

    setcookie('access_token', '', [
        'expires'  => time() - 3600,
        'path'     => $basePath,
        'httponly'  => true,
        'samesite' => 'Lax',
    ]);

    setcookie('refresh_token', '', [
        'expires'  => time() - 3600,
        'path'     => $basePath . 'core/auth/',
        'httponly'  => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * ตรวจสอบ JWT Token — return decoded payload หรือ null
 */
function verifyAccessToken(): ?object
{
    $token = $_COOKIE['access_token'] ?? '';

    if (empty($token)) {
        return null;
    }

    try {
        $secret = env('JWT_SECRET');
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        return $decoded;
    } catch (ExpiredException $e) {
        return null; // Token expired — ให้ frontend refresh
    } catch (\Exception $e) {
        return null; // Invalid token
    }
}

/**
 * ตรวจสอบ Refresh Token
 */
function verifyRefreshToken(): ?object
{
    $token = $_COOKIE['refresh_token'] ?? '';

    if (empty($token)) {
        return null;
    }

    try {
        $secret = env('JWT_SECRET');
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));

        if (($decoded->type ?? '') !== 'refresh') {
            return null;
        }

        return $decoded;
    } catch (\Exception $e) {
        return null;
    }
}

/**
 * Middleware: บังคับ Auth (ใช้กับ route ที่ต้อง login)
 * Return decoded token หรือ respond 401
 */
function requireAuth(): object
{
    $decoded = verifyAccessToken();

    if (!$decoded) {
        jsonError('กรุณาเข้าสู่ระบบ', 'AUTH_REQUIRED', 401);
    }

    return $decoded;
}

/**
 * Middleware: บังคับ Admin
 */
function requireAdmin(): object
{
    $decoded = requireAuth();

    if (!($decoded->adm ?? false)) {
        jsonError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 'ADMIN_REQUIRED', 403);
    }

    return $decoded;
}
