<?php

/**
 * SiamGroup V3.1 — CheckIn Model
 * 
 * จัดการ Check-in / Check-out + ดึงประวัติเวลา
 */

require_once __DIR__ . '/BaseModel.php';

class CheckIn extends BaseModel
{
    protected string $table = 'hrm_time_logs';

    /**
     * บันทึก Clock In / Clock Out
     */
    public function clock(int $employeeId, array $data): array
    {
        $workDate = date('Y-m-d');
        $scanTime = date('Y-m-d H:i:s');

        // ตรวจสถานะวันนี้ — มี IN แล้วยัง?
        $todayLogs = $this->getTodayLogs($employeeId, $workDate);
        $hasIn  = false;
        $hasOut = false;
        foreach ($todayLogs as $log) {
            if ($log['scan_type'] === 'IN')  $hasIn = true;
            if ($log['scan_type'] === 'OUT') $hasOut = true;
        }

        // ถ้ายังไม่มี IN → สร้าง IN, ถ้ามี IN แล้วยังไม่มี OUT → สร้าง OUT
        $scanType = (!$hasIn) ? 'IN' : ((!$hasOut) ? 'OUT' : null);

        if ($scanType === null) {
            throw new \RuntimeException('วันนี้ลงเวลาเข้า-ออกครบแล้ว');
        }

        $checkInType = $data['check_in_type'] ?? 'ONSITE';

        $logId = $this->create([
            'employee_id'          => $employeeId,
            'work_date'            => $workDate,
            'scan_time'            => $scanTime,
            'scan_type'            => $scanType,
            'check_in_type'        => $checkInType,
            'latitude'             => $data['latitude'] ?? null,
            'longitude'            => $data['longitude'] ?? null,
            'location_name'        => $data['location_name'] ?? null,
            'distance_from_base'   => $data['distance_from_base'] ?? null,
            'is_verified_location' => $data['is_verified_location'] ?? 0,
            'offsite_reason'       => $data['offsite_reason'] ?? null,
            'offsite_attachment'   => $data['offsite_attachment'] ?? null,
            'user_agent'           => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'ip_address'           => $_SERVER['REMOTE_ADDR'] ?? null,
            'device_risk_flag'     => $data['device_risk_flag'] ?? 0,
        ]);

        return [
            'id'        => $logId,
            'scan_type' => $scanType,
            'scan_time' => $scanTime,
            'work_date' => $workDate,
            'check_in_type' => $checkInType,
        ];
    }

    /**
     * ดึง logs ของวันนี้
     */
    public function getTodayLogs(int $employeeId, ?string $date = null): array
    {
        $date = $date ?? date('Y-m-d');
        return $this->query(
            "SELECT * FROM `{$this->table}` 
             WHERE `employee_id` = :emp AND `work_date` = :dt 
             ORDER BY `scan_time` ASC",
            ['emp' => $employeeId, 'dt' => $date]
        );
    }

    /**
     * สถานะวันนี้: NONE, IN, COMPLETE
     */
    public function getTodayStatus(int $employeeId): array
    {
        $workDate = date('Y-m-d');
        $logs = $this->getTodayLogs($employeeId, $workDate);

        $status = 'NONE';
        $clockIn = null;
        $clockOut = null;

        foreach ($logs as $log) {
            if ($log['scan_type'] === 'IN') {
                $clockIn = $log['scan_time'];
                $status = 'IN';
            }
            if ($log['scan_type'] === 'OUT') {
                $clockOut = $log['scan_time'];
                $status = 'COMPLETE';
            }
        }

        return [
            'work_date'  => $workDate,
            'status'     => $status,
            'clock_in'   => $clockIn,
            'clock_out'  => $clockOut,
            'logs'       => $logs,
        ];
    }

    /**
     * ประวัติ time_logs ในช่วงรอบเงินเดือน (21 เดือนก่อน — 20 เดือนนี้)
     */
    public function getPayrollCycleHistory(int $employeeId, int $month, int $year): array
    {
        // คำนวณวันเริ่ม-สิ้นสุดรอบเงินเดือน
        // รอบเดือน 3/2026 = 21 ก.พ. 2026 — 20 มี.ค. 2026
        $prevMonth = $month - 1;
        $prevYear  = $year;
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }
        $startDate = sprintf('%04d-%02d-21', $prevYear, $prevMonth);
        $endDate   = sprintf('%04d-%02d-20', $year, $month);

        $logs = $this->query(
            "SELECT * FROM `{$this->table}` 
             WHERE `employee_id` = :emp 
               AND `work_date` BETWEEN :start AND :end 
             ORDER BY `work_date` ASC, `scan_time` ASC",
            ['emp' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // จัดกลุ่มตามวัน
        $grouped = [];
        foreach ($logs as $log) {
            $date = $log['work_date'];
            if (!isset($grouped[$date])) {
                $grouped[$date] = ['date' => $date, 'in' => null, 'out' => null, 'logs' => []];
            }
            if ($log['scan_type'] === 'IN' && !$grouped[$date]['in']) {
                $grouped[$date]['in'] = $log['scan_time'];
            }
            if ($log['scan_type'] === 'OUT') {
                $grouped[$date]['out'] = $log['scan_time'];
            }
            $grouped[$date]['logs'][] = $log;
        }

        return [
            'cycle_start' => $startDate,
            'cycle_end'   => $endDate,
            'month'       => $month,
            'year'        => $year,
            'days'        => array_values($grouped),
        ];
    }

    /**
     * ดึง employee_id จาก user_id
     */
    public function getEmployeeId(int $userId): ?int
    {
        $result = $this->query(
            "SELECT `id` FROM `hrm_employees` WHERE `user_id` = :uid LIMIT 1",
            ['uid' => $userId]
        );
        return $result[0]['id'] ?? null;
    }

    /**
     * ดึงข้อมูลสาขาของพนักงาน (สำหรับคำนวณระยะห่าง)
     */
    public function getEmployeeBranch(int $employeeId): ?array
    {
        $result = $this->query(
            "SELECT b.* FROM `core_branches` b
             JOIN `hrm_employees` e ON e.`branch_id` = b.`id`
             WHERE e.`id` = :eid LIMIT 1",
            ['eid' => $employeeId]
        );
        return $result[0] ?? null;
    }

    /**
     * ดึงกะปัจจุบันของพนักงาน
     */
    public function getEmployeeShift(int $employeeId, ?string $date = null): ?array
    {
        $date = $date ?? date('Y-m-d');
        $dayOfWeek = (int)date('w', strtotime($date)); // 0=Sun, 6=Sat

        $result = $this->query(
            "SELECT s.* FROM `hrm_shifts` s
             JOIN `hrm_employee_shifts` es ON es.`shift_id` = s.`id`
             WHERE es.`employee_id` = :eid
               AND es.`effective_date` <= :dt
               AND (es.`end_date` IS NULL OR es.`end_date` >= :dt2)
               AND (es.`day_of_week` IS NULL OR es.`day_of_week` = :dow)
             ORDER BY es.`effective_date` DESC
             LIMIT 1",
            ['eid' => $employeeId, 'dt' => $date, 'dt2' => $date, 'dow' => $dayOfWeek]
        );
        return $result[0] ?? null;
    }
}
