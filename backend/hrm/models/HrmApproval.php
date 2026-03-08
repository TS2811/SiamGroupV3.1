<?php

/**
 * SiamGroup V3.1 — HRM Approval Model
 * 
 * อนุมัติคำร้อง: ลา, OT, แก้เวลา, สลับกะ (ฝั่ง HR/หัวหน้า)
 */

class HrmApproval extends BaseModel
{
    protected string $table = 'hrm_leave_requests';

    // ========================================
    // LIST (รวมทุกประเภท)
    // ========================================

    /**
     * รายการคำร้องทั้งหมด (Filter: type, status, date)
     */
    public function getApprovals(array $filters = []): array
    {
        $results = [];
        $types = $filters['type'] ?? 'all';

        if ($types === 'all' || $types === 'leave') {
            $results = array_merge($results, $this->getLeaveRequests($filters));
        }
        if ($types === 'all' || $types === 'ot') {
            $results = array_merge($results, $this->getOtRequests($filters));
        }
        if ($types === 'all' || $types === 'time_correction') {
            $results = array_merge($results, $this->getTimeCorrectionRequests($filters));
        }
        if ($types === 'all' || $types === 'shift_swap') {
            $results = array_merge($results, $this->getShiftSwapRequests($filters));
        }

        // Sort by created_at DESC
        usort($results, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return $results;
    }

    private function getLeaveRequests(array $filters): array
    {
        $sql = "SELECT lr.id, 'leave' as request_type, lr.status, lr.created_at,
                       lr.start_date, lr.end_date, lr.total_days, lr.reason, lr.is_urgent,
                       lt.name_th as type_name,
                       e.employee_code, u.first_name_th, u.last_name_th, u.nickname
                FROM hrm_leave_requests lr
                JOIN hrm_leave_types lt ON lr.leave_type_id = lt.id
                JOIN hrm_employees e ON lr.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE 1=1";
        $params = [];
        $this->applyFilters($sql, $params, $filters, 'lr');
        return $this->query($sql . " ORDER BY lr.created_at DESC", $params);
    }

    private function getOtRequests(array $filters): array
    {
        $sql = "SELECT ot.id, 'ot' as request_type, ot.status, ot.created_at,
                       ot.ot_date as start_date, ot.ot_date as end_date,
                       ot.total_hours, ot.reason, ot.ot_type as type_name,
                       e.employee_code, u.first_name_th, u.last_name_th, u.nickname
                FROM hrm_ot_requests ot
                JOIN hrm_employees e ON ot.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE 1=1";
        $params = [];
        $this->applyFilters($sql, $params, $filters, 'ot');
        return $this->query($sql . " ORDER BY ot.created_at DESC", $params);
    }

    private function getTimeCorrectionRequests(array $filters): array
    {
        $sql = "SELECT tc.id, 'time_correction' as request_type, tc.status, tc.created_at,
                       tc.correction_date as start_date, tc.correction_date as end_date,
                       tc.correction_type as type_name, tc.reason,
                       tc.original_time, tc.corrected_time,
                       e.employee_code, u.first_name_th, u.last_name_th, u.nickname
                FROM hrm_time_correction_requests tc
                JOIN hrm_employees e ON tc.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                WHERE 1=1";
        $params = [];
        $this->applyFilters($sql, $params, $filters, 'tc');
        return $this->query($sql . " ORDER BY tc.created_at DESC", $params);
    }

    private function getShiftSwapRequests(array $filters): array
    {
        $sql = "SELECT ss.id, 'shift_swap' as request_type, ss.status, ss.created_at,
                       ss.requester_date as start_date, ss.target_date as end_date,
                       ss.reason, 'สลับกะ' as type_name,
                       e.employee_code, u.first_name_th, u.last_name_th, u.nickname,
                       tu.first_name_th as target_first_name, tu.last_name_th as target_last_name
                FROM hrm_shift_swap_requests ss
                JOIN hrm_employees e ON ss.requester_id = e.id
                JOIN core_users u ON e.user_id = u.id
                JOIN hrm_employees te ON ss.target_id = te.id
                JOIN core_users tu ON te.user_id = tu.id
                WHERE 1=1";
        $params = [];
        $this->applyFilters($sql, $params, $filters, 'ss');
        return $this->query($sql . " ORDER BY ss.created_at DESC", $params);
    }

    private function applyFilters(string &$sql, array &$params, array $filters, string $alias): void
    {
        if (!empty($filters['status'])) {
            $sql .= " AND {$alias}.status = :status";
            $params['status'] = $filters['status'];
        }
        // Manager visibility: only see subordinates
        if (!empty($filters['manager_employee_id'])) {
            $sql .= " AND e.manager_id = :mgr_id";
            $params['mgr_id'] = $filters['manager_employee_id'];
        }
    }

    // ========================================
    // APPROVE / REJECT
    // ========================================

    public function approve(string $type, int $id, int $approverId): bool
    {
        $table = $this->getTableForType($type);
        $this->execute(
            "UPDATE `{$table}` SET status = 'APPROVED', approved_by = :approver, approved_at = NOW() WHERE id = :id",
            ['id' => $id, 'approver' => $approverId]
        );

        // Side effects
        if ($type === 'leave') {
            $this->onLeaveApproved($id);
        }

        return true;
    }

    public function reject(string $type, int $id, int $approverId, ?string $reason = null): bool
    {
        $table = $this->getTableForType($type);
        return $this->execute(
            "UPDATE `{$table}` SET status = 'REJECTED', approved_by = :approver, approved_at = NOW(), reject_reason = :reason WHERE id = :id",
            ['id' => $id, 'approver' => $approverId, 'reason' => $reason]
        );
    }

    /**
     * บังคับเปลี่ยน Absent → ลา (HR force leave)
     */
    public function forceLeave(int $employeeId, string $date, int $leaveTypeId, int $hrUserId): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_leave_requests 
             (employee_id, leave_type_id, leave_format, start_date, end_date, total_days, 
              reason, status, approved_by, approved_at)
             VALUES (:emp_id, :lt_id, 'FULL_DAY', :date, :date, 1,
              'บังคับเปลี่ยนจากขาดงาน (HR)', 'APPROVED', :hr_id, NOW())"
        );
        $stmt->execute([
            'emp_id' => $employeeId,
            'lt_id'  => $leaveTypeId,
            'date'   => $date,
            'hr_id'  => $hrUserId,
        ]);
        $id = (int) $this->db->lastInsertId();
        $this->onLeaveApproved($id);
        return $id;
    }

    // ========================================
    // SIDE EFFECTS
    // ========================================

    private function onLeaveApproved(int $leaveRequestId): void
    {
        $lr = $this->query(
            "SELECT employee_id, leave_type_id, total_days FROM hrm_leave_requests WHERE id = :id",
            ['id' => $leaveRequestId]
        )[0] ?? null;

        if (!$lr) return;

        // Update used_days in quota
        $this->execute(
            "UPDATE hrm_employee_leave_quotas 
             SET used_days = used_days + :days 
             WHERE employee_id = :emp_id AND leave_type_id = :lt_id AND year = YEAR(NOW())",
            ['days' => $lr['total_days'], 'emp_id' => $lr['employee_id'], 'lt_id' => $lr['leave_type_id']]
        );
    }

    private function getTableForType(string $type): string
    {
        return match ($type) {
            'leave'           => 'hrm_leave_requests',
            'ot'              => 'hrm_ot_requests',
            'time_correction' => 'hrm_time_correction_requests',
            'shift_swap'      => 'hrm_shift_swap_requests',
            default           => throw new \Exception("Unknown request type: {$type}"),
        };
    }
}
