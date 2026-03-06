<?php

/**
 * SiamGroup V3.1 — Core Module Router
 * 
 * Entry Point: /api/core/*
 * Route ทุก request มาที่นี่ผ่าน .htaccess
 */

// ========================================
// 1. Load Dependencies
// ========================================
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/CorsMiddleware.php';
require_once __DIR__ . '/../middleware/ApiKeyMiddleware.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// ========================================
// 2. Global Middleware
// ========================================
handleCors();
verifyApiKey();

// ========================================
// 3. Load Models
// ========================================
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/models/User.php';

// ========================================
// 4. Route Handling
// ========================================
$route  = getRoute();
$method = getMethod();

// Parse route segments: auth/login → ['auth', 'login']
$segments = array_filter(explode('/', $route));
$segments = array_values($segments); // reindex

$group    = $segments[0] ?? '';
$action   = $segments[1] ?? '';
$param    = $segments[2] ?? '';

// ========================================
// 5. Route Switch
// ========================================
switch ($group) {

    // ─────────────────────────────────
    // AUTH — /api/core/auth/*
    // ─────────────────────────────────
    case 'auth':
        $userModel = new User($pdo);

        switch ($action) {
            case 'login':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();
                $error = validateRequired($body, ['username', 'password']);
                if ($error) jsonError($error, 'VALIDATION_ERROR');

                $result = $userModel->login($body['username'], $body['password']);
                if (!$result['success']) {
                    jsonError($result['message'], $result['error_code'], $result['status_code']);
                }

                // Set HttpOnly Cookies
                setAuthCookies($result['access_token'], $result['refresh_token']);

                jsonSuccess([
                    'user'        => $result['user'],
                    'menu_tree'   => $result['menu_tree'],
                    'permissions' => $result['permissions'],
                ], 'เข้าสู่ระบบสำเร็จ');
                break;

            case 'refresh':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $decoded = verifyRefreshToken();
                if (!$decoded) {
                    clearAuthCookies();
                    jsonError('Refresh token ไม่ถูกต้องหรือหมดอายุ', 'REFRESH_FAILED', 401);
                }

                $result = $userModel->refreshSession((int)$decoded->sub);
                if (!$result['success']) {
                    clearAuthCookies();
                    jsonError($result['message'], 'REFRESH_FAILED', 401);
                }

                setAuthCookies($result['access_token'], $result['refresh_token']);
                jsonSuccess(['user' => $result['user']], 'Token refreshed');
                break;

            case 'logout':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                clearAuthCookies();
                jsonSuccess(null, 'ออกจากระบบสำเร็จ');
                break;

            case 'me':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $decoded = requireAuth();
                $user = $userModel->getProfile((int)$decoded->sub);
                if (!$user) jsonError('ไม่พบผู้ใช้', 'NOT_FOUND', 404);

                // ดึง menu_tree + permissions ด้วย (เพื่อให้ refresh page แล้วเมนูไม่หาย)
                $levelId = $user['level_id'] ?? null;
                $userId  = (int)$decoded->sub;
                $menuTree    = $userModel->getMenuTree($levelId, $userId);
                $permissions = $userModel->getPermissions($levelId, $userId);

                jsonSuccess([
                    'user'        => $user,
                    'menu_tree'   => $menuTree,
                    'permissions' => $permissions,
                ]);
                break;

            default:
                jsonError('Route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // DASHBOARD — /api/core/dashboard/*
    // ─────────────────────────────────
    case 'dashboard':
        $decoded = requireAuth();
        // TODO: Implement dashboard endpoints
        jsonSuccess(['message' => 'Dashboard endpoint — coming soon']);
        break;

    // ─────────────────────────────────
    // CHECK-IN — /api/core/checkin/*
    // ─────────────────────────────────
    case 'checkin':
        $decoded = requireAuth();
        // TODO: Implement check-in endpoints
        jsonSuccess(['message' => 'Check-in endpoint — coming soon']);
        break;

    // ─────────────────────────────────
    // REQUESTS — /api/core/requests/*
    // ─────────────────────────────────
    case 'requests':
        $decoded = requireAuth();
        // TODO: Implement request endpoints
        jsonSuccess(['message' => 'Requests endpoint — coming soon']);
        break;

    // ─────────────────────────────────
    // PROFILE — /api/core/profile/*
    // ─────────────────────────────────
    case 'profile':
        $decoded = requireAuth();
        // TODO: Implement profile endpoints
        jsonSuccess(['message' => 'Profile endpoint — coming soon']);
        break;

    // ─────────────────────────────────
    // SETTINGS — /api/core/settings/*
    // ─────────────────────────────────
    case 'settings':
        $decoded = requireAdmin();
        // TODO: Implement settings endpoints
        jsonSuccess(['message' => 'Settings endpoint — coming soon']);
        break;

    // ─────────────────────────────────
    // DEFAULT
    // ─────────────────────────────────
    default:
        jsonError('Route not found: /api/core/' . $route, 'NOT_FOUND', 404);
}
