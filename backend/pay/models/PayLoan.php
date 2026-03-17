<?php

/**
 * SiamGroup V3.1 — PayLoan Model
 * 
 * จัดการกู้ยืม (Loans) + เบิกเงินเดือนล่วงหน้า (Salary Advances)
 * อ้างอิง: PRD_03 Section 7-8
 */

class PayLoan extends BaseModel
{
    protected string $table = 'pay_loans';

    // ========================================
    // Loans
    // ========================================

    /**
     * ดึงรายการกู้ยืมพร้อมข้อมูลพนักงาน
     */
    public function getLoans(?int $companyId = null, ?int $employeeId = null, ?string $status = null): array
    {
        $sql = "SELECT l.*, 
                    e.employee_code,
                    u.first_name_th, u.last_name_th
                FROM pay_loans l
                JOIN hrm_employees e ON l.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE 1=1";
        $params = [];

        if ($companyId) {
            $sql .= " AND e.company_id = :cid";
            $params['cid'] = $companyId;
        }
        if ($employeeId) {
            $sql .= " AND l.employee_id = :eid";
            $params['eid'] = $employeeId;
        }
        if ($status) {
            $sql .= " AND l.status = :status";
            $params['status'] = $status;
        }

        $sql .= " ORDER BY l.created_at DESC";
        return $this->query($sql, $params);
    }

    /**
     * สร้างเงินกู้ใหม่ (HR บันทึก)
     */
    public function createLoan(array $data): int
    {
        $amount     = (float) $data['loan_amount'];
        $hasInterest = (int) ($data['has_interest'] ?? 0);
        $rate       = (float) ($data['interest_rate'] ?? 0);
        $installments = (int) $data['total_installments'];

        // คำนวณดอกเบี้ย (Flat Rate)
        $totalInterest = 0;
        if ($hasInterest && $rate > 0) {
            $totalInterest = $amount * ($rate / 100) * ($installments / 12);
        }

        $totalAmount    = $amount + $totalInterest;
        $monthlyPayment = round($totalAmount / $installments, 2);

        return $this->create([
            'employee_id'        => $data['employee_id'],
            'loan_amount'        => $amount,
            'has_interest'       => $hasInterest,
            'interest_rate'      => $rate,
            'total_interest'     => $totalInterest,
            'total_amount'       => $totalAmount,
            'monthly_payment'    => $monthlyPayment,
            'total_installments' => $installments,
            'paid_installments'  => 0,
            'remaining_balance'  => $totalAmount,
            'start_date'         => $data['start_date'],
            'status'             => 'ACTIVE',
            'approved_by'        => $data['approved_by'] ?? null,
            'notes'              => $data['notes'] ?? null,
        ]);
    }

    /**
     * ดึงประวัติการผ่อนชำระ
     */
    public function getLoanPayments(int $loanId): array
    {
        return $this->query(
            "SELECT lp.*, p.period_month 
             FROM pay_loan_payments lp
             JOIN pay_payroll_periods p ON lp.period_id = p.id
             WHERE lp.loan_id = :lid
             ORDER BY lp.installment_no",
            ['lid' => $loanId]
        );
    }

    /**
     * ยกเลิกเงินกู้
     */
    public function cancelLoan(int $loanId): bool
    {
        return $this->update($loanId, ['status' => 'CANCELLED']);
    }

    // ========================================
    // Salary Advances (เบิกเงินเดือนล่วงหน้า)
    // ========================================

    /**
     * ดึงรายการเบิกล่วงหน้า
     */
    public function getAdvances(?int $companyId = null, ?int $employeeId = null, ?string $periodMonth = null, ?string $status = null): array
    {
        $sql = "SELECT a.*, 
                    e.employee_code,
                    u.first_name_th, u.last_name_th
                FROM pay_salary_advances a
                JOIN hrm_employees e ON a.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE 1=1";
        $params = [];

        if ($companyId) {
            $sql .= " AND e.company_id = :cid";
            $params['cid'] = $companyId;
        }
        if ($employeeId) {
            $sql .= " AND a.employee_id = :eid";
            $params['eid'] = $employeeId;
        }
        if ($periodMonth) {
            $sql .= " AND a.period_month = :pm";
            $params['pm'] = $periodMonth;
        }
        if ($status) {
            $sql .= " AND a.overall_status = :status";
            $params['status'] = $status;
        }

        $sql .= " ORDER BY a.created_at DESC";
        return $this->query($sql, $params);
    }

    /**
     * พนักงานยื่นคำขอเบิกเงินล่วงหน้า
     */
    public function createAdvance(array $data): int
    {
        $sql = "INSERT INTO pay_salary_advances 
                (employee_id, period_month, amount, reason) 
                VALUES (:eid, :pm, :amount, :reason)";
        $this->execute($sql, [
            'eid'    => $data['employee_id'],
            'pm'     => $data['period_month'],
            'amount' => $data['amount'],
            'reason' => $data['reason'] ?? null,
        ]);

        $result = $this->query("SELECT LAST_INSERT_ID() as id");
        return (int)($result[0]['id'] ?? 0);
    }

    /**
     * คำนวณเพดานเบิกเงินล่วงหน้า
     */
    public function getAdvanceCeiling(int $empId, string $periodMonth): float
    {
        // ดึง base_salary
        $emp = $this->query(
            "SELECT base_salary FROM hrm_employees WHERE id = :eid",
            ['eid' => $empId]
        );
        if (empty($emp)) return 0;

        $baseSalary = (float) $emp[0]['base_salary'];
        $dailyRate  = $baseSalary / 30;

        // ดึง start_date, end_date ของรอบนี้
        $year  = (int) substr($periodMonth, 0, 4);
        $month = (int) substr($periodMonth, 5, 2);
        $prevMonth = $month - 1;
        $prevYear  = $year;
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }

        $startDate = sprintf('%04d-%02d-21', $prevYear, $prevMonth);
        $today     = date('Y-m-d');

        // นับวันที่มาทำงานแล้ว
        $result = $this->query(
            "SELECT COUNT(DISTINCT work_date) as cnt 
             FROM hrm_time_logs 
             WHERE employee_id = :eid AND scan_type = 'IN'
               AND work_date BETWEEN :sd AND :today",
            ['eid' => $empId, 'sd' => $startDate, 'today' => $today]
        );

        $workedDays = (int)($result[0]['cnt'] ?? 0);

        // เพดาน = daily_rate × วันที่มาทำงานแล้ว
        $ceiling = $dailyRate * $workedDays;

        // หักเงินที่เบิกไปแล้วในรอบนี้
        $alreadyAdvanced = $this->query(
            "SELECT COALESCE(SUM(amount), 0) as total 
             FROM pay_salary_advances 
             WHERE employee_id = :eid AND period_month = :pm AND overall_status IN ('PENDING','APPROVED')",
            ['eid' => $empId, 'pm' => $periodMonth]
        );
        $used = (float)($alreadyAdvanced[0]['total'] ?? 0);

        return max($ceiling - $used, 0);
    }

    /**
     * อนุมัติ/ปฏิเสธ เบิกล่วงหน้า (Dual Approval)
     */
    public function approveAdvance(int $advanceId, string $role, string $action, int $userId, ?string $comment = null): bool
    {
        $statusField   = ($role === 'manager') ? 'manager_status' : 'hr_status';
        $approverField = ($role === 'manager') ? 'manager_id' : 'hr_id';
        $dateField     = ($role === 'manager') ? 'manager_approved_at' : 'hr_approved_at';
        $commentField  = ($role === 'manager') ? 'manager_comment' : 'hr_comment';

        $status = ($action === 'approve') ? 'APPROVED' : 'REJECTED';

        $this->execute(
            "UPDATE pay_salary_advances SET 
                `{$statusField}` = :status,
                `{$approverField}` = :uid,
                `{$dateField}` = NOW(),
                `{$commentField}` = :comment
             WHERE id = :id",
            ['status' => $status, 'uid' => $userId, 'comment' => $comment, 'id' => $advanceId]
        );

        // ตรวจสอบ overall status
        $advance = $this->query("SELECT manager_status, hr_status FROM pay_salary_advances WHERE id = :id", ['id' => $advanceId]);
        if (!empty($advance)) {
            $a = $advance[0];
            if ($a['manager_status'] === 'REJECTED' || $a['hr_status'] === 'REJECTED') {
                $this->execute("UPDATE pay_salary_advances SET overall_status = 'REJECTED' WHERE id = :id", ['id' => $advanceId]);
            } elseif ($a['manager_status'] === 'APPROVED' && $a['hr_status'] === 'APPROVED') {
                $this->execute("UPDATE pay_salary_advances SET overall_status = 'APPROVED' WHERE id = :id", ['id' => $advanceId]);
            }
        }

        return true;
    }
}
