<?php

/**
 * SiamGroup V3.1 — HRM Module Router
 * 
 * Entry Point: /api/hrm/*
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
require_once __DIR__ . '/../core/models/BaseModel.php';
require_once __DIR__ . '/models/HrmEmployee.php';
require_once __DIR__ . '/models/HrmTimeReport.php';
require_once __DIR__ . '/models/HrmSchedule.php';
require_once __DIR__ . '/models/HrmApproval.php';

// ========================================
// 4. Route Handling
// ========================================
$route  = getRoute();
$method = getMethod();
$parts  = explode('/', $route);
$resource   = $parts[0] ?? '';
$resourceId = isset($parts[1]) && is_numeric($parts[1]) ? (int) $parts[1] : null;
$action     = $parts[2] ?? ($parts[1] ?? '');
$actionId   = isset($parts[3]) && is_numeric($parts[3]) ? (int) $parts[3] : null;

// ========================================
// 5. Auth — ทุก HRM API ต้อง login
// ========================================
$user = requireAuth();

// ดึง employee ของ user ที่ login
// Note: $user เป็น stdClass จาก JWT decode — ใช้ ->sub เป็น user_id, ->adm เป็น is_admin
$empModel = new HrmEmployee($pdo);
$currentEmployee = $empModel->getByUserId($user->sub);

// ========================================
// 6. Main Router
// ========================================
switch ($resource) {

    // ═══════════════════════════════════════
    // EMPLOYEES
    // ═══════════════════════════════════════
    case 'employees':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/hrm/employees?company_id=&branch_id=&status=&search=
            $filters = [
                'company_id' => $_GET['company_id'] ?? null,
                'branch_id'  => $_GET['branch_id'] ?? null,
                'status'     => $_GET['status'] ?? null,
                'search'     => $_GET['search'] ?? null,
            ];
            $employees = $empModel->getEmployees($filters);
            jsonSuccess(['employees' => $employees]);
        } elseif ($method === 'GET' && $resourceId && $action === 'documents') {
            // GET /api/hrm/employees/{id}/documents
            $docs = $empModel->getDocuments($resourceId);
            jsonSuccess(['documents' => $docs]);
        } elseif ($method === 'GET' && $resourceId) {
            // GET /api/hrm/employees/{id}
            $emp = $empModel->getEmployee($resourceId);
            if (!$emp) jsonError('ไม่พบพนักงาน', 'NOT_FOUND', 404);
            jsonSuccess(['employee' => $emp]);
        } elseif ($method === 'POST' && !$resourceId) {
            // POST /api/hrm/employees — สร้างพนักงานใหม่
            $body = getJsonBody();
            $err = validateRequired($body, [
                'username',
                'first_name_th',
                'last_name_th',
                'employee_code',
                'company_id',
                'branch_id',
                'level_id',
                'start_date'
            ]);
            if ($err) jsonError($err, 'VALIDATION', 422);

            try {
                $id = $empModel->createEmployee($body);
                jsonSuccess(['id' => $id], 'สร้างพนักงานสำเร็จ', 201);
            } catch (\Exception $e) {
                jsonError($e->getMessage(), 'CREATE_ERROR', 400);
            }
        } elseif ($method === 'PUT' && $resourceId) {
            // PUT /api/hrm/employees/{id}
            $body = getJsonBody();
            try {
                $empModel->updateEmployee($resourceId, $body);
                jsonSuccess(null, 'อัปเดตพนักงานสำเร็จ');
            } catch (\Exception $e) {
                jsonError($e->getMessage(), 'UPDATE_ERROR', 400);
            }
        } elseif ($method === 'POST' && $resourceId && $action === 'documents') {
            // POST /api/hrm/employees/{id}/documents — Upload doc
            // NOTE: File upload ใช้ multipart/form-data
            if (empty($_FILES['file'])) jsonError('กรุณาแนบไฟล์', 'VALIDATION', 422);

            $file = $_FILES['file'];
            $uploadDir = __DIR__ . '/../uploads/documents/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $newName = 'doc_' . $resourceId . '_' . time() . '.' . $ext;
            $filePath = 'uploads/documents/' . $newName;

            if (!move_uploaded_file($file['tmp_name'], $uploadDir . $newName)) {
                jsonError('อัปโหลดไฟล์ไม่สำเร็จ', 'UPLOAD_ERROR', 500);
            }

            $docId = $empModel->createDocument([
                'employee_id'   => $resourceId,
                'document_type' => $_POST['document_type'] ?? 'OTHER',
                'file_name'     => $file['name'],
                'file_path'     => $filePath,
                'file_size'     => $file['size'],
                'mime_type'     => $file['type'],
                'description'   => $_POST['description'] ?? null,
                'uploaded_by'   => $user->sub,
            ]);
            jsonSuccess(['id' => $docId], 'อัปโหลดเอกสารสำเร็จ', 201);
        } elseif ($method === 'DELETE' && $resourceId && $action === 'documents' && $actionId) {
            // DELETE /api/hrm/employees/{id}/documents/{docId}
            $empModel->deleteDocument($actionId);
            jsonSuccess(null, 'ลบเอกสารสำเร็จ');
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // TIME REPORT
    // ═══════════════════════════════════════
    case 'time-report':
        $timeModel = new HrmTimeReport($pdo);
        $subAction = $resourceId ? (string) $resourceId : ($parts[1] ?? '');

        if ($method === 'GET' && $subAction === 'calendar') {
            // GET /api/hrm/time-report/calendar?year=2026&month=3&company_id=&branch_id=&search=
            $year  = (int) ($_GET['year']  ?? date('Y'));
            $month = (int) ($_GET['month'] ?? date('n'));
            $filters = [
                'company_id' => $_GET['company_id'] ?? null,
                'branch_id'  => $_GET['branch_id'] ?? null,
                'search'     => $_GET['search'] ?? null,
            ];
            $data = $timeModel->getCalendar($year, $month, $filters);
            jsonSuccess($data);
        } elseif ($method === 'GET' && $subAction === 'daily') {
            // GET /api/hrm/time-report/daily?employee_id=1&start=2026-02-21&end=2026-03-20
            $empId = (int) ($_GET['employee_id'] ?? 0);
            if (!$empId) jsonError('กรุณาระบุ employee_id', 'VALIDATION', 422);
            $start = $_GET['start'] ?? '';
            $end   = $_GET['end']   ?? '';
            if (!$start || !$end) jsonError('กรุณาระบุ start และ end', 'VALIDATION', 422);

            $data = $timeModel->getDailyBreakdown($empId, $start, $end);
            jsonSuccess($data);
        } elseif ($method === 'GET' && $subAction === 'summary') {
            // GET /api/hrm/time-report/summary?employee_id=1&start=&end=
            $empId = (int) ($_GET['employee_id'] ?? 0);
            if (!$empId) jsonError('กรุณาระบุ employee_id', 'VALIDATION', 422);
            $start = $_GET['start'] ?? '';
            $end   = $_GET['end']   ?? '';
            if (!$start || !$end) jsonError('กรุณาระบุ start และ end', 'VALIDATION', 422);

            $data = $timeModel->getSummary($empId, $start, $end);
            jsonSuccess($data);
        } elseif ($method === 'PUT' && $subAction === 'remarks') {
            // PUT /api/hrm/time-report/remarks
            $body = getJsonBody();
            $err = validateRequired($body, ['employee_id', 'date', 'remark']);
            if ($err) jsonError($err, 'VALIDATION', 422);

            $timeModel->upsertRemark(
                (int) $body['employee_id'],
                $body['date'],
                $body['remark'],
                $user->sub
            );
            jsonSuccess(null, 'บันทึก Remark สำเร็จ');
        } else {
            jsonError('Route not found', 'NOT_FOUND', 404);
        }
        break;

    // ═══════════════════════════════════════
    // SCHEDULES (กะ)
    // ═══════════════════════════════════════
    case 'schedules':
        $schedModel = new HrmSchedule($pdo);

        if ($method === 'GET' && $action === 'shifts') {
            // GET /api/hrm/schedules/shifts?company_id=
            $data = $schedModel->getShifts($_GET['company_id'] ?? null);
            jsonSuccess(['shifts' => $data]);
        } elseif ($method === 'POST' && $action === 'shifts') {
            // POST /api/hrm/schedules/shifts — สร้างกะใหม่
            $body = getJsonBody();
            $err = validateRequired($body, ['company_id', 'code', 'name_th', 'start_time', 'end_time']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $id = $schedModel->createShift($body);
            jsonSuccess(['id' => $id], 'สร้างกะสำเร็จ', 201);
        } elseif ($method === 'PUT' && $action === 'shifts' && $actionId) {
            // PUT /api/hrm/schedules/shifts/{id}
            $body = getJsonBody();
            $schedModel->updateShift($actionId, $body);
            jsonSuccess(null, 'อัปเดตกะสำเร็จ');
        } elseif ($method === 'GET' && $action === 'employee') {
            // GET /api/hrm/schedules/employee?employee_id=1
            $empId = (int) ($_GET['employee_id'] ?? 0);
            if (!$empId) jsonError('กรุณาระบุ employee_id', 'VALIDATION', 422);
            $data = $schedModel->getEmployeeShifts($empId);
            jsonSuccess(['shifts' => $data]);
        } elseif ($method === 'POST' && $action === 'assign') {
            // POST /api/hrm/schedules/assign
            $body = getJsonBody();
            $err = validateRequired($body, ['employee_id', 'shift_id', 'effective_date']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $id = $schedModel->assignShift($body);
            jsonSuccess(['id' => $id], 'กำหนดกะสำเร็จ', 201);
        } elseif ($method === 'POST' && $action === 'bulk') {
            // POST /api/hrm/schedules/bulk
            $body = getJsonBody();
            if (empty($body['employee_ids']) || empty($body['shift_id']) || empty($body['effective_date'])) {
                jsonError('กรุณาระบุ employee_ids, shift_id, effective_date', 'VALIDATION', 422);
            }
            $count = $schedModel->bulkAssignShift(
                $body['employee_ids'],
                (int) $body['shift_id'],
                $body['effective_date'],
                $body['end_date'] ?? null
            );
            jsonSuccess(['count' => $count], "กำหนดกะให้ {$count} คนสำเร็จ");
        } else {
            jsonError('Route not found', 'NOT_FOUND', 404);
        }
        break;

    // ═══════════════════════════════════════
    // HOLIDAYS (วันหยุด)
    // ═══════════════════════════════════════
    case 'holidays':
        $schedModel = new HrmSchedule($pdo);

        if ($method === 'GET') {
            $data = $schedModel->getHolidays(
                $_GET['company_id'] ?? null,
                $_GET['year'] ?? null
            );
            jsonSuccess(['holidays' => $data]);
        } elseif ($method === 'POST' && !$resourceId) {
            $body = getJsonBody();
            $err = validateRequired($body, ['company_id', 'holiday_date', 'name_th']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $id = $schedModel->createHoliday($body);
            jsonSuccess(['id' => $id], 'สร้างวันหยุดสำเร็จ', 201);
        } elseif ($method === 'PUT' && $resourceId) {
            $body = getJsonBody();
            $schedModel->updateHoliday($resourceId, $body);
            jsonSuccess(null, 'อัปเดตวันหยุดสำเร็จ');
        } elseif ($method === 'DELETE' && $resourceId) {
            $schedModel->deleteHoliday($resourceId);
            jsonSuccess(null, 'ลบวันหยุดสำเร็จ');
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // PERSONAL-OFF-DAYS (วันหยุดส่วนตัว)
    // ═══════════════════════════════════════
    case 'personal-off-days':
        $schedModel = new HrmSchedule($pdo);

        if ($method === 'GET') {
            $empId = (int) ($_GET['employee_id'] ?? 0);
            if (!$empId) jsonError('กรุณาระบุ employee_id', 'VALIDATION', 422);
            $data = $schedModel->getPersonalOffDays($empId, $_GET['start'] ?? null, $_GET['end'] ?? null);
            jsonSuccess(['off_days' => $data]);
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $err = validateRequired($body, ['employee_id', 'day_off_date']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $body['created_by'] = $user->sub;
            $id = $schedModel->createPersonalOffDay($body);
            jsonSuccess(['id' => $id], 'สร้างวันหยุดส่วนตัวสำเร็จ', 201);
        } elseif ($method === 'DELETE' && $resourceId) {
            $schedModel->deletePersonalOffDay($resourceId);
            jsonSuccess(null, 'ลบวันหยุดส่วนตัวสำเร็จ');
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // LEAVE-TYPES (ประเภทลา)
    // ═══════════════════════════════════════
    case 'leave-types':
        if ($method === 'GET') {
            $rows = (new BaseModel($pdo))->query(
                "SELECT * FROM hrm_leave_types WHERE is_active = 1 ORDER BY sort_order"
            );
            jsonSuccess(['leave_types' => $rows]);
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $err = validateRequired($body, ['code', 'name_th']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $stmt = $pdo->prepare(
                "INSERT INTO hrm_leave_types (code, name_th, name_en, max_days, requires_file, min_days_advance, is_paid, sort_order)
                 VALUES (:code, :name_th, :name_en, :max_days, :requires_file, :min_days_advance, :is_paid, :sort_order)"
            );
            $stmt->execute([
                'code'             => $body['code'],
                'name_th'          => $body['name_th'],
                'name_en'          => $body['name_en'] ?? null,
                'max_days'         => $body['max_days'] ?? null,
                'requires_file'    => $body['requires_file'] ?? 0,
                'min_days_advance' => $body['min_days_advance'] ?? 0,
                'is_paid'          => $body['is_paid'] ?? 1,
                'sort_order'       => $body['sort_order'] ?? 0,
            ]);
            jsonSuccess(['id' => (int) $pdo->lastInsertId()], 'สร้างประเภทลาสำเร็จ', 201);
        } elseif ($method === 'PUT' && $resourceId) {
            $body = getJsonBody();
            $allowed = ['name_th', 'name_en', 'max_days', 'requires_file', 'min_days_advance', 'is_paid', 'sort_order', 'is_active'];
            $sets = [];
            $params = ['_id' => $resourceId];
            foreach ($allowed as $col) {
                if (array_key_exists($col, $body)) {
                    $sets[] = "`{$col}` = :{$col}";
                    $params[$col] = $body[$col];
                }
            }
            if (!empty($sets)) {
                $pdo->prepare("UPDATE hrm_leave_types SET " . implode(', ', $sets) . " WHERE id = :_id")->execute($params);
            }
            jsonSuccess(null, 'อัปเดตประเภทลาสำเร็จ');
        } elseif ($method === 'DELETE' && $resourceId) {
            $pdo->prepare("UPDATE hrm_leave_types SET is_active = 0 WHERE id = :id")->execute(['id' => $resourceId]);
            jsonSuccess(null, 'ลบประเภทลาสำเร็จ');
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // LEAVE-QUOTAS (โควตาลา)
    // ═══════════════════════════════════════
    case 'leave-quotas':
        if ($method === 'GET') {
            $sql = "SELECT q.*, lt.name_th as leave_type_name, lt.code as leave_type_code,
                           e.employee_code, u.first_name_th, u.last_name_th
                    FROM hrm_employee_leave_quotas q
                    JOIN hrm_leave_types lt ON q.leave_type_id = lt.id
                    JOIN hrm_employees e ON q.employee_id = e.id
                    JOIN core_users u ON e.user_id = u.id
                    WHERE q.year = :year";
            $params = ['year' => $_GET['year'] ?? date('Y')];
            if (!empty($_GET['employee_id'])) {
                $sql .= " AND q.employee_id = :eid";
                $params['eid'] = $_GET['employee_id'];
            }
            $sql .= " ORDER BY e.employee_code, lt.sort_order";
            $rows = (new BaseModel($pdo))->query($sql, $params);
            jsonSuccess(['quotas' => $rows]);
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $err = validateRequired($body, ['employee_id', 'leave_type_id', 'year', 'quota_days']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $stmt = $pdo->prepare(
                "INSERT INTO hrm_employee_leave_quotas (employee_id, leave_type_id, year, quota_days, carried_days)
                 VALUES (:eid, :lt_id, :year, :quota, :carried)
                 ON DUPLICATE KEY UPDATE quota_days = :quota2, carried_days = :carried2"
            );
            $stmt->execute([
                'eid'      => $body['employee_id'],
                'lt_id'    => $body['leave_type_id'],
                'year'     => $body['year'],
                'quota'    => $body['quota_days'],
                'carried'  => $body['carried_days'] ?? 0,
                'quota2'   => $body['quota_days'],
                'carried2' => $body['carried_days'] ?? 0,
            ]);
            jsonSuccess(null, 'บันทึกโควตาลาสำเร็จ');
        } elseif ($method === 'POST' && $action === 'bulk') {
            // POST /api/hrm/leave-quotas/bulk
            $body = getJsonBody();
            if (empty($body['items'])) jsonError('กรุณาระบุ items', 'VALIDATION', 422);
            $count = 0;
            $stmt = $pdo->prepare(
                "INSERT INTO hrm_employee_leave_quotas (employee_id, leave_type_id, year, quota_days)
                 VALUES (:eid, :lt_id, :year, :quota)
                 ON DUPLICATE KEY UPDATE quota_days = :quota2"
            );
            foreach ($body['items'] as $item) {
                $stmt->execute([
                    'eid'    => $item['employee_id'],
                    'lt_id'  => $item['leave_type_id'],
                    'year'   => $item['year'],
                    'quota'  => $item['quota_days'],
                    'quota2' => $item['quota_days'],
                ]);
                $count++;
            }
            jsonSuccess(['count' => $count], "บันทึกโควตา {$count} รายการสำเร็จ");
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // APPROVALS (อนุมัติคำร้อง)
    // ═══════════════════════════════════════
    case 'approvals':
        $approvalModel = new HrmApproval($pdo);

        if ($method === 'GET') {
            // GET /api/hrm/approvals?type=all&status=PENDING
            $filters = [
                'type'   => $_GET['type'] ?? 'all',
                'status' => $_GET['status'] ?? null,
            ];
            // If not admin/HR, only see subordinates
            if (!($user->adm ?? false) && $currentEmployee) {
                $filters['manager_employee_id'] = $currentEmployee['id'];
            }
            $data = $approvalModel->getApprovals($filters);
            jsonSuccess(['approvals' => $data]);
        } elseif ($method === 'PUT' && $resourceId && $action === 'approve') {
            // PUT /api/hrm/approvals/{id}/approve
            $body = getJsonBody();
            $type = $body['type'] ?? '';
            if (!$type) jsonError('กรุณาระบุ type (leave/ot/time_correction/shift_swap)', 'VALIDATION', 422);
            $approvalModel->approve($type, $resourceId, $currentEmployee['id'] ?? 0);
            jsonSuccess(null, 'อนุมัติสำเร็จ');
        } elseif ($method === 'PUT' && $resourceId && $action === 'reject') {
            // PUT /api/hrm/approvals/{id}/reject
            $body = getJsonBody();
            $type = $body['type'] ?? '';
            if (!$type) jsonError('กรุณาระบุ type', 'VALIDATION', 422);
            $approvalModel->reject($type, $resourceId, $currentEmployee['id'] ?? 0, $body['reason'] ?? null);
            jsonSuccess(null, 'ปฏิเสธสำเร็จ');
        } elseif ($method === 'PUT' && $resourceId && $action === 'force-leave') {
            // PUT /api/hrm/approvals/{employeeId}/force-leave
            $body = getJsonBody();
            $err = validateRequired($body, ['date', 'leave_type_id']);
            if ($err) jsonError($err, 'VALIDATION', 422);
            $id = $approvalModel->forceLeave(
                $resourceId,
                $body['date'],
                (int) $body['leave_type_id'],
                $currentEmployee['id'] ?? 0
            );
            jsonSuccess(['id' => $id], 'บังคับเปลี่ยนเป็นลาสำเร็จ');
        } else {
            jsonError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
        }
        break;

    // ═══════════════════════════════════════
    // REPORTS (รายงานสรุป)
    // ═══════════════════════════════════════
    case 'reports':
        $subAction = $parts[1] ?? '';

        if ($method === 'GET' && $subAction === 'employees') {
            // สรุปจำนวนพนักงาน แยกสถานะ
            $rows = (new BaseModel($pdo))->query(
                "SELECT e.status, c.code as company_code, c.name_th as company_name, COUNT(*) as total
                 FROM hrm_employees e
                 JOIN core_companies c ON e.company_id = c.id
                 GROUP BY e.status, c.id ORDER BY c.id"
            );
            jsonSuccess(['report' => $rows]);
        } elseif ($method === 'GET' && $subAction === 'ot') {
            $start = $_GET['start'] ?? '';
            $end = $_GET['end'] ?? '';
            if (!$start || !$end) jsonError('กรุณาระบุ start/end', 'VALIDATION', 422);
            $rows = (new BaseModel($pdo))->query(
                "SELECT e.employee_code, u.first_name_th, u.last_name_th,
                        ot.ot_type, SUM(ot.total_hours) as total_hours
                 FROM hrm_ot_requests ot
                 JOIN hrm_employees e ON ot.employee_id = e.id
                 JOIN core_users u ON e.user_id = u.id
                 WHERE ot.status = 'APPROVED' AND ot.ot_date BETWEEN :start AND :end
                 GROUP BY e.id, ot.ot_type ORDER BY e.employee_code",
                ['start' => $start, 'end' => $end]
            );
            jsonSuccess(['report' => $rows]);
        } elseif ($method === 'GET' && $subAction === 'leave') {
            $start = $_GET['start'] ?? '';
            $end = $_GET['end'] ?? '';
            if (!$start || !$end) jsonError('กรุณาระบุ start/end', 'VALIDATION', 422);
            $rows = (new BaseModel($pdo))->query(
                "SELECT e.employee_code, u.first_name_th, u.last_name_th,
                        lt.name_th as leave_type, SUM(lr.total_days) as total_days
                 FROM hrm_leave_requests lr
                 JOIN hrm_employees e ON lr.employee_id = e.id
                 JOIN core_users u ON e.user_id = u.id
                 JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
                 WHERE lr.status = 'APPROVED' AND lr.start_date <= :end AND lr.end_date >= :start
                 GROUP BY e.id, lt.id ORDER BY e.employee_code",
                ['start' => $start, 'end' => $end]
            );
            jsonSuccess(['report' => $rows]);
        } elseif ($method === 'GET' && $subAction === 'attendance') {
            $start = $_GET['start'] ?? '';
            $end = $_GET['end'] ?? '';
            if (!$start || !$end) jsonError('กรุณาระบุ start/end', 'VALIDATION', 422);
            $rows = (new BaseModel($pdo))->query(
                "SELECT e.employee_code, u.first_name_th, u.last_name_th,
                        COUNT(DISTINCT tl.work_date) as work_days
                 FROM hrm_employees e
                 JOIN core_users u ON e.user_id = u.id
                 LEFT JOIN hrm_time_logs tl ON tl.employee_id = e.id AND tl.scan_type = 'IN'
                     AND tl.work_date BETWEEN :start AND :end
                 WHERE e.status IN ('PROBATION','FULL_TIME')
                 GROUP BY e.id ORDER BY e.employee_code",
                ['start' => $start, 'end' => $end]
            );
            jsonSuccess(['report' => $rows]);
        } else {
            jsonError('Report not found', 'NOT_FOUND', 404);
        }
        break;

    // ═══════════════════════════════════════
    // DEFAULT
    // ═══════════════════════════════════════
    default:
        jsonError('HRM route not found', 'NOT_FOUND', 404);
}
