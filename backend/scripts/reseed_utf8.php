<?php

/**
 * Re-seed data with proper UTF-8 encoding
 * เพราะ cmd /c mysql < file.sql ใช้ charset ผิด
 */
require_once __DIR__ . '/../config/config.php';

echo "=== Re-seeding data with UTF-8 ===\n\n";

// ปิด FK checks
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// ========================================
// 1. ล้างข้อมูลเก่า (reverse order for FK)
// ========================================
$tables = [
    'core_level_permissions',
    'core_system_config',
    'core_app_structure',
    'hrm_employees',
    'core_users',
    'core_levels',
    'core_department_roles',
    'core_roles',
    'core_company_departments',
    'core_departments',
    'core_branches',
    'core_companies',
];

foreach ($tables as $t) {
    $pdo->exec("TRUNCATE TABLE `{$t}`");
    echo "Truncated: {$t}\n";
}

// ========================================
// 2. Companies
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_companies (code, name_th, name_en, company_type, type) VALUES (?, ?, ?, ?, ?)");
$companies = [
    ['SDR', 'สยามเดลิเวอรี่ เซอร์วิส', 'Siam Delivery Service', 'CAR_RENTAL', 'HEADQUARTER'],
    ['SXD', 'เอสเอ็กซ์ดี เอ็กซ์เพรส', 'SXD Express', 'DHL', 'SUBSIDIARY'],
    ['SPD', 'เอสพีดี เอ็กซ์เพรส', 'SPD Express', 'DHL', 'SUBSIDIARY'],
    ['SAR', 'สยามออโตเรนทัล', 'Siam Auto Rental', 'CAR_RENTAL', 'SUBSIDIARY'],
];
foreach ($companies as $c) {
    $stmt->execute($c);
}
echo "\nCompanies: " . count($companies) . " rows\n";

// ========================================
// 3. Branches
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_branches (company_id, code, name_th, name_en, latitude, longitude, check_radius) VALUES (?, ?, ?, ?, ?, ?, ?)");
$branches = [
    [1, 'SDR-HQ', 'สำนักงานใหญ่ SDR', 'SDR Head Office', 13.7563, 100.5018, 200],
    [2, 'SXD-BKK', 'SXD กรุงเทพ', 'SXD Bangkok', 13.7563, 100.5018, 200],
    [2, 'SXD-CNX', 'SXD เชียงใหม่', 'SXD Chiang Mai', 18.7883, 98.9853, 300],
    [3, 'SPD-BKK', 'SPD กรุงเทพ', 'SPD Bangkok', 13.7563, 100.5018, 200],
    [4, 'SAR-HQ', 'สำนักงานใหญ่ SAR', 'SAR Head Office', 13.7563, 100.5018, 200],
];
foreach ($branches as $b) {
    $stmt->execute($b);
}
echo "Branches: " . count($branches) . " rows\n";

// ========================================
// 4. Departments
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_departments (name, name_en) VALUES (?, ?)");
$depts = [
    ['ผู้บริหาร', 'Executive'],
    ['บัญชี', 'Accounting'],
    ['ทรัพยากรบุคคล', 'Human Resources'],
    ['ปฏิบัติการ', 'Operations'],
    ['ขาย', 'Sales'],
    ['ไอที', 'IT'],
    ['คลังสินค้า', 'Warehouse'],
];
foreach ($depts as $d) {
    $stmt->execute($d);
}
echo "Departments: " . count($depts) . " rows\n";

// ========================================
// 5. Company ↔ Department
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_company_departments (company_id, department_id) VALUES (?, ?)");
$cd = [
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [2, 6],
    [2, 7],
    [3, 1],
    [3, 2],
    [3, 3],
    [3, 4],
    [3, 5],
    [3, 6],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4],
    [4, 5],
    [4, 6],
];
foreach ($cd as $r) {
    $stmt->execute($r);
}
echo "Company-Departments: " . count($cd) . " rows\n";

// ========================================
// 6. Roles
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_roles (name_th, name_en) VALUES (?, ?)");
$roles = [
    ['ผู้บริหาร', 'Executive'],
    ['ผู้จัดการ', 'Manager'],
    ['หัวหน้างาน', 'Supervisor'],
    ['พนักงาน', 'Staff'],
];
foreach ($roles as $r) {
    $stmt->execute($r);
}
echo "Roles: " . count($roles) . " rows\n";

// ========================================
// 7. Department ↔ Role
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_department_roles (department_id, role_id) VALUES (?, ?)");
$dr = [
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [3, 3],
    [3, 4],
    [4, 2],
    [4, 3],
    [4, 4],
    [5, 2],
    [5, 3],
    [5, 4],
    [6, 2],
    [6, 3],
    [6, 4],
    [7, 3],
    [7, 4],
];
foreach ($dr as $r) {
    $stmt->execute($r);
}
echo "Dept-Roles: " . count($dr) . " rows\n";

// ========================================
// 8. Levels
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_levels (role_id, level_score, name, description) VALUES (?, ?, ?, ?)");
$levels = [
    [1, 1, 'กรรมการผู้จัดการ (MD)', 'ระดับสูงสุด'],
    [1, 2, 'รองกรรมการผู้จัดการ', 'รอง MD'],
    [2, 3, 'ผู้จัดการฝ่าย', 'จัดการทั้งฝ่าย'],
    [2, 4, 'ผู้ช่วยผู้จัดการ', 'ช่วยจัดการ'],
    [3, 5, 'หัวหน้าสาขา', 'ดูแลสาขา'],
    [3, 6, 'หัวหน้างาน', 'ดูแลทีม'],
    [4, 7, 'พนักงานอาวุโส', 'ประสบการณ์สูง'],
    [4, 8, 'พนักงาน', 'ระดับปฏิบัติการ'],
];
foreach ($levels as $l) {
    $stmt->execute($l);
}
echo "Levels: " . count($levels) . " rows\n";

// ========================================
// 9. Admin User
// ========================================
$hash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);
$stmt = $pdo->prepare("INSERT INTO core_users (username, password_hash, first_name_th, last_name_th, first_name_en, last_name_en, nickname, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(['admin', $hash, 'แอดมิน', 'ระบบ', 'Admin', 'System', 'Admin', 1]);
echo "Users: 1 row (admin)\n";

// ========================================
// 10. Admin Employee
// ========================================
$stmt = $pdo->prepare("INSERT INTO hrm_employees (user_id, employee_code, company_id, branch_id, level_id, status, start_date, salary_type, base_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([1, 'ADM001', 1, 1, 1, 'FULL_TIME', '2024-01-01', 'MONTHLY', 0]);
echo "Employees: 1 row (ADM001)\n";

// ========================================
// 11. App Structure (เมนู)
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_app_structure (slug, name_th, name_en, icon, parent_id, type, module, route, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$menus = [
    // Systems
    ['MAIN', 'ระบบหลัก', 'Main System', 'Dashboard', null, 'SYSTEM', 'CORE', null, 1],
    ['HRM', 'ระบบ HR', 'HR Management', 'People', null, 'SYSTEM', 'HRM', null, 2],
    ['PAY', 'ระบบเงินเดือน', 'Payroll', 'AccountBalance', null, 'SYSTEM', 'PAY', null, 3],
    ['ACC_MAIN', 'ระบบบัญชี', 'Accounting', 'Receipt', null, 'SYSTEM', 'ACC', '/acc', 4],
    ['SETTINGS', 'ตั้งค่า', 'Settings', 'Settings', null, 'SYSTEM', 'CORE', null, 99],
    // MAIN Pages
    ['DASHBOARD', 'แดชบอร์ด', 'Dashboard', 'SpaceDashboard', 1, 'PAGE', 'CORE', '/dashboard', 1],
    ['CHECKIN', 'ลงเวลา', 'Check In/Out', 'AccessTime', 1, 'PAGE', 'CORE', '/checkin', 2],
    ['REQUESTS', 'คำร้อง', 'Requests', 'Assignment', 1, 'PAGE', 'CORE', '/requests', 3],
    ['PROFILE', 'โปรไฟล์', 'Profile', 'Person', 1, 'PAGE', 'CORE', '/profile', 4],
    // HRM Pages
    ['HRM_EMPLOYEES', 'จัดการพนักงาน', 'Employees', 'Group', 2, 'PAGE', 'HRM', '/hrm/employees', 1],
    ['HRM_TIME_REPORT', 'รายงานเวลา', 'Time Report', 'Schedule', 2, 'PAGE', 'HRM', '/hrm/time-report', 2],
    ['HRM_SCHEDULES', 'ตารางกะ', 'Schedules', 'CalendarMonth', 2, 'PAGE', 'HRM', '/hrm/schedules', 3],
    ['HRM_HOLIDAYS', 'วันหยุด', 'Holidays', 'Event', 2, 'PAGE', 'HRM', '/hrm/holidays', 4],
    ['HRM_LEAVE_MGMT', 'จัดการสิทธิ์ลา', 'Leave Management', 'EventBusy', 2, 'PAGE', 'HRM', '/hrm/leave-mgmt', 5],
    ['HRM_APPROVALS', 'อนุมัติคำร้อง', 'Approvals', 'FactCheck', 2, 'PAGE', 'HRM', '/hrm/approvals', 6],
    ['HRM_EVALUATION', 'ประเมินผลงาน', 'Evaluation', 'Star', 2, 'PAGE', 'HRM', '/hrm/evaluation', 7],
    ['HRM_REPORTS', 'รายงานสรุป', 'Reports', 'BarChart', 2, 'PAGE', 'HRM', '/hrm/reports', 8],
    // Settings Pages
    ['SET_COMPANY', 'บริษัท', 'Companies', 'Business', 5, 'PAGE', 'CORE', '/settings/company', 1],
    ['SET_BRANCH', 'สาขา', 'Branches', 'Store', 5, 'PAGE', 'CORE', '/settings/branch', 2],
    ['SET_ORG', 'โครงสร้างองค์กร', 'Organization', 'AccountTree', 5, 'PAGE', 'CORE', '/settings/org', 3],
    ['SET_PERMISSION', 'สิทธิ์การเข้าถึง', 'Permissions', 'Security', 5, 'PAGE', 'CORE', '/settings/permission', 4],
    ['SET_MENU', 'โครงสร้างเมนู', 'Menu Structure', 'Menu', 5, 'PAGE', 'CORE', '/settings/menu', 5],
    ['SET_CONFIG', 'ค่าระบบ', 'System Config', 'Tune', 5, 'PAGE', 'CORE', '/settings/config', 6],
    ['SET_ADMIN', 'ผู้ดูแลระบบ', 'Admin Users', 'AdminPanelSettings', 5, 'PAGE', 'CORE', '/settings/admin', 7],
];
foreach ($menus as $m) {
    $stmt->execute($m);
}
echo "App Structure: " . count($menus) . " rows\n";

// ========================================
// 12. Level Permissions
// ========================================
// Admin (level 1) → ทุกหน้า
$ids = $pdo->query("SELECT id FROM core_app_structure WHERE is_active = 1")->fetchAll(PDO::FETCH_COLUMN);
$stmt = $pdo->prepare("INSERT INTO core_level_permissions (level_id, app_structure_id) VALUES (?, ?)");
foreach ($ids as $id) {
    $stmt->execute([1, $id]);
}

// พนักงาน (level 8) → หน้าพื้นฐาน
$basicIds = $pdo->query("SELECT id FROM core_app_structure WHERE slug IN ('MAIN','DASHBOARD','CHECKIN','REQUESTS','PROFILE')")->fetchAll(PDO::FETCH_COLUMN);
foreach ($basicIds as $id) {
    $stmt->execute([8, $id]);
}
echo "Level Permissions: " . (count($ids) + count($basicIds)) . " rows\n";

// ========================================
// 13. System Config
// ========================================
$stmt = $pdo->prepare("INSERT INTO core_system_config (config_key, config_value, description, group_name, value_type) VALUES (?, ?, ?, ?, ?)");
$configs = [
    ['LOGIN_MAX_ATTEMPTS', '5', 'จำนวนครั้ง Login ผิดสูงสุดก่อนล็อก', 'SECURITY', 'NUMBER'],
    ['LOGIN_LOCK_MINUTES', '30', 'ระยะเวลาล็อก (นาที)', 'SECURITY', 'NUMBER'],
    ['SOCIAL_SECURITY_RATE', '5', 'อัตราประกันสังคม (%)', 'PAYROLL', 'NUMBER'],
    ['SOCIAL_SECURITY_MAX_SALARY', '15000', 'เพดานเงินเดือนสำหรับประกันสังคม', 'PAYROLL', 'NUMBER'],
    ['SOCIAL_SECURITY_MAX_DEDUCTION', '750', 'เพดานหักประกันสังคมสูงสุด (บาท)', 'PAYROLL', 'NUMBER'],
    ['PAYROLL_CYCLE_START', '21', 'วันเริ่มรอบเงินเดือน', 'PAYROLL', 'NUMBER'],
    ['PAYROLL_CYCLE_END', '20', 'วันสิ้นรอบเงินเดือน', 'PAYROLL', 'NUMBER'],
    ['PAYROLL_PAY_DAY', '1', 'วันจ่ายเงินเดือน', 'PAYROLL', 'NUMBER'],
    ['LATE_THRESHOLD_MINUTES', '15', 'สายเกินกี่นาทีถึงจะนับ (ต่อครั้ง)', 'HR', 'NUMBER'],
    ['LATE_MONTHLY_MAX_MINUTES', '30', 'สายรวมเกินกี่นาทีต่อเดือน', 'HR', 'NUMBER'],
    ['CHECK_IN_RADIUS_DEFAULT', '200', 'รัศมี Check-in เริ่มต้น (เมตร)', 'HR', 'NUMBER'],
    ['FILE_MAX_SIZE_MB', '10', 'ขนาดไฟล์สูงสุด (MB)', 'SYSTEM', 'NUMBER'],
    ['FILE_ALLOWED_TYPES', 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx', 'นามสกุลไฟล์ที่อนุญาต', 'SYSTEM', 'STRING'],
];
foreach ($configs as $c) {
    $stmt->execute($c);
}
echo "System Config: " . count($configs) . " rows\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n✅ Re-seed complete! ภาษาไทยถูกต้องผ่าน PDO + UTF-8\n";
