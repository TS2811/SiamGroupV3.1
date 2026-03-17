<?php

/**
 * SiamGroup V3.1 — PayBonus Model
 * 
 * จัดการโบนัสประจำปี (คะแนนประเมิน 70% + Attendance 30%)
 * อ้างอิง: PRD_03 Section 12
 */

class PayBonus extends BaseModel
{
    protected string $table = 'pay_bonuses';

    /**
     * ดึงรายการโบนัสพร้อมข้อมูลพนักงาน
     */
    public function getBonuses(int $year, ?int $companyId = null, ?int $departmentId = null): array
    {
        $sql = "SELECT b.*, 
                    e.employee_code, e.base_salary,
                    u.first_name_th, u.last_name_th
                FROM pay_bonuses b
                JOIN hrm_employees e ON b.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE b.year = :year";
        $params = ['year' => $year];

        if ($companyId) {
            $sql .= " AND e.company_id = :cid";
            $params['cid'] = $companyId;
        }

        $sql .= " ORDER BY e.employee_code";
        return $this->query($sql, $params);
    }

    /**
     * คำนวณคะแนนโบนัสปลายปี
     */
    public function calculateBonusScores(int $year, int $companyId): array
    {
        // ดึงพนักงาน active
        $employees = $this->query(
            "SELECT e.id, e.employee_code, u.first_name_th, u.last_name_th
             FROM hrm_employees e
             JOIN core_users u ON e.user_id = u.id
             WHERE e.company_id = :cid AND e.status NOT IN ('RESIGNED', 'TERMINATED')",
            ['cid' => $companyId]
        );

        $results = [];
        foreach ($employees as $emp) {
            $empId = $emp['id'];

            // 1. คะแนนประเมิน (เฉลี่ย 12 เดือน × 14 → เต็ม 70)
            $evalScore = $this->calcEvaluationScore($empId, $year);

            // 2. คะแนน Attendance (เต็ม 30)
            $attendanceScore = $this->calcAttendanceScore($empId, $year);

            // 3. คะแนนรวม
            $totalScore = $evalScore + $attendanceScore;

            // Upsert bonus record
            $existing = $this->findWhere(['employee_id' => $empId, 'year' => $year]);
            if ($existing) {
                $this->update($existing['id'], [
                    'evaluation_score' => $evalScore,
                    'attendance_score' => $attendanceScore,
                    'total_score'      => $totalScore,
                ]);
            } else {
                $this->create([
                    'employee_id'      => $empId,
                    'year'             => $year,
                    'evaluation_score' => $evalScore,
                    'attendance_score' => $attendanceScore,
                    'total_score'      => $totalScore,
                    'status'           => 'DRAFT',
                ]);
            }

            $results[] = [
                'employee_id'      => $empId,
                'name'             => $emp['first_name_th'] . ' ' . $emp['last_name_th'],
                'evaluation_score' => $evalScore,
                'attendance_score' => $attendanceScore,
                'total_score'      => $totalScore,
            ];
        }

        return $results;
    }

    /**
     * HR กำหนดจำนวนเงินโบนัส
     */
    public function setBonusAmount(int $bonusId, float $amount): bool
    {
        return $this->update($bonusId, ['bonus_amount' => $amount]);
    }

    /**
     * อนุมัติโบนัส
     */
    public function approveBonuses(int $year, int $companyId, int $approvedBy): bool
    {
        return $this->execute(
            "UPDATE pay_bonuses b
             JOIN hrm_employees e ON b.employee_id = e.id
             SET b.status = 'APPROVED', b.approved_by = :uid, b.approved_at = NOW()
             WHERE b.year = :year AND e.company_id = :cid AND b.status = 'DRAFT'",
            ['uid' => $approvedBy, 'year' => $year, 'cid' => $companyId]
        );
    }

    // ========================================
    // Score Calculation Helpers
    // ========================================

    private function calcEvaluationScore(int $empId, int $year): float
    {
        // ดึงคะแนนประเมิน 12 เดือน
        $result = $this->query(
            "SELECT AVG(weighted_score) as avg_score
             FROM hrm_evaluations
             WHERE employee_id = :eid AND YEAR(evaluation_month) = :year",
            ['eid' => $empId, 'year' => $year]
        );

        $avgScore = (float)($result[0]['avg_score'] ?? 0);

        // weighted_score เต็ม 5 → × 14 = เต็ม 70
        return round(min($avgScore * 14, 70), 2);
    }

    private function calcAttendanceScore(int $empId, int $year): float
    {
        $score = 30; // เริ่มเต็ม 30

        $startDate = "{$year}-01-01";
        $endDate   = "{$year}-12-31";

        // (1) นับวันที่ไม่มี clock-in เลย (ขาดงาน) → หัก 5/ครั้ง (เต็ม 10)
        // นับ business days ในปี (ประมาณ 260) แล้วลบวันที่มี scan IN
        $daysWithScan = $this->query(
            "SELECT COUNT(DISTINCT work_date) as cnt FROM hrm_time_logs
             WHERE employee_id = :eid AND scan_type = 'IN'
               AND work_date BETWEEN :sd AND :ed",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );
        // ถ้ายังไม่มีข้อมูลเพียงพอ ไม่หัก (ปีใหม่/พนักงานใหม่)
        $scanDays = (int)($daysWithScan[0]['cnt'] ?? 0);
        // ถ้ามีข้อมูลน้อยกว่า 20 วัน ไม่คำนวณ absent (ข้อมูลไม่เพียงพอ)
        if ($scanDays < 20) {
            // ไม่หักคะแนนขาดงาน
        } else {
            // ประมาณจำนวนวันทำงานจนถึงปัจจุบัน (22 วัน/เดือน)
            $monthsInYear = min((int)date('n'), 12);
            $expectedDays = $monthsInYear * 22;
            $absences = max($expectedDays - $scanDays, 0);
            $absDeduction = min($absences * 5, 10);
            $score -= $absDeduction;
        }

        // (2) ลาเยอะ → หัก 0.5/วัน (เต็ม 10)
        $leaves = $this->query(
            "SELECT COALESCE(SUM(total_days), 0) as total
             FROM hrm_leave_requests
             WHERE employee_id = :eid AND status = 'APPROVED'
               AND start_date BETWEEN :sd AND :ed",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );
        $leaveDeduction = min((float)($leaves[0]['total'] ?? 0) * 0.5, 10);
        $score -= $leaveDeduction;

        // (3) มาสาย → นับวันที่ clock-in หลัง 09:00 (เต็ม 10)
        $lates = $this->query(
            "SELECT COUNT(DISTINCT work_date) as cnt FROM hrm_time_logs
             WHERE employee_id = :eid AND scan_type = 'IN'
               AND TIME(scan_time) > '09:00:00'
               AND work_date BETWEEN :sd AND :ed",
            ['eid' => $empId, 'sd' => $startDate, 'ed' => $endDate]
        );
        $lateDeduction = min((int)($lates[0]['cnt'] ?? 0) * 1, 10);
        $score -= $lateDeduction;

        return max($score, 0);
    }
}
