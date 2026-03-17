<?php

/**
 * SiamGroup V3.1 — Payroll Module Router
 * 
 * Entry Point: /api/pay/*
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
require_once __DIR__ . '/models/PayPayroll.php';
require_once __DIR__ . '/models/PayLoan.php';
require_once __DIR__ . '/models/PayCertificate.php';
require_once __DIR__ . '/models/PayBonus.php';

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
// 5. Auth — ทุก Payroll API ต้อง login
// ========================================
$user = requireAuth();

// ========================================
// 6. Init Models
// ========================================
$payrollModel = new PayPayroll($pdo);
$loanModel    = new PayLoan($pdo);
$certModel    = new PayCertificate($pdo);
$bonusModel   = new PayBonus($pdo);

// ========================================
// 7. Main Router
// ========================================
switch ($resource) {

    // ═══════════════════════════════════════
    // PERIODS (รอบเงินเดือน)
    // ═══════════════════════════════════════
    case 'periods':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/pay/periods?company_id=1&year=2026
            $companyId = (int)($_GET['company_id'] ?? 0);
            $year      = $_GET['year'] ?? null;

            if (!$companyId) jsonError('กรุณาระบุ company_id', 400);

            $data = $payrollModel->getPeriods($companyId, $year ? (int)$year : null);
            jsonResponse($data);
        } elseif ($method === 'GET' && $resourceId) {
            // GET /api/pay/periods/{id}
            $period = $payrollModel->find($resourceId);
            if (!$period) jsonError('ไม่พบรอบเงินเดือน', 404);

            $summary = $payrollModel->getPeriodSummary($resourceId);
            $period['summary'] = $summary;
            jsonResponse($period);
        } elseif ($method === 'POST' && !$resourceId) {
            // POST /api/pay/periods — สร้างรอบใหม่
            $body = getJsonBody();
            if (empty($body['company_id']) || empty($body['period_month'])) {
                jsonError('กรุณาระบุ company_id และ period_month', 400);
            }

            try {
                $id = $payrollModel->createPeriod((int)$body['company_id'], $body['period_month']);
                jsonResponse(['id' => $id, 'message' => 'สร้างรอบเงินเดือนสำเร็จ'], 201);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } elseif ($method === 'PUT' && $resourceId && $action === 'status') {
            // PUT /api/pay/periods/{id}/status — อัปเดตสถานะ
            $body = getJsonBody();
            if (empty($body['status'])) jsonError('กรุณาระบุ status', 400);

            $ok = $payrollModel->updatePeriodStatus($resourceId, $body['status'], $user->sub);
            jsonResponse(['message' => 'อัปเดตสถานะสำเร็จ']);
        } else {
            jsonError('Invalid periods endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // RECORDS (เงินเดือนรายบุคคล)
    // ═══════════════════════════════════════
    case 'records':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/pay/records?period_id=1&search=xxx
            $periodId = (int)($_GET['period_id'] ?? 0);
            $search   = $_GET['search'] ?? null;

            if (!$periodId) jsonError('กรุณาระบุ period_id', 400);

            $data = $payrollModel->getRecords($periodId, $search);
            jsonResponse($data);
        } elseif ($method === 'GET' && $resourceId) {
            // GET /api/pay/records/{id} — รายละเอียดเงินเดือน 1 คน
            $record = $payrollModel->getRecordDetail($resourceId);
            if (!$record) jsonError('ไม่พบข้อมูลเงินเดือน', 404);
            jsonResponse($record);
        } else {
            jsonError('Invalid records endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // CALCULATE (คำนวณเงินเดือน)
    // ═══════════════════════════════════════
    case 'calculate':
        if ($method === 'POST') {
            // POST /api/pay/calculate — คำนวณเงินเดือนทั้งรอบ
            $body = getJsonBody();
            $periodId = (int)($body['period_id'] ?? 0);
            if (!$periodId) jsonError('กรุณาระบุ period_id', 400);

            try {
                $results = $payrollModel->calculatePeriod($periodId);
                jsonResponse([
                    'message' => 'คำนวณเงินเดือนสำเร็จ',
                    'count'   => count($results),
                    'results' => $results,
                ]);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } else {
            jsonError('Method not allowed', 405);
        }
        break;

    // ═══════════════════════════════════════
    // ITEMS (ปรับรายการรายได้/หัก)
    // ═══════════════════════════════════════
    case 'items':
        if ($method === 'POST') {
            // POST /api/pay/items — HR ปรับรายการ
            $body = getJsonBody();
            if (empty($body['record_id']) || empty($body['item_type_id'])) {
                jsonError('กรุณาระบุ record_id และ item_type_id', 400);
            }

            $ok = $payrollModel->adjustItem(
                (int)$body['record_id'],
                (int)$body['item_type_id'],
                (float)($body['amount'] ?? 0),
                $body['description'] ?? null
            );

            // คำนวณ totals ใหม่
            $payrollModel->recalculateTotals((int)$body['record_id']);

            jsonResponse(['message' => 'บันทึกรายการสำเร็จ']);
        } elseif ($method === 'DELETE' && $resourceId) {
            // DELETE /api/pay/items/{id}
            $item = $payrollModel->query(
                "SELECT record_id FROM pay_payroll_items WHERE id = :id",
                ['id' => $resourceId]
            );

            $payrollModel->execute("DELETE FROM pay_payroll_items WHERE id = :id", ['id' => $resourceId]);

            if (!empty($item)) {
                $payrollModel->recalculateTotals((int)$item[0]['record_id']);
            }

            jsonResponse(['message' => 'ลบรายการสำเร็จ']);
        } else {
            jsonError('Invalid items endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // ITEM-TYPES (หัวข้อรายได้/เงินหัก)
    // ═══════════════════════════════════════
    case 'item-types':
        if ($method === 'GET') {
            $data = $payrollModel->getItemTypes();
            jsonResponse($data);
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            try {
                $id = $payrollModel->createItemType([
                    'code'       => $body['code'] ?? '',
                    'name_th'    => $body['name_th'] ?? '',
                    'name_en'    => $body['name_en'] ?? null,
                    'type'       => $body['type'] ?? 'INCOME',
                    'calc_type'  => 'MANUAL',
                    'sort_order' => (int)($body['sort_order'] ?? 50),
                ]);
                jsonResponse(['id' => $id, 'message' => 'สร้างหัวข้อสำเร็จ'], 201);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } elseif ($method === 'PUT' && $resourceId) {
            $body = getJsonBody();
            try {
                $payrollModel->updateItemType($resourceId, $body);
                jsonResponse(['message' => 'อัปเดตสำเร็จ']);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } elseif ($method === 'DELETE' && $resourceId) {
            try {
                $payrollModel->deleteItemType($resourceId);
                jsonResponse(['message' => 'ลบหัวข้อสำเร็จ']);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } else {
            jsonError('Invalid item-types endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // ADVANCES (เบิกเงินเดือนล่วงหน้า)
    // ═══════════════════════════════════════
    case 'advances':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/pay/advances?company_id=1&period_month=2026-02
            $data = $loanModel->getAdvances(
                !empty($_GET['company_id']) ? (int)$_GET['company_id'] : null,
                !empty($_GET['employee_id']) ? (int)$_GET['employee_id'] : null,
                $_GET['period_month'] ?? null,
                $_GET['status'] ?? null
            );
            jsonResponse($data);
        } elseif ($method === 'GET' && $resourceId && $action === 'ceiling') {
            // GET /api/pay/advances/{employee_id}/ceiling?period_month=2026-02
            $periodMonth = $_GET['period_month'] ?? date('Y-m');
            $ceiling = $loanModel->getAdvanceCeiling($resourceId, $periodMonth);
            jsonResponse(['ceiling' => $ceiling, 'period_month' => $periodMonth]);
        } elseif ($method === 'POST' && !$resourceId) {
            // POST /api/pay/advances — ยื่นคำขอ
            $body = getJsonBody();
            $id = $loanModel->createAdvance($body);
            jsonResponse(['id' => $id, 'message' => 'ยื่นคำขอเบิกเงินล่วงหน้าสำเร็จ'], 201);
        } elseif ($method === 'PUT' && $resourceId && $action === 'approve') {
            // PUT /api/pay/advances/{id}/approve
            $body = getJsonBody();
            $loanModel->approveAdvance(
                $resourceId,
                $body['role'] ?? 'hr',
                $body['action'] ?? 'approve',
                $user->sub,
                $body['comment'] ?? null
            );
            jsonResponse(['message' => 'ดำเนินการสำเร็จ']);
        } else {
            jsonError('Invalid advances endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // LOANS (เงินกู้ยืม)
    // ═══════════════════════════════════════
    case 'loans':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/pay/loans?company_id=1
            $data = $loanModel->getLoans(
                !empty($_GET['company_id']) ? (int)$_GET['company_id'] : null,
                !empty($_GET['employee_id']) ? (int)$_GET['employee_id'] : null,
                $_GET['status'] ?? null
            );
            jsonResponse($data);
        } elseif ($method === 'GET' && $resourceId) {
            // GET /api/pay/loans/{id}
            $loan = $loanModel->find($resourceId);
            if (!$loan) jsonError('ไม่พบข้อมูลเงินกู้', 404);
            $loan['payments'] = $loanModel->getLoanPayments($resourceId);
            jsonResponse($loan);
        } elseif ($method === 'POST') {
            // POST /api/pay/loans
            $body = getJsonBody();
            $body['approved_by'] = $user->sub;

            try {
                $id = $loanModel->createLoan($body);
                jsonResponse(['id' => $id, 'message' => 'บันทึกเงินกู้ยืมสำเร็จ'], 201);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } elseif ($method === 'PUT' && $resourceId) {
            // PUT /api/pay/loans/{id}
            $body = getJsonBody();
            if (isset($body['status']) && $body['status'] === 'CANCELLED') {
                $loanModel->cancelLoan($resourceId);
            } else {
                $loanModel->update($resourceId, $body);
            }
            jsonResponse(['message' => 'อัปเดตสำเร็จ']);
        } else {
            jsonError('Invalid loans endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // CERTIFICATES (เอกสาร Generate)
    // ═══════════════════════════════════════
    case 'certificates':
        if ($method === 'GET' && !$resourceId) {
            // GET /api/pay/certificates?company_id=1
            $data = $certModel->getCertificates(
                !empty($_GET['company_id']) ? (int)$_GET['company_id'] : null,
                !empty($_GET['employee_id']) ? (int)$_GET['employee_id'] : null,
                $_GET['doc_type'] ?? null,
                $_GET['status'] ?? null
            );
            jsonResponse($data);
        } elseif ($method === 'GET' && $resourceId) {
            // GET /api/pay/certificates/{id}
            $cert = $certModel->find($resourceId);
            if (!$cert) jsonError('ไม่พบเอกสาร', 404);
            jsonResponse($cert);
        } elseif ($method === 'POST' && !$resourceId) {
            // POST /api/pay/certificates
            $body = getJsonBody();
            $body['requested_by'] = $user->sub;

            try {
                $id = $certModel->createCertificate($body);
                jsonResponse(['id' => $id, 'message' => 'สร้างเอกสารสำเร็จ'], 201);
            } catch (Exception $e) {
                jsonError($e->getMessage(), 400);
            }
        } elseif ($method === 'PUT' && $resourceId && $action === 'sign') {
            // PUT /api/pay/certificates/{id}/sign
            $body = getJsonBody();
            $certModel->signCertificate(
                $resourceId,
                $body['sign_method'] ?? 'APPROVE_ONLY',
                $body['signature_image_path'] ?? null,
                $body['signed_document_path'] ?? null
            );
            jsonResponse(['message' => 'ลงนามเอกสารสำเร็จ']);
        } elseif ($method === 'PUT' && $resourceId && $action === 'reject') {
            // PUT /api/pay/certificates/{id}/reject
            $body = getJsonBody();
            $certModel->rejectCertificate($resourceId, $body['reason'] ?? '');
            jsonResponse(['message' => 'ปฏิเสธเอกสารสำเร็จ']);
        } else {
            jsonError('Invalid certificates endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // BONUSES (โบนัสประจำปี)
    // ═══════════════════════════════════════
    case 'bonuses':
        if ($method === 'GET') {
            // GET /api/pay/bonuses?year=2026&company_id=1
            $year      = (int)($_GET['year'] ?? date('Y'));
            $companyId = !empty($_GET['company_id']) ? (int)$_GET['company_id'] : null;
            $deptId    = !empty($_GET['department_id']) ? (int)$_GET['department_id'] : null;

            $data = $bonusModel->getBonuses($year, $companyId, $deptId);
            jsonResponse($data);
        } elseif ($method === 'POST' && $action === 'calculate') {
            // POST /api/pay/bonuses/calculate
            $body = getJsonBody();
            $year      = (int)($body['year'] ?? date('Y'));
            $companyId = (int)($body['company_id'] ?? 0);

            if (!$companyId) jsonError('กรุณาระบุ company_id', 400);

            $results = $bonusModel->calculateBonusScores($year, $companyId);
            jsonResponse([
                'message' => 'คำนวณคะแนนโบนัสสำเร็จ',
                'count'   => count($results),
                'results' => $results,
            ]);
        } elseif ($method === 'PUT' && $resourceId) {
            // PUT /api/pay/bonuses/{id} — กำหนดจำนวนเงิน
            $body = getJsonBody();
            if (isset($body['bonus_amount'])) {
                $bonusModel->setBonusAmount($resourceId, (float)$body['bonus_amount']);
            }
            if (isset($body['notes'])) {
                $bonusModel->update($resourceId, ['notes' => $body['notes']]);
            }
            jsonResponse(['message' => 'อัปเดตโบนัสสำเร็จ']);
        } elseif ($method === 'POST' && $action === 'approve') {
            // POST /api/pay/bonuses/approve
            $body = getJsonBody();
            $bonusModel->approveBonuses(
                (int)($body['year'] ?? date('Y')),
                (int)($body['company_id'] ?? 0),
                $user->sub
            );
            jsonResponse(['message' => 'อนุมัติโบนัสสำเร็จ']);
        } else {
            jsonError('Invalid bonuses endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // OT-TYPES (ประเภท OT — Config)
    // ═══════════════════════════════════════
    case 'ot-types':
        if ($method === 'GET') {
            $companyId = !empty($_GET['company_id']) ? (int)$_GET['company_id'] : null;
            $sql = "SELECT * FROM pay_ot_types WHERE is_active = 1";
            $params = [];
            if ($companyId) {
                $sql .= " AND (company_id IS NULL OR company_id = :cid)";
                $params['cid'] = $companyId;
            }
            $sql .= " ORDER BY sort_order";
            $data = $payrollModel->query($sql, $params);
            jsonResponse($data);
        } else {
            jsonError('Invalid ot-types endpoint', 404);
        }
        break;

    // ═══════════════════════════════════════
    // Default
    // ═══════════════════════════════════════
    default:
        jsonError("Unknown resource: {$resource}", 404);
}
