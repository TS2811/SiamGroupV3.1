<?php

/**
 * SiamGroup V3.1 — PayPayroll Model
 * 
 * จัดการ Payroll Processing: Periods, Records, Items, Calculation
 * อ้างอิง: PRD_03 Section 2-6, 9
 */

class PayPayroll extends BaseModel
{
    protected string $table = 'pay_payroll_periods';

    // ========================================
    // Payroll Periods
    // ========================================

    /**
     * ดึงรายการรอบเงินเดือน
     */
    public function getPeriods(int $companyId, ?int $year = null): array
    {
        $sql = "SELECT * FROM pay_payroll_periods WHERE company_id = :cid";
        $params = ['cid' => $companyId];

        if ($year) {
            $sql .= " AND period_month LIKE :year";
            $params['year'] = $year . '%';
        }

        $sql .= " ORDER BY period_month DESC";
        return $this->query($sql, $params);
    }

    /**
     * สร้างรอบเงินเดือน (ถ้ายังไม่มี)
     */
    public function createPeriod(int $companyId, string $periodMonth): int
    {
        // คำนวณ start_date, end_date, pay_date จาก period_month (YYYY-MM)
        $year  = (int) substr($periodMonth, 0, 4);
        $month = (int) substr($periodMonth, 5, 2);

        // รอบ 21 เดือนก่อน ถึง 20 เดือนนี้
        $prevMonth = $month - 1;
        $prevYear  = $year;
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }

        $startDate = sprintf('%04d-%02d-21', $prevYear, $prevMonth);
        $endDate   = sprintf('%04d-%02d-20', $year, $month);

        // วันจ่ายเงิน = วันที่ 1 ของเดือนถัดไป
        $nextMonth = $month + 1;
        $nextYear  = $year;
        if ($nextMonth > 12) {
            $nextMonth = 1;
            $nextYear++;
        }
        $payDate = sprintf('%04d-%02d-01', $nextYear, $nextMonth);

        return $this->create([
            'company_id'   => $companyId,
            'period_month' => $periodMonth,
            'start_date'   => $startDate,
            'end_date'     => $endDate,
            'pay_date'     => $payDate,
            'status'       => 'DRAFT'
        ]);
    }

    /**
     * อัปเดตสถานะรอบเงินเดือน
     */
    public function updatePeriodStatus(int $periodId, string $status, ?int $userId = null): bool
    {
        $data = ['status' => $status];

        if ($status === 'FINALIZED' && $userId) {
            $data['finalized_by'] = $userId;
            $data['finalized_at'] = date('Y-m-d H:i:s');
        } elseif ($status === 'PAID') {
            $data['paid_at'] = date('Y-m-d H:i:s');
        }

        return $this->update($periodId, $data);
    }

    // ========================================
    // Payroll Records (สรุปเงินเดือนรายบุคคล)
    // ========================================

    /**
     * ดึงรายการเงินเดือนรายคนในรอบ
     */
    public function getRecords(int $periodId, ?string $search = null): array
    {
        $sql = "SELECT r.*, 
                    e.employee_code, e.salary_type, 
                    u.first_name_th, u.last_name_th
                FROM pay_payroll_records r
                JOIN hrm_employees e ON r.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE r.period_id = :pid";
        $params = ['pid' => $periodId];

        if ($search) {
            $sql .= " AND (u.first_name_th LIKE :s OR u.last_name_th LIKE :s2 OR e.employee_code LIKE :s3)";
            $params['s']  = "%{$search}%";
            $params['s2'] = "%{$search}%";
            $params['s3'] = "%{$search}%";
        }

        $sql .= " ORDER BY e.employee_code";
        return $this->query($sql, $params);
    }

    /**
     * รายละเอียดเงินเดือน 1 คน (พร้อม items)
     */
    public function getRecordDetail(int $recordId): ?array
    {
        // ข้อมูลหลัก
        $sql = "SELECT r.*, 
                    e.employee_code, e.salary_type, e.base_salary AS current_base_salary,
                    u.first_name_th, u.last_name_th,
                    p.period_month, p.start_date, p.end_date, p.status AS period_status
                FROM pay_payroll_records r
                JOIN hrm_employees e ON r.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                JOIN pay_payroll_periods p ON r.period_id = p.id
                WHERE r.id = :id";
        $record = $this->query($sql, ['id' => $recordId]);
        if (empty($record)) return null;

        $result = $record[0];

        // Items ย่อย
        $sql = "SELECT i.*, t.code, t.name_th, t.type, t.calc_type
                FROM pay_payroll_items i
                JOIN pay_item_types t ON i.item_type_id = t.id
                WHERE i.record_id = :rid
                ORDER BY t.sort_order";
        $result['items'] = $this->query($sql, ['rid' => $recordId]);

        return $result;
    }

    // ========================================
    // Payroll Calculation Engine
    // ========================================ย

    /**
     * คำนวณเงินเดือนทั้งรอบ
     */
    public function calculatePeriod(int $periodId): array
    {
        $period = $this->find($periodId);
        if (!$period) throw new Exception('ไม่พบรอบเงินเดือน');
        if ($period['status'] !== 'DRAFT' && $period['status'] !== 'REVIEWING') {
            throw new Exception('สถานะรอบเงินเดือนไม่อนุญาตให้คำนวณใหม่');
        }

        // ดึงพนักงานทั้งหมดของบริษัทที่ active
        $employees = $this->query(
            "SELECT e.*, u.first_name_th, u.last_name_th 
             FROM hrm_employees e 
             JOIN core_users u ON e.user_id = u.id 
             WHERE e.company_id = :cid AND e.status NOT IN ('RESIGNED', 'TERMINATED')",
            ['cid' => $period['company_id']]
        );

        $results = [];
        foreach ($employees as $emp) {
            $results[] = $this->calculateEmployee($periodId, $period, $emp);
        }

        // อัปเดตสถานะ
        $this->updatePeriodStatus($periodId, 'REVIEWING');

        return $results;
    }

    /**
     * คำนวณเงินเดือนพนักงาน 1 คน
     */
    private function calculateEmployee(int $periodId, array $period, array $emp): array
    {
        $empId    = $emp['id'];
        $baseSalary = (float) $emp['base_salary'];

        // 1. คำนวณเงินเดือนฐาน
        $workingDays = null;
        $actualBase  = $baseSalary;

        if ($emp['salary_type'] === 'DAILY') {
            // นับวันทำงานจาก hrm_time_logs
            $workingDays = $this->countWorkingDays($empId, $period['start_date'], $period['end_date']);
            // บวกวันลาที่ได้เงิน
            $paidLeaveDays = $this->countPaidLeaveDays($empId, $period['start_date'], $period['end_date']);
            $workingDays += $paidLeaveDays;
            $actualBase = $baseSalary * $workingDays; // daily rate × days
        }

        // 2. คำนวณ OT
        $otPay = $this->calculateOT($empId, $emp, $period['start_date'], $period['end_date']);

        // 3. ประกันสังคม
        $socialSecurity = $this->calculateSocialSecurity($baseSalary);

        // 4. ภาษีหัก ณ ที่จ่าย (ประมาณการ)
        $taxAmount = $this->calculateTax($empId, $actualBase + $otPay, $period['period_month']);

        // 5. เบิกเงินล่วงหน้าที่อนุมัติแล้ว
        $advanceAmount = $this->getApprovedAdvances($empId, $period['period_month']);

        // 6. ผ่อนกู้ยืม
        $loanPayment = $this->getActiveLoanPayment($empId);

        // 7. รวม
        $totalIncome    = $actualBase + $otPay;
        $totalDeduction = $socialSecurity + $taxAmount + $advanceAmount + $loanPayment;
        $netPay = $totalIncome - $totalDeduction;

        // บันทึก Record (upsert)
        $recordId = $this->upsertRecord($periodId, $empId, [
            'base_salary'      => $actualBase,
            'working_days'     => $workingDays,
            'total_income'     => $totalIncome,
            'total_deduction'  => $totalDeduction,
            'net_pay'          => $netPay,
            'tax_auto_amount'  => $taxAmount,
            'tax_final_amount' => $taxAmount,
        ]);

        // บันทึก Items
        $this->upsertItem($recordId, 'BASE_SALARY', $actualBase);
        if ($otPay > 0) $this->upsertItem($recordId, 'OT_PAY', $otPay);
        $this->upsertItem($recordId, 'SOCIAL_SECURITY', $socialSecurity);
        if ($taxAmount > 0) $this->upsertItem($recordId, 'WITHHOLDING_TAX', $taxAmount);
        if ($advanceAmount > 0) $this->upsertItem($recordId, 'SALARY_ADVANCE', $advanceAmount);
        if ($loanPayment > 0) $this->upsertItem($recordId, 'LOAN_PAYMENT', $loanPayment);

        return [
            'employee_id' => $empId,
            'name'        => $emp['first_name_th'] . ' ' . $emp['last_name_th'],
            'base_salary' => $actualBase,
            'ot_pay'      => $otPay,
            'total_income'    => $totalIncome,
            'total_deduction' => $totalDeduction,
            'net_pay'         => $netPay,
        ];
    }

    // ========================================
    // Calculation Helpers
    // ========================================

    private function countWorkingDays(int $empId, string $startDate, string $endDate): int
    {
        $result = $this->query(
            "SELECT COUNT(DISTINCT work_date) as cnt 
             FROM hrm_time_logs 
             WHERE employee_id = :eid AND scan_type = 'IN'
               AND work_date BETWEEN :sd AND :ed",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );
        return (int)($result[0]['cnt'] ?? 0);
    }

    private function countPaidLeaveDays(int $empId, string $startDate, string $endDate): int
    {
        $result = $this->query(
            "SELECT COALESCE(SUM(total_days), 0) as cnt 
             FROM hrm_leave_requests lr
             JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.employee_id = :eid AND lr.status = 'APPROVED'
               AND lt.is_paid = 1
               AND lr.start_date <= :ed AND lr.end_date >= :sd",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );
        return (int)($result[0]['cnt'] ?? 0);
    }

    private function calculateOT(int $empId, array $emp, string $startDate, string $endDate): float
    {
        // ดึง OT requests ที่ approved ในรอบ
        $otRequests = $this->query(
            "SELECT ot_type, total_hours
             FROM hrm_ot_requests
             WHERE employee_id = :eid AND status = 'APPROVED'
               AND ot_date BETWEEN :sd AND :ed",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );

        $totalOT = 0;
        $baseSalary = (float) $emp['base_salary'];
        $hourlyRate = $baseSalary / 30 / 8; // อัตรารายชั่วโมง

        // OT multipliers ตามกฎหมายแรงงานไทย
        $multipliers = [
            'OT_1_0' => 1.0,
            'OT_1_5' => 1.5,
            'OT_2_0' => 2.0,
            'OT_3_0' => 3.0,
            'SHIFT_PREMIUM' => 1.0, // ค่ากะ — ใช้ fixed rate
        ];

        foreach ($otRequests as $ot) {
            $hours = (float)($ot['total_hours'] ?? 0);
            $mult = $multipliers[$ot['ot_type']] ?? 1.0;
            $totalOT += $hourlyRate * $mult * $hours;
        }

        return round($totalOT, 2);
    }

    private function getFixedRate(int $otTypeId, float $salary): ?array
    {
        $rates = $this->query(
            "SELECT * FROM pay_ot_fixed_rates 
             WHERE ot_type_id = :tid 
               AND salary_min <= :sal 
               AND (salary_max IS NULL OR salary_max >= :sal2)
             LIMIT 1",
            ['tid' => $otTypeId, 'sal' => $salary, 'sal2' => $salary]
        );
        return $rates[0] ?? null;
    }

    private function calculateTimeSlotOT(int $otTypeId, string $startTime, string $endTime): float
    {
        $slots = $this->query(
            "SELECT * FROM pay_ot_time_slots WHERE ot_type_id = :tid ORDER BY sort_order",
            ['tid' => $otTypeId]
        );

        $total = 0;
        foreach ($slots as $slot) {
            // ถ้าช่วงเวลาทำงานครอบคลุม slot นี้ → บวกเงิน
            if ($this->isTimeOverlap($startTime, $endTime, $slot['start_time'], $slot['end_time'])) {
                $total += (float)$slot['amount'];
            }
        }
        return $total;
    }

    private function isTimeOverlap(string $s1, string $e1, string $s2, string $e2): bool
    {
        // Simple overlap check (ไม่ข้ามวัน — simplified)
        return $s1 < $e2 && $e1 > $s2;
    }

    private function calculateSocialSecurity(float $baseSalary): float
    {
        // ดึง config จาก core_system_config (ถ้ามี) หรือใช้ค่าเริ่มต้น
        $rate = 0.05;         // 5%
        $maxSalary = 15000;   // เพดานเงินเดือน
        $maxAmount = 750;     // เพดานสูงสุด

        $base = min($baseSalary, $maxSalary);
        return min($base * $rate, $maxAmount);
    }

    private function calculateTax(int $empId, float $monthlyIncome, string $periodMonth): float
    {
        // ประมาณการภาษีรายเดือน (simplified)
        $month = (int) substr($periodMonth, 5, 2);
        $remainingMonths = max(13 - $month, 1);

        // ดึงรายได้สะสม
        $ytd = $this->query(
            "SELECT COALESCE(SUM(r.total_income), 0) as ytd_income
             FROM pay_payroll_records r
             JOIN pay_payroll_periods p ON r.period_id = p.id
             WHERE r.employee_id = :eid 
               AND p.period_month < :pm 
               AND p.period_month LIKE :yr",
            ['eid' => $empId, 'pm' => $periodMonth, 'yr' => substr($periodMonth, 0, 4) . '%']
        );
        $ytdIncome = (float)($ytd[0]['ytd_income'] ?? 0);

        // ประมาณรายได้ทั้งปี
        $annualIncome = $ytdIncome + ($monthlyIncome * $remainingMonths);

        // หักค่าลดหย่อน
        $personalDeduction = 60000;
        $socialSecurityYear = min($monthlyIncome * 0.05, 750) * 12;
        $netIncome = $annualIncome - $personalDeduction - $socialSecurityYear;

        if ($netIncome <= 150000) return 0;

        // คำนวณภาษีอัตราก้าวหน้า
        $tax = 0;
        $brackets = [
            [150000, 0],
            [300000, 0.05],
            [500000, 0.10],
            [750000, 0.15],
            [1000000, 0.20],
            [2000000, 0.25],
            [5000000, 0.30],
            [PHP_FLOAT_MAX, 0.35],
        ];

        $prev = 0;
        foreach ($brackets as [$ceiling, $rate]) {
            if ($netIncome <= $prev) break;
            $taxable = min($netIncome, $ceiling) - $prev;
            $tax += max($taxable, 0) * $rate;
            $prev = $ceiling;
        }

        // ภาษีรายเดือน
        return round($tax / $remainingMonths, 2);
    }

    private function getApprovedAdvances(int $empId, string $periodMonth): float
    {
        $result = $this->query(
            "SELECT COALESCE(SUM(amount), 0) as total 
             FROM pay_salary_advances 
             WHERE employee_id = :eid AND period_month = :pm AND overall_status = 'APPROVED'",
            ['eid' => $empId, 'pm' => $periodMonth]
        );
        return (float)($result[0]['total'] ?? 0);
    }

    private function getActiveLoanPayment(int $empId): float
    {
        $result = $this->query(
            "SELECT COALESCE(SUM(monthly_payment), 0) as total 
             FROM pay_loans 
             WHERE employee_id = :eid AND status = 'ACTIVE'",
            ['eid' => $empId]
        );
        return (float)($result[0]['total'] ?? 0);
    }

    // ========================================
    // Upsert Helpers
    // ========================================

    private function upsertRecord(int $periodId, int $empId, array $data): int
    {
        $existing = $this->query(
            "SELECT id FROM pay_payroll_records WHERE period_id = :pid AND employee_id = :eid",
            ['pid' => $periodId, 'eid' => $empId]
        );

        if (!empty($existing)) {
            $id = (int)$existing[0]['id'];
            $this->execute(
                "UPDATE pay_payroll_records SET 
                    base_salary = :bs, working_days = :wd,
                    total_income = :ti, total_deduction = :td, net_pay = :np,
                    tax_auto_amount = :ta, tax_final_amount = :tf
                 WHERE id = :id",
                [
                    'bs' => $data['base_salary'],
                    'wd' => $data['working_days'],
                    'ti' => $data['total_income'],
                    'td' => $data['total_deduction'],
                    'np' => $data['net_pay'],
                    'ta' => $data['tax_auto_amount'],
                    'tf' => $data['tax_final_amount'],
                    'id' => $id
                ]
            );
            return $id;
        }

        $data['period_id']   = $periodId;
        $data['employee_id'] = $empId;

        $this->execute(
            "INSERT INTO pay_payroll_records 
                (period_id, employee_id, base_salary, working_days, total_income, total_deduction, net_pay, tax_auto_amount, tax_final_amount)
             VALUES (:pid, :eid, :bs, :wd, :ti, :td, :np, :ta, :tf)",
            [
                'pid' => $periodId,
                'eid' => $empId,
                'bs' => $data['base_salary'],
                'wd' => $data['working_days'],
                'ti' => $data['total_income'],
                'td' => $data['total_deduction'],
                'np' => $data['net_pay'],
                'ta' => $data['tax_auto_amount'],
                'tf' => $data['tax_final_amount']
            ]
        );

        $result = $this->query("SELECT LAST_INSERT_ID() as id");
        return (int)($result[0]['id'] ?? 0);
    }

    private function upsertItem(int $recordId, string $itemCode, float $amount): void
    {
        $type = $this->query(
            "SELECT id FROM pay_item_types WHERE code = :code",
            ['code' => $itemCode]
        );
        if (empty($type)) return;

        $typeId = (int)$type[0]['id'];

        $existing = $this->query(
            "SELECT id FROM pay_payroll_items WHERE record_id = :rid AND item_type_id = :tid",
            ['rid' => $recordId, 'tid' => $typeId]
        );

        if (!empty($existing)) {
            $this->execute(
                "UPDATE pay_payroll_items SET amount = :amt WHERE id = :id",
                ['amt' => $amount, 'id' => $existing[0]['id']]
            );
        } else {
            $this->execute(
                "INSERT INTO pay_payroll_items (record_id, item_type_id, amount) VALUES (:rid, :tid, :amt)",
                ['rid' => $recordId, 'tid' => $typeId, 'amt' => $amount]
            );
        }
    }

    // ========================================
    // Manual Item Adjustment (HR)
    // ========================================

    /**
     * HR เพิ่ม/แก้ไข payroll item ของพนักงาน
     */
    public function adjustItem(int $recordId, int $itemTypeId, float $amount, ?string $description = null): bool
    {
        $existing = $this->query(
            "SELECT id FROM pay_payroll_items WHERE record_id = :rid AND item_type_id = :tid",
            ['rid' => $recordId, 'tid' => $itemTypeId]
        );

        if (!empty($existing)) {
            return $this->execute(
                "UPDATE pay_payroll_items SET amount = :amt, description = :desc WHERE id = :id",
                ['amt' => $amount, 'desc' => $description, 'id' => $existing[0]['id']]
            );
        }

        return $this->execute(
            "INSERT INTO pay_payroll_items (record_id, item_type_id, amount, description) VALUES (:rid, :tid, :amt, :desc)",
            ['rid' => $recordId, 'tid' => $itemTypeId, 'amt' => $amount, 'desc' => $description]
        );
    }

    /**
     * คำนวณ totals ใหม่หลัง adjust
     */
    public function recalculateTotals(int $recordId): void
    {
        $items = $this->query(
            "SELECT i.amount, t.type 
             FROM pay_payroll_items i 
             JOIN pay_item_types t ON i.item_type_id = t.id
             WHERE i.record_id = :rid",
            ['rid' => $recordId]
        );

        $totalIncome = 0;
        $totalDeduction = 0;
        foreach ($items as $item) {
            if ($item['type'] === 'INCOME') {
                $totalIncome += (float)$item['amount'];
            } else {
                $totalDeduction += (float)$item['amount'];
            }
        }

        $this->execute(
            "UPDATE pay_payroll_records SET total_income = :ti, total_deduction = :td, net_pay = :np WHERE id = :id",
            ['ti' => $totalIncome, 'td' => $totalDeduction, 'np' => $totalIncome - $totalDeduction, 'id' => $recordId]
        );
    }

    // ========================================
    // Payroll Summary / Reports
    // ========================================

    /**
     * สรุปเงินเดือนรวมของรอบ
     */
    public function getPeriodSummary(int $periodId): array
    {
        $result = $this->query(
            "SELECT 
                COUNT(*) as employee_count,
                COALESCE(SUM(base_salary), 0) as total_base,
                COALESCE(SUM(total_income), 0) as total_income,
                COALESCE(SUM(total_deduction), 0) as total_deduction,
                COALESCE(SUM(net_pay), 0) as total_net_pay
             FROM pay_payroll_records 
             WHERE period_id = :pid",
            ['pid' => $periodId]
        );
        return $result[0] ?? [];
    }

    /**
     * Item Types ที่ active
     */
    public function getItemTypes(): array
    {
        return $this->query("SELECT * FROM pay_item_types WHERE is_active = 1 ORDER BY sort_order");
    }

    /**
     * CRUD Item Types
     */
    public function createItemType(array $data): int
    {
        $this->execute(
            "INSERT INTO pay_item_types (code, name_th, name_en, type, calc_type, is_system, is_active, sort_order) 
             VALUES (:code, :name_th, :name_en, :type, :calc_type, 0, 1, :sort_order)",
            $data
        );
        $result = $this->query("SELECT LAST_INSERT_ID() as id");
        return (int)($result[0]['id'] ?? 0);
    }

    public function updateItemType(int $id, array $data): bool
    {
        // ห้ามแก้ System Item
        $item = $this->query("SELECT is_system FROM pay_item_types WHERE id = :id", ['id' => $id]);
        if (!empty($item) && $item[0]['is_system']) {
            throw new Exception('ไม่สามารถแก้ไข System Item');
        }

        $sets = [];
        $params = ['id' => $id];
        foreach ($data as $k => $v) {
            $sets[] = "`{$k}` = :{$k}";
            $params[$k] = $v;
        }
        return $this->execute(
            "UPDATE pay_item_types SET " . implode(', ', $sets) . " WHERE id = :id",
            $params
        );
    }

    public function deleteItemType(int $id): bool
    {
        $item = $this->query("SELECT is_system FROM pay_item_types WHERE id = :id", ['id' => $id]);
        if (!empty($item) && $item[0]['is_system']) {
            throw new Exception('ไม่สามารถลบ System Item');
        }
        return $this->execute("DELETE FROM pay_item_types WHERE id = :id AND is_system = 0", ['id' => $id]);
    }
}
