<?php

/**
 * SiamGroup V3.1 — HRM Schedule & Holiday Model
 * 
 * จัดการตารางกะ, วันหยุด, วันหยุดส่วนตัว
 */

class HrmSchedule extends BaseModel
{
    protected string $table = 'hrm_shifts';

    // ========================================
    // SHIFTS (กะการทำงาน)
    // ========================================

    public function getShifts(?int $companyId = null): array
    {
        $sql = "SELECT s.*, c.code as company_code, c.name_th as company_name
                FROM hrm_shifts s
                JOIN core_companies c ON s.company_id = c.id
                WHERE s.is_active = 1";
        $params = [];
        if ($companyId) {
            $sql .= " AND s.company_id = :cid";
            $params['cid'] = $companyId;
        }
        $sql .= " ORDER BY s.company_id, s.code";
        return $this->query($sql, $params);
    }

    public function createShift(array $data): int
    {
        return $this->create($data);
    }

    public function updateShift(int $id, array $data): bool
    {
        $allowed = [
            'code',
            'name_th',
            'name_en',
            'start_time',
            'end_time',
            'break_minutes',
            'work_hours',
            'is_overnight',
            'late_grace_minutes',
            'is_active'
        ];
        $filtered = array_intersect_key($data, array_flip($allowed));
        return $this->update($id, $filtered);
    }

    // ========================================
    // EMPLOYEE SHIFTS (กำหนดกะให้พนักงาน)
    // ========================================

    public function getEmployeeShifts(int $employeeId): array
    {
        return $this->query(
            "SELECT es.*, s.code as shift_code, s.name_th as shift_name, 
                    s.start_time, s.end_time
             FROM hrm_employee_shifts es
             JOIN hrm_shifts s ON es.shift_id = s.id
             WHERE es.employee_id = :eid ORDER BY es.effective_date DESC",
            ['eid' => $employeeId]
        );
    }

    public function assignShift(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_employee_shifts (employee_id, shift_id, effective_date, end_date, day_of_week)
             VALUES (:employee_id, :shift_id, :effective_date, :end_date, :day_of_week)"
        );
        $stmt->execute([
            'employee_id'    => $data['employee_id'],
            'shift_id'       => $data['shift_id'],
            'effective_date' => $data['effective_date'],
            'end_date'       => $data['end_date'] ?? null,
            'day_of_week'    => $data['day_of_week'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function bulkAssignShift(array $employeeIds, int $shiftId, string $effectiveDate, ?string $endDate = null): int
    {
        $count = 0;
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_employee_shifts (employee_id, shift_id, effective_date, end_date)
             VALUES (:eid, :sid, :edate, :end_date)"
        );
        foreach ($employeeIds as $eid) {
            $stmt->execute([
                'eid'      => $eid,
                'sid'      => $shiftId,
                'edate'    => $effectiveDate,
                'end_date' => $endDate,
            ]);
            $count++;
        }
        return $count;
    }

    // ========================================
    // HOLIDAYS (วันหยุดบริษัท)
    // ========================================

    public function getHolidays(?int $companyId = null, ?int $year = null): array
    {
        $sql = "SELECT h.*, c.code as company_code, c.name_th as company_name
                FROM hrm_holidays h
                JOIN core_companies c ON h.company_id = c.id
                WHERE h.is_active = 1";
        $params = [];
        if ($companyId) {
            $sql .= " AND h.company_id = :cid";
            $params['cid'] = $companyId;
        }
        if ($year) {
            $sql .= " AND YEAR(h.holiday_date) = :year";
            $params['year'] = $year;
        }
        $sql .= " ORDER BY h.holiday_date";
        return $this->query($sql, $params);
    }

    public function createHoliday(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_holidays (company_id, holiday_date, name_th, name_en, holiday_type)
             VALUES (:company_id, :holiday_date, :name_th, :name_en, :holiday_type)"
        );
        $stmt->execute([
            'company_id'   => $data['company_id'],
            'holiday_date' => $data['holiday_date'],
            'name_th'      => $data['name_th'],
            'name_en'      => $data['name_en'] ?? null,
            'holiday_type' => $data['holiday_type'] ?? 'NATIONAL',
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateHoliday(int $id, array $data): bool
    {
        $allowed = ['holiday_date', 'name_th', 'name_en', 'holiday_type', 'is_active'];
        $filtered = array_intersect_key($data, array_flip($allowed));
        $stmt = $this->db->prepare("SELECT id FROM hrm_holidays WHERE id = :id");
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) return false;

        $sets = [];
        $params = ['_id' => $id];
        foreach ($filtered as $k => $v) {
            $sets[] = "`{$k}` = :{$k}";
            $params[$k] = $v;
        }
        if (empty($sets)) return false;
        return $this->execute("UPDATE hrm_holidays SET " . implode(', ', $sets) . " WHERE id = :_id", $params);
    }

    public function deleteHoliday(int $id): bool
    {
        return $this->execute("DELETE FROM hrm_holidays WHERE id = :id", ['id' => $id]);
    }

    // ========================================
    // PERSONAL OFF DAYS (วันหยุดส่วนตัว)
    // ========================================

    public function getPersonalOffDays(int $employeeId, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = "SELECT p.*, u.first_name_th as creator_name
                FROM hrm_personal_off_days p
                JOIN core_users u ON p.created_by = u.id
                WHERE p.employee_id = :eid";
        $params = ['eid' => $employeeId];

        if ($startDate && $endDate) {
            $sql .= " AND p.day_off_date BETWEEN :start AND :end";
            $params['start'] = $startDate;
            $params['end'] = $endDate;
        }
        $sql .= " ORDER BY p.day_off_date";
        return $this->query($sql, $params);
    }

    public function createPersonalOffDay(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_personal_off_days (employee_id, day_off_date, description, created_by)
             VALUES (:employee_id, :day_off_date, :description, :created_by)"
        );
        $stmt->execute($data);
        return (int) $this->db->lastInsertId();
    }

    public function deletePersonalOffDay(int $id): bool
    {
        return $this->execute("DELETE FROM hrm_personal_off_days WHERE id = :id", ['id' => $id]);
    }
}
