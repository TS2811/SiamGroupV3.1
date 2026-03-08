<?php

/**
 * SiamGroup V3.1 — Dashboard Model
 * 
 * ดึงข้อมูลสำหรับ Dashboard: ปฏิทิน, สรุปสถิติ
 */

require_once __DIR__ . '/BaseModel.php';

class Dashboard extends BaseModel
{
    protected string $table = 'hrm_time_logs';

    /**
     * ข้อมูลปฏิทินรอบเงินเดือน + สถานะแต่ละวัน
     */
    public function getCalendarData(int $employeeId, int $month, int $year, array $shift): array
    {
        // คำนวณรอบเงินเดือน
        $prevMonth = $month - 1;
        $prevYear  = $year;
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }
        $startDate = sprintf('%04d-%02d-21', $prevYear, $prevMonth);
        $endDate   = sprintf('%04d-%02d-20', $year, $month);

        // ดึง time_logs
        $logs = $this->query(
            "SELECT * FROM `hrm_time_logs` 
             WHERE `employee_id` = :emp 
               AND `work_date` BETWEEN :start AND :end 
             ORDER BY `work_date`, `scan_time`",
            ['emp' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // ดึงวันหยุด
        $holidays = $this->query(
            "SELECT `holiday_date`, `name_th` FROM `hrm_holidays` 
             WHERE `holiday_date` BETWEEN :start AND :end AND `is_active` = 1",
            ['start' => $startDate, 'end' => $endDate]
        );
        $holidayMap = [];
        foreach ($holidays as $h) {
            $holidayMap[$h['holiday_date']] = $h['name_th'];
        }

        // ดึงวันลาที่ APPROVED
        $leaves = $this->query(
            "SELECT lr.`start_date`, lr.`end_date`, lt.`name_th` as leave_name
             FROM `hrm_leave_requests` lr
             JOIN `hrm_leave_types` lt ON lt.`id` = lr.`leave_type_id`
             WHERE lr.`employee_id` = :emp 
               AND lr.`status` = 'APPROVED'
               AND lr.`start_date` <= :end 
               AND lr.`end_date` >= :start",
            ['emp' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // จัดกลุ่ม logs ตามวัน
        $dayLogs = [];
        foreach ($logs as $log) {
            $d = $log['work_date'];
            if (!isset($dayLogs[$d])) $dayLogs[$d] = [];
            $dayLogs[$d][] = $log;
        }

        // สร้าง leave map (วัน → ชื่อประเภทลา)
        $leaveMap = [];
        foreach ($leaves as $leave) {
            $current = new \DateTime($leave['start_date']);
            $endDt   = new \DateTime($leave['end_date']);
            while ($current <= $endDt) {
                $leaveMap[$current->format('Y-m-d')] = $leave['leave_name'];
                $current->modify('+1 day');
            }
        }

        // สร้างข้อมูลแต่ละวัน
        $shiftStart = $shift['start_time'] ?? '08:30:00';
        $graceMin   = (int)($shift['late_grace_minutes'] ?? 0);
        $shiftEnd   = $shift['end_time'] ?? '17:30:00';
        $today = date('Y-m-d');

        $days = [];
        $current = new \DateTime($startDate);
        $end     = new \DateTime($endDate);

        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            $dayOfWeek = (int)$current->format('w'); // 0=Sun
            $isWeekend = ($dayOfWeek === 0); // อาทิตย์ = หยุด (ปรับตามบริษัท)

            $dayData = [
                'date'       => $dateStr,
                'day_of_week' => $dayOfWeek,
                'status'     => 'FUTURE',
                'in'         => null,
                'out'        => null,
                'is_holiday' => isset($holidayMap[$dateStr]),
                'is_weekend' => $isWeekend,
                'holiday_name' => $holidayMap[$dateStr] ?? null,
                'leave_name' => $leaveMap[$dateStr] ?? null,
            ];

            if ($dateStr > $today) {
                $dayData['status'] = 'FUTURE';
            } elseif (isset($holidayMap[$dateStr])) {
                $dayData['status'] = 'HOLIDAY';
            } elseif (isset($leaveMap[$dateStr])) {
                $dayData['status'] = 'LEAVE';
            } elseif ($isWeekend) {
                $dayData['status'] = 'WEEKEND';
            } elseif (isset($dayLogs[$dateStr])) {
                $dLogs = $dayLogs[$dateStr];
                $inTime = null;
                $outTime = null;
                foreach ($dLogs as $l) {
                    if ($l['scan_type'] === 'IN' && !$inTime) $inTime = $l['scan_time'];
                    if ($l['scan_type'] === 'OUT') $outTime = $l['scan_time'];
                }
                $dayData['in']  = $inTime ? date('H:i', strtotime($inTime)) : null;
                $dayData['out'] = $outTime ? date('H:i', strtotime($outTime)) : null;

                if ($inTime && $outTime) {
                    // มีทั้ง IN และ OUT — ตรวจสาย
                    $inTimeOnly = date('H:i:s', strtotime($inTime));
                    $lateSeconds = strtotime($inTimeOnly) - strtotime($shiftStart);
                    $lateMins = $lateSeconds / 60;

                    // ตรวจ OUT ก่อนเวลา
                    $outTimeOnly = date('H:i:s', strtotime($outTime));
                    $earlySeconds = strtotime($shiftEnd) - strtotime($outTimeOnly);

                    if ($lateMins <= $graceMin) {
                        $dayData['status'] = 'ON_TIME';
                    } elseif ($lateMins <= 15) {
                        $dayData['status'] = 'LATE_MINOR';
                    } else {
                        $dayData['status'] = 'LATE_MAJOR';
                    }

                    if ($earlySeconds > 300) { // ออกก่อน > 5 นาที
                        $dayData['status'] = 'EARLY_OUT';
                    }
                } elseif ($inTime && !$outTime) {
                    if ($dateStr === $today) {
                        $dayData['status'] = 'WORKING'; // ยังทำงานอยู่
                    } else {
                        $dayData['status'] = 'FORGOT_OUT';
                    }
                }
            } else {
                // ไม่มี log, ไม่มีลา, ไม่มีวันหยุด = ขาดงาน
                $dayData['status'] = 'ABSENT';
            }

            $days[] = $dayData;
            $current->modify('+1 day');
        }

        return [
            'cycle_start' => $startDate,
            'cycle_end'   => $endDate,
            'month'       => $month,
            'year'        => $year,
            'days'        => $days,
        ];
    }

    /**
     * สรุปสถิติ — สำหรับหัวหน้า (ลูกน้อง) หรือตัวเอง
     */
    public function getSummary(int $employeeId, int $companyId): array
    {
        $today = date('Y-m-d');

        // จำนวนพนักงานทั้งหมดในบริษัท
        $totalEmp = $this->query(
            "SELECT COUNT(*) as total FROM `hrm_employees` 
             WHERE `company_id` = :cid AND `status` IN ('PROBATION','FULL_TIME')",
            ['cid' => $companyId]
        );

        // มาทำงานวันนี้
        $presentToday = $this->query(
            "SELECT COUNT(DISTINCT tl.`employee_id`) as total 
             FROM `hrm_time_logs` tl
             JOIN `hrm_employees` e ON e.`id` = tl.`employee_id`
             WHERE tl.`work_date` = :today AND tl.`scan_type` = 'IN' 
               AND e.`company_id` = :cid",
            ['today' => $today, 'cid' => $companyId]
        );

        // ลาวันนี้
        $onLeave = $this->query(
            "SELECT COUNT(DISTINCT lr.`employee_id`) as total 
             FROM `hrm_leave_requests` lr
             JOIN `hrm_employees` e ON e.`id` = lr.`employee_id`
             WHERE lr.`status` = 'APPROVED' 
               AND :today BETWEEN lr.`start_date` AND lr.`end_date`
               AND e.`company_id` = :cid",
            ['today' => $today, 'cid' => $companyId]
        );

        // มาสายวันนี้
        $lateToday = $this->query(
            "SELECT COUNT(DISTINCT tl.`employee_id`) as total 
             FROM `hrm_time_logs` tl
             JOIN `hrm_employees` e ON e.`id` = tl.`employee_id`
             JOIN `hrm_employee_shifts` es ON es.`employee_id` = e.`id`
               AND es.`effective_date` <= :today AND (es.`end_date` IS NULL OR es.`end_date` >= :today2)
             JOIN `hrm_shifts` s ON s.`id` = es.`shift_id`
             WHERE tl.`work_date` = :today3 AND tl.`scan_type` = 'IN'
               AND e.`company_id` = :cid
               AND TIME(tl.`scan_time`) > ADDTIME(s.`start_time`, SEC_TO_TIME(s.`late_grace_minutes` * 60))",
            ['today' => $today, 'today2' => $today, 'today3' => $today, 'cid' => $companyId]
        );

        // คำร้องรออนุมัติ
        $pendingRequests = $this->query(
            "SELECT COUNT(*) as total FROM (
                SELECT id FROM `hrm_leave_requests` WHERE `employee_id` = :eid AND `status` = 'PENDING'
                UNION ALL
                SELECT id FROM `hrm_ot_requests` WHERE `employee_id` = :eid2 AND `status` = 'PENDING'
                UNION ALL
                SELECT id FROM `hrm_time_correction_requests` WHERE `employee_id` = :eid3 AND `status` = 'PENDING'
                UNION ALL
                SELECT id FROM `hrm_shift_swap_requests` WHERE `requester_id` = :eid4 AND `status` = 'PENDING'
            ) as pending",
            ['eid' => $employeeId, 'eid2' => $employeeId, 'eid3' => $employeeId, 'eid4' => $employeeId]
        );

        $total   = (int)($totalEmp[0]['total'] ?? 0);
        $present = (int)($presentToday[0]['total'] ?? 0);
        $leave   = (int)($onLeave[0]['total'] ?? 0);
        $late    = (int)($lateToday[0]['total'] ?? 0);
        $absent  = $total - $present - $leave;
        if ($absent < 0) $absent = 0;

        return [
            'total_employees' => $total,
            'present'         => $present,
            'absent'          => max($absent, 0),
            'on_leave'        => $leave,
            'late'            => $late,
            'pending_requests' => (int)($pendingRequests[0]['total'] ?? 0),
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
     * ดึง company_id ของพนักงาน
     */
    public function getCompanyId(int $employeeId): ?int
    {
        $result = $this->query(
            "SELECT `company_id` FROM `hrm_employees` WHERE `id` = :eid LIMIT 1",
            ['eid' => $employeeId]
        );
        return $result[0]['company_id'] ?? null;
    }

    /**
     * ดึงกะปัจจุบัน
     */
    public function getEmployeeShift(int $employeeId): ?array
    {
        $today = date('Y-m-d');
        $result = $this->query(
            "SELECT s.* FROM `hrm_shifts` s
             JOIN `hrm_employee_shifts` es ON es.`shift_id` = s.`id`
             WHERE es.`employee_id` = :eid
               AND es.`effective_date` <= :dt
               AND (es.`end_date` IS NULL OR es.`end_date` >= :dt2)
             ORDER BY es.`effective_date` DESC LIMIT 1",
            ['eid' => $employeeId, 'dt' => $today, 'dt2' => $today]
        );
        return $result[0] ?? null;
    }
}
