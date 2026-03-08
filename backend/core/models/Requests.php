<?php

/**
 * SiamGroup V3.1 — Requests Model
 * 
 * จัดการคำร้อง: Leave, OT, Time Correction, Shift Swap
 */

require_once __DIR__ . '/BaseModel.php';

class Requests extends BaseModel
{
    protected string $table = 'hrm_leave_requests'; // default table, switched per type

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

    // ========================================
    // LIST — ดึงคำร้องทั้งหมดของพนักงาน
    // ========================================
    public function getMyRequests(int $employeeId, array $filters = []): array
    {
        $type = $filters['type'] ?? null;
        $status = $filters['status'] ?? null;
        $limit = (int)($filters['limit'] ?? 50);

        $results = [];

        // ดึงจากทุกตาราง แล้วรวมกัน
        $tables = [
            'LEAVE' => [
                'table' => 'hrm_leave_requests',
                'select' => "lr.*, lt.name_th AS leave_type_name",
                'join' => "LEFT JOIN hrm_leave_types lt ON lt.id = lr.leave_type_id",
                'alias' => 'lr',
            ],
            'OT' => [
                'table' => 'hrm_ot_requests',
                'select' => "lr.*",
                'join' => "",
                'alias' => 'lr',
            ],
            'TIME_CORRECTION' => [
                'table' => 'hrm_time_correction_requests',
                'select' => "lr.*",
                'join' => "",
                'alias' => 'lr',
            ],
            'SHIFT_SWAP' => [
                'table' => 'hrm_shift_swap_requests',
                'select' => "lr.*",
                'join' => "",
                'alias' => 'lr',
            ],
        ];

        // ถ้า filter ตาม type → ดึงแค่ตารางนั้น
        if ($type && isset($tables[$type])) {
            $tables = [$type => $tables[$type]];
        }

        foreach ($tables as $typeName => $cfg) {
            $sql = "SELECT {$cfg['select']}, '{$typeName}' AS request_type 
                    FROM {$cfg['table']} {$cfg['alias']} 
                    {$cfg['join']} 
                    WHERE {$cfg['alias']}.employee_id = :eid";
            $params = ['eid' => $employeeId];

            if ($status) {
                $sql .= " AND {$cfg['alias']}.status = :status";
                $params['status'] = $status;
            }

            $sql .= " ORDER BY {$cfg['alias']}.created_at DESC LIMIT :lmt";

            // PDO needs int binding for LIMIT
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':eid', $employeeId, PDO::PARAM_INT);
            if ($status) {
                $stmt->bindValue(':status', $status, PDO::PARAM_STR);
            }
            $stmt->bindValue(':lmt', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $results = array_merge($results, $rows);
        }

        // เรียงตาม created_at DESC
        usort($results, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return array_slice($results, 0, $limit);
    }

    // ========================================
    // CREATE LEAVE — ขอลา
    // ========================================
    public function createLeave(int $employeeId, array $data): int
    {
        $required = ['leave_type_id', 'date_from', 'date_to'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \RuntimeException("กรุณากรอก {$field}");
            }
        }

        // คำนวณจำนวนวัน
        $from = new \DateTime($data['date_from']);
        $to = new \DateTime($data['date_to']);
        $days = $from->diff($to)->days + 1;

        if ($data['leave_format'] === 'HOUR') {
            $days = 0.5; // ครึ่งวัน
        }

        return $this->query_insert('hrm_leave_requests', [
            'employee_id'   => $employeeId,
            'leave_type_id' => $data['leave_type_id'],
            'leave_format'  => $data['leave_format'] ?? 'DAY',
            'date_from'     => $data['date_from'],
            'date_to'       => $data['date_to'],
            'time_from'     => $data['time_from'] ?? null,
            'time_to'       => $data['time_to'] ?? null,
            'total_days'    => $days,
            'reason'        => $data['reason'] ?? null,
            'attachment'    => $data['attachment'] ?? null,
            'is_urgent'     => $data['is_urgent'] ?? 0,
            'status'        => 'PENDING',
        ]);
    }

    // ========================================
    // CREATE OT — ขอ OT
    // ========================================
    public function createOT(int $employeeId, array $data): int
    {
        $required = ['ot_type', 'work_date', 'start_time', 'end_time'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \RuntimeException("กรุณากรอก {$field}");
            }
        }

        // คำนวณชั่วโมง
        $start = new \DateTime($data['start_time']);
        $end = new \DateTime($data['end_time']);
        $hours = round(($end->getTimestamp() - $start->getTimestamp()) / 3600, 2);

        return $this->query_insert('hrm_ot_requests', [
            'employee_id' => $employeeId,
            'ot_type'     => $data['ot_type'],
            'work_date'   => $data['work_date'],
            'start_time'  => $data['start_time'],
            'end_time'    => $data['end_time'],
            'total_hours' => max($hours, 0),
            'reason'      => $data['reason'] ?? null,
            'status'      => 'PENDING',
        ]);
    }

    // ========================================
    // CREATE TIME CORRECTION — แก้เวลา
    // ========================================
    public function createTimeCorrection(int $employeeId, array $data): int
    {
        if (empty($data['work_date'])) {
            throw new \RuntimeException('กรุณาระบุวันที่');
        }

        return $this->query_insert('hrm_time_correction_requests', [
            'employee_id'      => $employeeId,
            'work_date'        => $data['work_date'],
            'original_in'     => $data['original_in'] ?? null,
            'corrected_in'    => $data['corrected_in'] ?? null,
            'original_out'    => $data['original_out'] ?? null,
            'corrected_out'   => $data['corrected_out'] ?? null,
            'reason'           => $data['reason'] ?? null,
            'attachment'       => $data['attachment'] ?? null,
            'status'           => 'PENDING',
        ]);
    }

    // ========================================
    // CREATE SHIFT SWAP — สลับกะ
    // ========================================
    public function createShiftSwap(int $employeeId, array $data): int
    {
        return $this->query_insert('hrm_shift_swap_requests', [
            'employee_id'      => $employeeId,
            'swap_type'        => $data['swap_type'] ?? 'SWAP',
            'request_date'     => $data['request_date'] ?? date('Y-m-d'),
            'target_date'      => $data['target_date'] ?? null,
            'target_employee_id' => $data['target_employee_id'] ?? null,
            'reason'           => $data['reason'] ?? null,
            'status'           => 'PENDING',
        ]);
    }

    // ========================================
    // CANCEL — ยกเลิกคำร้อง (PENDING only)
    // ========================================
    public function cancelRequest(int $requestId, string $type, int $employeeId): bool
    {
        $tableMap = [
            'LEAVE'           => 'hrm_leave_requests',
            'OT'              => 'hrm_ot_requests',
            'TIME_CORRECTION' => 'hrm_time_correction_requests',
            'SHIFT_SWAP'      => 'hrm_shift_swap_requests',
        ];

        $table = $tableMap[$type] ?? null;
        if (!$table) {
            throw new \RuntimeException('ประเภทคำร้องไม่ถูกต้อง');
        }

        // ตรวจว่าเป็นของตัวเอง + ยัง PENDING
        $row = $this->query(
            "SELECT * FROM {$table} WHERE id = :id AND employee_id = :eid LIMIT 1",
            ['id' => $requestId, 'eid' => $employeeId]
        );

        if (empty($row)) {
            throw new \RuntimeException('ไม่พบคำร้อง');
        }

        if ($row[0]['status'] !== 'PENDING') {
            throw new \RuntimeException('สามารถยกเลิกได้เฉพาะคำร้องที่ "รออนุมัติ" เท่านั้น');
        }

        return $this->execute(
            "UPDATE {$table} SET status = 'CANCELLED', updated_at = NOW() WHERE id = :id",
            ['id' => $requestId]
        );
    }

    // ========================================
    // GET LEAVE TYPES — ประเภทการลา
    // ========================================
    public function getLeaveTypes(): array
    {
        return $this->query("SELECT * FROM hrm_leave_types WHERE is_active = 1 ORDER BY id");
    }

    // ========================================
    // GET LEAVE QUOTAS — สิทธิ์วันลาของพนักงาน
    // ========================================
    public function getLeaveQuotas(int $employeeId, int $year): array
    {
        return $this->query(
            "SELECT q.*, lt.name_th AS leave_type_name
             FROM hrm_employee_leave_quotas q
             JOIN hrm_leave_types lt ON lt.id = q.leave_type_id
             WHERE q.employee_id = :eid AND q.year = :yr",
            ['eid' => $employeeId, 'yr' => $year]
        );
    }

    // ========================================
    // Helper: INSERT + return ID
    // ========================================
    private function query_insert(string $table, array $data): int
    {
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');

        $columns = array_keys($data);
        $placeholders = array_map(fn($c) => ":{$c}", $columns);

        $sql = sprintf(
            "INSERT INTO `%s` (`%s`) VALUES (%s)",
            $table,
            implode('`, `', $columns),
            implode(', ', $placeholders)
        );

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
        return (int)$this->db->lastInsertId();
    }
}
