<?php

/**
 * SiamGroup V3.1 — HRM Time Report Model
 * 
 * รายงานเวลาทำงาน: Calendar Grid (21-20), Daily Breakdown, Summary
 */

class HrmTimeReport extends BaseModel
{
    protected string $table = 'hrm_time_logs';

    // ========================================
    // CALENDAR GRID (21-20)
    // ========================================

    /**
     * ปฏิทินการเข้างาน (21-20) — แสดงเป็น Grid
     * @param int $year ปี เช่น 2026
     * @param int $month เดือน เช่น 3 (หมายถึงรอบ 21 ก.พ. - 20 มี.ค.)
     * @param array $filters company_id, branch_id, search
     */
    public function getCalendar(int $year, int $month, array $filters = []): array
    {
        // คำนวณช่วงวันที่ 21-20
        $prevMonth = $month - 1;
        $prevYear = $year;
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }

        $startDate = sprintf('%04d-%02d-21', $prevYear, $prevMonth);
        $endDate   = sprintf('%04d-%02d-20', $year, $month);

        // ดึงพนักงานที่ match filter
        $empSql = "SELECT e.id as employee_id, e.employee_code, 
                          u.first_name_th, u.last_name_th, u.nickname
                   FROM hrm_employees e
                   JOIN core_users u ON e.user_id = u.id
                   WHERE e.status IN ('PROBATION','FULL_TIME')";
        $empParams = [];

        if (!empty($filters['company_id'])) {
            $empSql .= " AND e.company_id = :company_id";
            $empParams['company_id'] = $filters['company_id'];
        }
        if (!empty($filters['branch_id'])) {
            $empSql .= " AND e.branch_id = :branch_id";
            $empParams['branch_id'] = $filters['branch_id'];
        }
        if (!empty($filters['search'])) {
            $empSql .= " AND (u.first_name_th LIKE :search OR u.last_name_th LIKE :search 
                         OR u.nickname LIKE :search OR e.employee_code LIKE :search)";
            $empParams['search'] = '%' . $filters['search'] . '%';
        }
        if (!empty($filters['company_ids'])) {
            $ph = [];
            foreach ($filters['company_ids'] as $i => $cid) {
                $key = "cid_{$i}";
                $ph[] = ":{$key}";
                $empParams[$key] = $cid;
            }
            $empSql .= " AND e.company_id IN (" . implode(',', $ph) . ")";
        }
        $empSql .= " ORDER BY e.employee_code";
        $employees = $this->query($empSql, $empParams);

        if (empty($employees)) return ['employees' => [], 'period' => compact('startDate', 'endDate')];

        // ดึง time_logs ในช่วง
        $empIds = array_column($employees, 'employee_id');
        $inPlaceholders = [];
        $logParams = ['start_date' => $startDate, 'end_date' => $endDate];
        foreach ($empIds as $i => $eid) {
            $key = "eid_{$i}";
            $inPlaceholders[] = ":{$key}";
            $logParams[$key] = $eid;
        }

        $logSql = "SELECT employee_id, work_date, scan_type, scan_time, check_in_type 
                   FROM hrm_time_logs 
                   WHERE employee_id IN (" . implode(',', $inPlaceholders) . ")
                   AND work_date BETWEEN :start_date AND :end_date
                   ORDER BY employee_id, work_date, scan_time";
        $logs = $this->query($logSql, $logParams);

        // ดึง leave_requests ในช่วง
        $leaveSql = "SELECT employee_id, start_date, end_date, status, lt.name_th as leave_type
                     FROM hrm_leave_requests lr
                     JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
                     WHERE employee_id IN (" . implode(',', $inPlaceholders) . ")
                     AND status = 'APPROVED'
                     AND start_date <= :end_date AND end_date >= :start_date";
        $leaves = $this->query($leaveSql, $logParams);

        // ดึง holidays
        $holidaySql = "SELECT holiday_date, name_th FROM hrm_holidays 
                       WHERE holiday_date BETWEEN :start_date AND :end_date AND is_active = 1";
        $holidays = $this->query($holidaySql, ['start_date' => $startDate, 'end_date' => $endDate]);
        $holidayMap = [];
        foreach ($holidays as $h) {
            $holidayMap[$h['holiday_date']] = $h['name_th'];
        }

        // จัด log เป็น map: employee_id => date => [IN, OUT]
        $logMap = [];
        foreach ($logs as $log) {
            $eid = $log['employee_id'];
            $date = $log['work_date'];
            if (!isset($logMap[$eid])) $logMap[$eid] = [];
            if (!isset($logMap[$eid][$date])) $logMap[$eid][$date] = [];
            $logMap[$eid][$date][$log['scan_type']] = $log['scan_time'];
        }

        // จัด leave map
        $leaveMap = [];
        foreach ($leaves as $lv) {
            $eid = $lv['employee_id'];
            $start = new \DateTime($lv['start_date']);
            $end = new \DateTime($lv['end_date']);
            while ($start <= $end) {
                $d = $start->format('Y-m-d');
                $leaveMap[$eid][$d] = $lv['leave_type'];
                $start->modify('+1 day');
            }
        }

        return [
            'employees' => $employees,
            'logs'      => $logMap,
            'leaves'    => $leaveMap,
            'holidays'  => $holidayMap,
            'period'    => compact('startDate', 'endDate'),
        ];
    }

    // ========================================
    // DAILY BREAKDOWN (รายบุคคล)
    // ========================================

    /**
     * Daily Breakdown — แสดงรายวันของพนักงาน 1 คน
     */
    public function getDailyBreakdown(int $employeeId, string $startDate, string $endDate): array
    {
        // Time logs
        $logs = $this->query(
            "SELECT work_date, scan_type, scan_time, check_in_type, 
                    latitude, longitude, location_name, is_verified_location
             FROM hrm_time_logs 
             WHERE employee_id = :emp_id AND work_date BETWEEN :start AND :end
             ORDER BY work_date, scan_time",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // Shift info
        $shift = $this->query(
            "SELECT s.start_time, s.end_time, s.late_grace_minutes 
             FROM hrm_employee_shifts es
             JOIN hrm_shifts s ON es.shift_id = s.id
             WHERE es.employee_id = :emp_id 
             AND es.effective_date <= :end
             AND (es.end_date IS NULL OR es.end_date >= :start)
             ORDER BY es.effective_date DESC LIMIT 1",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // Leave requests
        $leaves = $this->query(
            "SELECT lr.start_date, lr.end_date, lr.total_days, lr.status, lt.name_th as leave_type
             FROM hrm_leave_requests lr
             JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.employee_id = :emp_id AND lr.status = 'APPROVED'
             AND lr.start_date <= :end AND lr.end_date >= :start",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // OT requests
        $ots = $this->query(
            "SELECT ot_date, start_time, end_time, total_hours, ot_type
             FROM hrm_ot_requests
             WHERE employee_id = :emp_id AND status = 'APPROVED'
             AND ot_date BETWEEN :start AND :end",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // Remarks
        $remarks = $this->query(
            "SELECT remark_date, remark 
             FROM hrm_user_daily_remarks 
             WHERE employee_id = :emp_id AND remark_date BETWEEN :start AND :end",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // Holidays
        $holidays = $this->query(
            "SELECT holiday_date, name_th FROM hrm_holidays 
             WHERE holiday_date BETWEEN :start AND :end AND is_active = 1",
            ['start' => $startDate, 'end' => $endDate]
        );

        // Personal off days
        $offDays = $this->query(
            "SELECT day_off_date, description FROM hrm_personal_off_days
             WHERE employee_id = :emp_id AND day_off_date BETWEEN :start AND :end",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        return [
            'logs'      => $logs,
            'shift'     => $shift[0] ?? null,
            'leaves'    => $leaves,
            'ots'       => $ots,
            'remarks'   => $remarks,
            'holidays'  => $holidays,
            'off_days'  => $offDays,
        ];
    }

    // ========================================
    // SUMMARY (สรุปรายบุคคล)
    // ========================================

    /**
     * สรุปรายบุคคลในรอบ 21-20
     */
    public function getSummary(int $employeeId, string $startDate, string $endDate): array
    {
        // จำนวนวันที่มาทำงาน
        $workDays = $this->query(
            "SELECT COUNT(DISTINCT work_date) as total FROM hrm_time_logs
             WHERE employee_id = :emp_id AND scan_type = 'IN' 
             AND work_date BETWEEN :start AND :end",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        )[0]['total'] ?? 0;

        // จำนวนครั้ง/นาทีมาสาย
        $lateData = $this->query(
            "SELECT tl.work_date, tl.scan_time, s.start_time, s.late_grace_minutes
             FROM hrm_time_logs tl
             JOIN hrm_employee_shifts es ON tl.employee_id = es.employee_id
             JOIN hrm_shifts s ON es.shift_id = s.id
             WHERE tl.employee_id = :emp_id AND tl.scan_type = 'IN'
             AND tl.work_date BETWEEN :start AND :end
             AND es.effective_date <= tl.work_date
             AND (es.end_date IS NULL OR es.end_date >= tl.work_date)",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        $lateCount = 0;
        $lateMinutes = 0;
        foreach ($lateData as $row) {
            $scanTime = date('H:i:s', strtotime($row['scan_time']));
            $shiftStart = $row['start_time'];
            $grace = (int)$row['late_grace_minutes'];

            $shiftSec = strtotime($shiftStart) + ($grace * 60);
            $scanSec = strtotime($scanTime);

            if ($scanSec > $shiftSec) {
                $lateCount++;
                $lateMinutes += round(($scanSec - $shiftSec) / 60);
            }
        }

        // สรุปการลา (แยกประเภท)
        $leaveSum = $this->query(
            "SELECT lt.name_th, SUM(lr.total_days) as total_days
             FROM hrm_leave_requests lr
             JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
             WHERE lr.employee_id = :emp_id AND lr.status = 'APPROVED'
             AND lr.start_date <= :end AND lr.end_date >= :start
             GROUP BY lt.id, lt.name_th",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        );

        // สรุป OT
        $otSum = $this->query(
            "SELECT SUM(total_hours) as total_hours FROM hrm_ot_requests
             WHERE employee_id = :emp_id AND status = 'APPROVED'
             AND ot_date BETWEEN :start AND :end",
            ['emp_id' => $employeeId, 'start' => $startDate, 'end' => $endDate]
        )[0]['total_hours'] ?? 0;

        // สิทธิ์ลาคงเหลือ
        $quotas = $this->query(
            "SELECT lt.name_th, q.quota_days, q.used_days, 
                    (q.quota_days + q.carried_days - q.used_days) as remaining
             FROM hrm_employee_leave_quotas q
             JOIN hrm_leave_types lt ON q.leave_type_id = lt.id
             WHERE q.employee_id = :emp_id AND q.year = :year",
            ['emp_id' => $employeeId, 'year' => date('Y')]
        );

        return [
            'work_days'    => (int) $workDays,
            'late_count'   => $lateCount,
            'late_minutes' => $lateMinutes,
            'leave_summary' => $leaveSum,
            'ot_hours'     => (float) $otSum,
            'leave_quotas' => $quotas,
        ];
    }

    // ========================================
    // REMARKS (HR กรอก)
    // ========================================

    public function upsertRemark(int $employeeId, string $date, string $remark, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_user_daily_remarks (employee_id, remark_date, remark, created_by)
             VALUES (:emp_id, :date, :remark, :user_id)
             ON DUPLICATE KEY UPDATE remark = :remark2, created_by = :user_id2"
        );
        return $stmt->execute([
            'emp_id'   => $employeeId,
            'date'     => $date,
            'remark'   => $remark,
            'user_id'  => $userId,
            'remark2'  => $remark,
            'user_id2' => $userId,
        ]);
    }
}
