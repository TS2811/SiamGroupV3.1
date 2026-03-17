<?php

/**
 * SiamGroup V3.1 — ACC Module Router (Bridge)
 * 
 * Entry Point: /api/acc/*
 * 
 * ทำหน้าที่เป็น Bridge ระหว่าง V3.1 JWT Auth กับ ACC Backend เดิม
 * - รับ JWT Cookie จาก V3.1 Frontend
 * - แปลงเป็น user data format ที่ ACC api.php ต้องการ
 * - ส่งต่อไปยัง ACC api.php
 */

// ========================================
// 1. Load V3.1 Dependencies
// ========================================
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/CorsMiddleware.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// ========================================
// 2. Handle CORS
// ========================================
handleCors();

// ========================================
// 3. Parse route → ACC action
// ========================================
// V3.1 route style: /api/acc/{action}
// ACC API style:    ?action={action}
$route = getRoute(); // e.g. "get_expenses" or "create_expense"
$segments = array_filter(explode('/', $route));
$segments = array_values($segments);

// Map route to ACC action parameter
// Support both /api/acc/get_expenses and /api/acc/?action=get_expenses
$_GET['action'] = $segments[0] ?? ($_GET['action'] ?? '');

// Forward any extra path segments as GET params
if (isset($segments[1])) {
    $_GET['id'] = $segments[1];
}

// ========================================
// 4. ACC Auth Bridge — JWT → current_user()
// ========================================

/**
 * Bridge: แปลง V3.1 JWT Token เป็น user data format ของ ACC
 * 
 * ACC คาดหวัง user array ที่มี:
 * - id, username, company_id, branch_id, role_id, role_name, is_admin
 * - avatar_path, avatar_url
 * - permissions[] (module slugs)
 * - action_permissions[] (approval action names)
 */
function current_user(): ?array
{
    // 1. ลอง JWT (V3.1)
    $decoded = verifyAccessToken();

    if (!$decoded) {
        return null;
    }

    global $pdo;
    $userId = (int) $decoded->sub;

    // 2. Query user data ในรูปแบบที่ ACC ต้องการ
    $stmt = $pdo->prepare("
        SELECT 
            u.id,
            u.username,
            CONCAT(COALESCE(u.first_name_th, ''), ' ', COALESCE(u.last_name_th, '')) as name,
            u.first_name_th,
            u.last_name_th,
            u.first_name_en,
            u.last_name_en,
            u.email,
            u.is_admin,
            u.avatar_url,
            e.company_id,
            e.branch_id,
            e.level_id,
            l.level_score as level_score,
            r.id as role_id,
            r.name_th as role_name
        FROM core_users u
        LEFT JOIN hrm_employees e ON u.id = e.user_id AND e.status IN ('FULL_TIME', 'PROBATION')
        LEFT JOIN core_levels l ON e.level_id = l.id
        LEFT JOIN core_roles r ON l.role_id = r.id
        WHERE u.id = ? AND u.is_active = 1
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        return null;
    }

    // 3. Cast types (ACC expects integers)
    $user['id'] = (int) $user['id'];
    $user['company_id'] = $user['company_id'] ? (int) $user['company_id'] : null;
    $user['branch_id'] = $user['branch_id'] ? (int) $user['branch_id'] : null;
    $user['role_id'] = $user['role_id'] ? (int) $user['role_id'] : null;
    $user['level_id'] = $user['level_id'] ? (int) $user['level_id'] : null;
    $user['is_admin'] = (int) $user['is_admin'];

    // 4. Map admin/level → ACC role_name (ACC ใช้ role_name สำหรับ permission)
    if ($user['is_admin']) {
        $user['role_name'] = 'Admin';
    }

    // 5. Avatar URL — core_users already stores full avatar_url
    if (empty($user['avatar_url'])) {
        $user['avatar_url'] = null;
    }
    // Keep avatar_path alias for ACC compatibility
    $user['avatar_path'] = $user['avatar_url'];

    // 6. ACC Permissions (module slugs)
    $user['permissions'] = getAccPermissions($pdo, $user);

    // 7. ACC Action Permissions
    $user['action_permissions'] = getAccActionPermissions($pdo, $user);

    return $user;
}

/**
 * ดึง ACC module permissions สำหรับ user
 * Admin/Programmer → ได้ทุก module
 */
function getAccPermissions(PDO $conn, array $user): array
{
    // Admin gets all permissions
    if ($user['is_admin'] || in_array($user['role_name'], ['Admin', 'Programmer'])) {
        try {
            $stmt = $conn->prepare("SELECT module_slug FROM v3_system_modules WHERE is_active = 1");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (PDOException $e) {
            // Table might not exist yet — return all ACC defaults
            return [
                'acc_view_easy_fill',
                'acc_expense_create',
                'acc_approval_unified',
                'acc_approval_tab_draft',
                'acc_view_expense_dashboard',
                'acc_view_group_dashboard',
                'acc_payment_run_create',
                'acc_payment_run_approval',
                'acc_paid_history',
                'acc_fcash_refund',
                'acc_fcash_approval',
                'acc_clearing',
                'acc_reconciliation',
                'acc_reconciliation_history',
                'acc_settings',
                'acc_view_expense_report',
            ];
        }
    }

    // Base permissions for all users
    $permissions = ['acc_expense_create', 'acc_approval_unified', 'acc_approval_tab_draft'];

    if (!$user['role_id']) return $permissions;

    // Query role-based permissions
    try {
        $stmt = $conn->prepare("
            SELECT DISTINCT m.module_slug
            FROM v3_role_module_access rma
            JOIN v3_system_modules m ON rma.module_id = m.id
            WHERE rma.role_id = ? AND m.is_active = 1
        ");
        $stmt->execute([$user['role_id']]);
        $dbPerms = $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
        $permissions = array_unique(array_merge($permissions, $dbPerms));
    } catch (PDOException $e) {
        // Table might not exist
    }

    return array_values($permissions);
}

/**
 * ดึง ACC action permissions (approval actions)
 */
function getAccActionPermissions(PDO $conn, array $user): array
{
    if (!$user['role_id']) return [];

    try {
        $stmt = $conn->prepare("
            SELECT DISTINCT action_name 
            FROM v3_acc_approval_rules 
            WHERE role_id = ? AND is_active = 1
        ");
        $stmt->execute([$user['role_id']]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
    } catch (PDOException $e) {
        return [];
    }
}

// ========================================
// 5. ACC-specific helper: get_user_access_ids
// ========================================
// NOTE: get_user_access_ids() is defined in api.php (V2 original)
// ไม่ต้อง define ซ้ำที่นี่ เพราะ api.php จะถูก require ต่อไป


// ========================================
// 6. Set globals for ACC api.php compatibility
// ========================================
$conn = $pdo;  // ACC uses $conn
$current_user = current_user();
$method = $_SERVER['REQUEST_METHOD'];

// ACC public actions (don't require auth)
$action = $_GET['action'] ?? '';
$public_actions = ['test_db', 'check_function'];

if (!$current_user && !in_array($action, $public_actions) && $action !== '') {
    http_response_code(401);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

// Set content type
header("Content-Type: application/json; charset=UTF-8");

// ========================================
// 7. Include ACC API (functions + router)
// ========================================
// api.php มี guard: if (!isset($conn)) → ข้าม setup เดิม
// เพราะ $conn, $current_user, $method, $action ถูก set ไว้แล้วที่นี่
require __DIR__ . '/api.php';
