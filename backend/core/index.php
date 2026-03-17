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
require_once __DIR__ . '/models/CheckIn.php';
require_once __DIR__ . '/models/Dashboard.php';
require_once __DIR__ . '/models/Requests.php';
require_once __DIR__ . '/models/Profile.php';
require_once __DIR__ . '/models/Settings.php';

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
                $isAdmin = (bool)($user['is_admin'] ?? false);
                $menuTree    = $userModel->getMenuTree($levelId, $userId, $isAdmin);
                $permissions = $userModel->getPermissions($levelId, $userId, $isAdmin);

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
        $dashboard = new Dashboard($pdo);
        $employeeId = $dashboard->getEmployeeId($decoded->sub);

        if (!$employeeId) {
            jsonError('ไม่พบข้อมูลพนักงาน', 'EMPLOYEE_NOT_FOUND', 404);
        }

        $subRoute = $segments[1] ?? 'index';

        switch ($subRoute) {
            // GET /api/core/dashboard/calendar?month=3&year=2026
            case 'calendar':
            case 'index':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $month = (int)($_GET['month'] ?? date('n'));
                $year  = (int)($_GET['year']  ?? date('Y'));
                $shift = $dashboard->getEmployeeShift($employeeId);

                if (!$shift) {
                    $shift = ['start_time' => '08:30:00', 'end_time' => '17:30:00', 'late_grace_minutes' => 5];
                }

                $calendar  = $dashboard->getCalendarData($employeeId, $month, $year, $shift);
                $companyId = $dashboard->getCompanyId($employeeId);
                $summary   = $dashboard->getSummary($employeeId, $companyId);

                jsonSuccess([
                    'calendar' => $calendar,
                    'summary'  => $summary,
                    'shift'    => $shift,
                ]);
                break;

            // GET /api/core/dashboard/summary
            case 'summary':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $companyId = $dashboard->getCompanyId($employeeId);
                $summary = $dashboard->getSummary($employeeId, $companyId);
                jsonSuccess($summary);
                break;

            default:
                jsonError('Dashboard route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // CHECK-IN — /api/core/checkin/*
    // ─────────────────────────────────
    case 'checkin':
        $decoded = requireAuth();
        $checkIn = new CheckIn($pdo);
        $employeeId = $checkIn->getEmployeeId($decoded->sub);

        if (!$employeeId) {
            jsonError('ไม่พบข้อมูลพนักงาน', 'EMPLOYEE_NOT_FOUND', 404);
        }

        $subRoute = $segments[1] ?? '';

        switch ($subRoute) {
            // GET /api/core/checkin/status — สถานะวันนี้
            case 'status':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $status = $checkIn->getTodayStatus($employeeId);
                $branch = $checkIn->getEmployeeBranch($employeeId);
                $shift  = $checkIn->getEmployeeShift($employeeId);

                jsonSuccess([
                    'status' => $status,
                    'branch' => $branch,
                    'shift'  => $shift,
                ]);
                break;

            // POST /api/core/checkin/clock — บันทึกเข้า/ออก
            case 'clock':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $body = json_decode(file_get_contents('php://input'), true) ?? [];

                try {
                    $result = $checkIn->clock($employeeId, $body);
                    jsonSuccess($result);
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'ALREADY_CLOCKED', 400);
                }
                break;

            // GET /api/core/checkin/history?month=3&year=2026 — ประวัติรอบเงินเดือน
            case 'history':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $month = (int)($_GET['month'] ?? date('n'));
                $year  = (int)($_GET['year']  ?? date('Y'));

                $history = $checkIn->getPayrollCycleHistory($employeeId, $month, $year);
                $shift   = $checkIn->getEmployeeShift($employeeId);

                // ดึงวันหยุดในช่วง
                $holidays = $checkIn->query(
                    "SELECT * FROM `hrm_holidays` 
                     WHERE `holiday_date` BETWEEN :start AND :end 
                       AND `is_active` = 1
                     ORDER BY `holiday_date`",
                    ['start' => $history['cycle_start'], 'end' => $history['cycle_end']]
                );

                jsonSuccess([
                    'history'  => $history,
                    'shift'    => $shift,
                    'holidays' => $holidays,
                ]);
                break;

            default:
                jsonError('CheckIn route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // REQUESTS — /api/core/requests/*
    // ─────────────────────────────────
    case 'requests':
        $decoded = requireAuth();
        $reqModel = new Requests($pdo);
        $employeeId = $reqModel->getEmployeeId($decoded->sub);

        if (!$employeeId) {
            jsonError('ไม่พบข้อมูลพนักงาน', 'EMPLOYEE_NOT_FOUND', 404);
        }

        $subRoute = $segments[1] ?? '';

        switch ($subRoute) {
            // GET /api/core/requests — ดึงคำร้องทั้งหมด
            case '':
            case 'list':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

                $filters = [
                    'type'   => $_GET['type'] ?? null,
                    'status' => $_GET['status'] ?? null,
                    'limit'  => $_GET['limit'] ?? 50,
                ];

                $requests = $reqModel->getMyRequests($employeeId, $filters);
                jsonSuccess(['requests' => $requests]);
                break;

            // POST /api/core/requests/leave — ขอลา
            case 'leave':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                try {
                    $id = $reqModel->createLeave($employeeId, $body);
                    jsonSuccess(['id' => $id], 'ส่งคำร้องขอลาสำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'VALIDATION_ERROR', 400);
                }
                break;

            // POST /api/core/requests/ot — ขอ OT
            case 'ot':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                try {
                    $id = $reqModel->createOT($employeeId, $body);
                    jsonSuccess(['id' => $id], 'ส่งคำร้องขอ OT สำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'VALIDATION_ERROR', 400);
                }
                break;

            // POST /api/core/requests/time-correction — แก้เวลา
            case 'time-correction':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                try {
                    $id = $reqModel->createTimeCorrection($employeeId, $body);
                    jsonSuccess(['id' => $id], 'ส่งคำร้องแก้เวลาสำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'VALIDATION_ERROR', 400);
                }
                break;

            // POST /api/core/requests/shift-swap — สลับกะ
            case 'shift-swap':
                if ($method !== 'POST') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                try {
                    $id = $reqModel->createShiftSwap($employeeId, $body);
                    jsonSuccess(['id' => $id], 'ส่งคำร้องสลับกะสำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'VALIDATION_ERROR', 400);
                }
                break;

            // PUT /api/core/requests/{id}/cancel — ยกเลิกคำร้อง
            case (preg_match('/^(\d+)$/', $subRoute) ? $subRoute : '___NO_MATCH___'):
                $requestId = (int)$subRoute;
                $subAction = $segments[2] ?? '';

                if ($subAction === 'cancel') {
                    if ($method !== 'PUT') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                    $body = getJsonBody();
                    $type = $body['type'] ?? '';

                    try {
                        $reqModel->cancelRequest($requestId, $type, $employeeId);
                        jsonSuccess(null, 'ยกเลิกคำร้องสำเร็จ');
                    } catch (\RuntimeException $e) {
                        jsonError($e->getMessage(), 'CANCEL_ERROR', 400);
                    }
                } else {
                    jsonError('Route not found', 'NOT_FOUND', 404);
                }
                break;

            // GET /api/core/requests/leave-types — ประเภทการลา
            case 'leave-types':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $types = $reqModel->getLeaveTypes();
                jsonSuccess(['leave_types' => $types]);
                break;

            // GET /api/core/requests/leave-quotas?year=2026 — สิทธิ์วันลา
            case 'leave-quotas':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $year = (int)($_GET['year'] ?? date('Y'));
                $quotas = $reqModel->getLeaveQuotas($employeeId, $year);
                jsonSuccess(['quotas' => $quotas]);
                break;

            default:
                jsonError('Requests route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // PROFILE — /api/core/profile/*
    // ─────────────────────────────────
    case 'profile':
        $decoded = requireAuth();
        $profileModel = new Profile($pdo);
        $userId = (int)$decoded->sub;

        $subRoute = $segments[1] ?? '';

        switch ($subRoute) {
            // GET /api/core/profile — ข้อมูล profile เต็ม
            case '':
            case 'index':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $profile = $profileModel->getFullProfile($userId);
                if (!$profile) jsonError('ไม่พบข้อมูลผู้ใช้', 'NOT_FOUND', 404);
                jsonSuccess($profile);
                break;

            // PUT /api/core/profile/contact — แก้เบอร์/email
            case 'contact':
                if ($method !== 'PUT') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                try {
                    $profileModel->updateContact($userId, $body);
                    jsonSuccess(null, 'อัปเดตข้อมูลติดต่อสำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'VALIDATION_ERROR', 400);
                }
                break;

            // PUT /api/core/profile/password — เปลี่ยนรหัสผ่าน
            case 'password':
                if ($method !== 'PUT') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $body = getJsonBody();

                $error = validateRequired($body, ['current_password', 'new_password']);
                if ($error) jsonError($error, 'VALIDATION_ERROR');

                try {
                    $profileModel->changePassword($userId, $body['current_password'], $body['new_password']);
                    jsonSuccess(null, 'เปลี่ยนรหัสผ่านสำเร็จ');
                } catch (\RuntimeException $e) {
                    jsonError($e->getMessage(), 'PASSWORD_ERROR', 400);
                }
                break;

            // GET /api/core/profile/leave-history?year=2026
            case 'leave-history':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $employeeId = $profileModel->getEmployeeId($userId);
                if (!$employeeId) jsonError('ไม่พบข้อมูลพนักงาน', 'EMPLOYEE_NOT_FOUND', 404);

                $year = (int)($_GET['year'] ?? date('Y'));
                $history = $profileModel->getLeaveHistory($employeeId, $year);
                jsonSuccess(['leave_history' => $history]);
                break;

            // GET /api/core/profile/ot-history?year=2026
            case 'ot-history':
                if ($method !== 'GET') jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                $employeeId = $profileModel->getEmployeeId($userId);
                if (!$employeeId) jsonError('ไม่พบข้อมูลพนักงาน', 'EMPLOYEE_NOT_FOUND', 404);

                $year = (int)($_GET['year'] ?? date('Y'));
                $history = $profileModel->getOTHistory($employeeId, $year);
                jsonSuccess(['ot_history' => $history]);
                break;

            // POST /api/core/profile/avatar — อัปโหลดรูปโปรไฟล์ → Google Drive
            case 'avatar':
                if ($method === 'POST') {
                    if (empty($_FILES['avatar'])) jsonError('กรุณาแนบรูป', 'VALIDATION', 422);

                    $file = $_FILES['avatar'];
                    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                    if (!in_array($file['type'], $allowed)) {
                        jsonError('รองรับเฉพาะไฟล์ภาพ (JPEG, PNG, WebP, GIF)', 'VALIDATION', 422);
                    }
                    if ($file['size'] > 5 * 1024 * 1024) {
                        jsonError('ขนาดไฟล์ต้องไม่เกิน 5MB', 'VALIDATION', 422);
                    }

                    $avatarUrl = '';

                    // Try Google Drive first
                    $gdriveHelper = __DIR__ . '/../gdrive_helper.php';
                    if (file_exists($gdriveHelper)) {
                        try {
                            require_once $gdriveHelper;
                            $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
                            $fileName = 'avatar_' . $userId . '_' . time() . '.' . $ext;
                            $avatarUrl = gdrive_uploadFile($file['tmp_name'], $fileName, ['PROFILE', 'avatars']);

                            // Delete old avatar from GDrive if exists
                            $oldAvatar = $profileModel->getAvatarUrl($userId);
                            if ($oldAvatar && str_starts_with($oldAvatar, 'gdrive://')) {
                                try { gdrive_deleteFile($oldAvatar); } catch (Exception $e) {}
                            }
                        } catch (Exception $e) {
                            error_log('GDrive avatar upload failed: ' . $e->getMessage());
                            $avatarUrl = '';
                        }
                    }

                    // Fallback: local storage
                    if (empty($avatarUrl)) {
                        $uploadDir = __DIR__ . '/../uploads/avatars/';
                        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                        $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
                        $newName = 'avatar_' . $userId . '_' . time() . '.' . $ext;
                        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $newName)) {
                            jsonError('อัปโหลดรูปไม่สำเร็จ', 'UPLOAD_ERROR', 500);
                        }
                        $avatarUrl = '/v3_1/backend/uploads/avatars/' . $newName;
                    }

                    // Update DB
                    $profileModel->updateAvatarUrl($userId, $avatarUrl);

                    // Return viewable URL
                    $viewUrl = $avatarUrl;
                    if (str_starts_with($avatarUrl, 'gdrive://')) {
                        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
                        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                        $viewUrl = $protocol . $host . '/v3_1/backend/api/core/profile/avatar/view';
                    }

                    jsonSuccess(['avatar_url' => $viewUrl], 'อัปโหลดรูปโปรไฟล์สำเร็จ');
                } elseif ($method === 'GET') {
                    // GET /api/core/profile/avatar — redirect to view
                    $subAction = $segments[2] ?? '';
                    if ($subAction === 'view') {
                        // Stream avatar from GDrive or local
                        $avatarUrl = $profileModel->getAvatarUrl($userId);
                        if (!$avatarUrl) jsonError('ไม่มีรูปโปรไฟล์', 'NOT_FOUND', 404);

                        if (str_starts_with($avatarUrl, 'gdrive://')) {
                            require_once __DIR__ . '/../gdrive_helper.php';
                            gdrive_streamFile($avatarUrl);
                            exit;
                        } else {
                            // Local file or external URL
                            $fullPath = $_SERVER['DOCUMENT_ROOT'] . $avatarUrl;
                            if (file_exists($fullPath)) {
                                header('Content-Type: ' . (mime_content_type($fullPath) ?: 'image/jpeg'));
                                readfile($fullPath);
                                exit;
                            }
                            jsonError('ไม่พบไฟล์รูป', 'NOT_FOUND', 404);
                        }
                    }
                    jsonError('Route not found', 'NOT_FOUND', 404);
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            default:
                jsonError('Profile route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // SETTINGS — /api/core/settings/*
    // ─────────────────────────────────
    case 'settings':
        $decoded = requireAdmin();
        $userId = $decoded->sub;
        $settingsModel = new Settings($pdo);
        $settingsSub = $segments[1] ?? '';
        $settingsId = isset($segments[2]) ? (int)$segments[2] : null;
        $settingsAction = $segments[3] ?? '';

        switch ($settingsSub) {
            // ── Companies ──
            case 'companies':
                if ($method === 'GET' && !$settingsId) {
                    jsonSuccess(['companies' => $settingsModel->getCompanies()]);
                } elseif ($method === 'GET' && $settingsId) {
                    $company = $settingsModel->getCompany($settingsId);
                    if (!$company) jsonError('ไม่พบบริษัท', 'NOT_FOUND', 404);
                    jsonSuccess(['company' => $company]);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateCompany($settingsId, $body);
                    jsonSuccess(null, 'อัปเดตบริษัทสำเร็จ');
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Branches ──
            case 'branches':
                if ($method === 'GET' && !$settingsId) {
                    $companyId = isset($_GET['company_id']) ? (int)$_GET['company_id'] : null;
                    jsonSuccess(['branches' => $settingsModel->getBranches($companyId)]);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateBranch($settingsId, $body);
                    jsonSuccess(null, 'อัปเดตสาขาสำเร็จ');
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Departments ──
            case 'departments':
                if ($method === 'GET') {
                    jsonSuccess(['departments' => $settingsModel->getDepartments()]);
                } elseif ($method === 'POST') {
                    $body = getJsonBody();
                    if (empty($body['name'])) jsonError('กรุณาระบุชื่อแผนก', 'VALIDATION', 422);
                    $id = $settingsModel->createDepartment($body);
                    jsonSuccess(['id' => $id], 'สร้างแผนกสำเร็จ', 201);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateDepartment($settingsId, $body);
                    jsonSuccess(null, 'อัปเดตแผนกสำเร็จ');
                } elseif ($method === 'DELETE' && $settingsId) {
                    try {
                        $settingsModel->deleteDepartment($settingsId);
                        jsonSuccess(null, 'ลบแผนกสำเร็จ');
                    } catch (\Exception $e) {
                        jsonError($e->getMessage(), 'FK_CONSTRAINT', 409);
                    }
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Roles ──
            case 'roles':
                if ($method === 'GET') {
                    jsonSuccess(['roles' => $settingsModel->getRoles()]);
                } elseif ($method === 'POST') {
                    $body = getJsonBody();
                    if (empty($body['name_th'])) jsonError('กรุณาระบุชื่อตำแหน่ง', 'VALIDATION', 422);
                    $id = $settingsModel->createRole($body);
                    jsonSuccess(['id' => $id], 'สร้างตำแหน่งสำเร็จ', 201);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateRole($settingsId, $body);
                    jsonSuccess(null, 'อัปเดตตำแหน่งสำเร็จ');
                } elseif ($method === 'DELETE' && $settingsId) {
                    try {
                        $settingsModel->deleteRole($settingsId);
                        jsonSuccess(null, 'ลบตำแหน่งสำเร็จ');
                    } catch (\Exception $e) {
                        jsonError($e->getMessage(), 'FK_CONSTRAINT', 409);
                    }
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Levels ──
            case 'levels':
                if ($method === 'GET') {
                    jsonSuccess(['levels' => $settingsModel->getLevels()]);
                } elseif ($method === 'POST') {
                    $body = getJsonBody();
                    if (empty($body['role_id'])) jsonError('กรุณาเลือก Role', 'VALIDATION', 422);
                    $id = $settingsModel->createLevel($body);
                    jsonSuccess(['id' => $id], 'สร้าง Level สำเร็จ', 201);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateLevel($settingsId, $body);
                    jsonSuccess(null, 'อัปเดต Level สำเร็จ');
                } elseif ($method === 'DELETE' && $settingsId) {
                    try {
                        $settingsModel->deleteLevel($settingsId);
                        jsonSuccess(null, 'ลบ Level สำเร็จ');
                    } catch (\Exception $e) {
                        jsonError($e->getMessage(), 'FK_CONSTRAINT', 409);
                    }
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── System Config ──
            case 'system-config':
                if ($method === 'GET') {
                    jsonSuccess(['config' => $settingsModel->getSystemConfig()]);
                } elseif ($method === 'PUT') {
                    $body = getJsonBody();
                    if (empty($body['items'])) jsonError('กรุณาส่งข้อมูล', 'VALIDATION', 422);
                    $count = $settingsModel->updateSystemConfig($body['items'], $userId);
                    jsonSuccess(['updated' => $count], 'อัปเดตค่าคงที่สำเร็จ');
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Admin Users ──
            case 'admin-users':
                if ($method === 'GET') {
                    $search = $_GET['search'] ?? null;
                    if ($search) {
                        jsonSuccess(['users' => $settingsModel->searchUsers($search)]);
                    } else {
                        jsonSuccess(['admins' => $settingsModel->getAdminUsers()]);
                    }
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    try {
                        $settingsModel->toggleAdmin($settingsId, (bool)($body['is_admin'] ?? false), $userId);
                        jsonSuccess(null, 'อัปเดตสิทธิ์ Admin สำเร็จ');
                    } catch (\Exception $e) {
                        jsonError($e->getMessage(), 'FORBIDDEN', 403);
                    }
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── Permission Matrix ──
            case 'permissions':
                $permAction = $segments[2] ?? '';
                if ($permAction === 'matrix' && $method === 'GET') {
                    jsonSuccess($settingsModel->getPermissionMatrix());
                } elseif ($permAction === 'matrix' && $method === 'PUT') {
                    $body = getJsonBody();
                    if (empty($body['level_id'])) jsonError('กรุณาเลือก Level', 'VALIDATION', 422);
                    $settingsModel->savePermissionMatrix((int)$body['level_id'], $body['page_ids'] ?? []);
                    jsonSuccess(null, 'บันทึกสิทธิ์สำเร็จ');
                } else {
                    jsonError('Permission route not found', 'NOT_FOUND', 404);
                }
                break;

            // ── App Structure ──
            case 'app-structure':
                if ($method === 'GET') {
                    jsonSuccess(['structure' => $settingsModel->getAppStructure()]);
                } elseif ($method === 'POST') {
                    $body = getJsonBody();
                    if (empty($body['slug'])) jsonError('กรุณาระบุ slug', 'VALIDATION', 422);
                    $id = $settingsModel->createAppStructure($body);
                    jsonSuccess(['id' => $id], 'สร้างเมนูสำเร็จ', 201);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateAppStructure($settingsId, $body);
                    jsonSuccess(null, 'อัปเดตเมนูสำเร็จ');
                } elseif ($method === 'DELETE' && $settingsId) {
                    try {
                        $settingsModel->deleteAppStructure($settingsId);
                        jsonSuccess(null, 'ลบเมนูสำเร็จ');
                    } catch (\Exception $e) {
                        jsonError($e->getMessage(), 'FK_CONSTRAINT', 409);
                    }
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            // ── App Actions ──
            case 'app-actions':
                if ($method === 'GET') {
                    $pageId = isset($_GET['page_id']) ? (int)$_GET['page_id'] : null;
                    jsonSuccess(['actions' => $settingsModel->getAppActions($pageId)]);
                } elseif ($method === 'POST') {
                    $body = getJsonBody();
                    if (empty($body['page_id']) || empty($body['code'])) {
                        jsonError('กรุณาระบุ page_id และ code', 'VALIDATION', 422);
                    }
                    $id = $settingsModel->createAppAction($body);
                    jsonSuccess(['id' => $id], 'สร้าง Action สำเร็จ', 201);
                } elseif ($method === 'PUT' && $settingsId) {
                    $body = getJsonBody();
                    $settingsModel->updateAppAction($settingsId, $body);
                    jsonSuccess(null, 'อัปเดต Action สำเร็จ');
                } elseif ($method === 'DELETE' && $settingsId) {
                    $settingsModel->deleteAppAction($settingsId);
                    jsonSuccess(null, 'ลบ Action สำเร็จ');
                } else {
                    jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
                }
                break;

            default:
                jsonError('Settings route not found', 'NOT_FOUND', 404);
        }
        break;

    // ─────────────────────────────────
    // DEFAULT
    // ─────────────────────────────────
    default:
        jsonError('Route not found: /api/core/' . $route, 'NOT_FOUND', 404);
}
