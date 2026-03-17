<?php

/**
 * SiamGroup V3.1 — HRM Employee Model
 * 
 * จัดการข้อมูลพนักงาน (CRUD + Search + Documents)
 * Dependencies: core_users, core_companies, core_branches, core_levels
 */

class HrmEmployee extends BaseModel
{
    protected string $table = 'hrm_employees';

    // ========================================
    // LIST / SEARCH
    // ========================================

    /**
     * รายชื่อพนักงาน (พร้อม Filter)
     */
    public function getEmployees(array $filters = []): array
    {
        $sql = "SELECT 
                    e.id, e.employee_code, e.company_id, e.branch_id, e.level_id,
                    e.manager_id, e.status, e.start_date, e.end_date,
                    e.salary_type, e.base_salary,
                    u.id as user_id, u.username, u.first_name_th, u.last_name_th,
                    u.first_name_en, u.last_name_en, u.nickname,
                    u.email, u.phone, u.avatar_url, u.gender, u.birth_date,
                    u.is_admin, u.is_active as user_is_active,
                    c.code as company_code, c.name_th as company_name,
                    b.name_th as branch_name, b.code as branch_code,
                    l.name as level_name, l.level_score,
                    r.name_th as role_name
                FROM hrm_employees e
                JOIN core_users u ON e.user_id = u.id
                JOIN core_companies c ON e.company_id = c.id
                JOIN core_branches b ON e.branch_id = b.id
                JOIN core_levels l ON e.level_id = l.id
                JOIN core_roles r ON l.role_id = r.id";

        $where = [];
        $params = [];

        if (!empty($filters['company_id'])) {
            $where[] = "e.company_id = :company_id";
            $params['company_id'] = $filters['company_id'];
        }
        if (!empty($filters['branch_id'])) {
            $where[] = "e.branch_id = :branch_id";
            $params['branch_id'] = $filters['branch_id'];
        }
        if (!empty($filters['status'])) {
            $where[] = "e.status = :status";
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(u.first_name_th LIKE :search OR u.last_name_th LIKE :search 
                         OR u.nickname LIKE :search OR e.employee_code LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        // Company visibility filter
        if (!empty($filters['company_ids'])) {
            $placeholders = [];
            foreach ($filters['company_ids'] as $i => $cid) {
                $key = "cid_{$i}";
                $placeholders[] = ":{$key}";
                $params[$key] = $cid;
            }
            $where[] = "e.company_id IN (" . implode(',', $placeholders) . ")";
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }

        $sql .= " ORDER BY e.company_id, e.employee_code";

        return $this->query($sql, $params);
    }

    /**
     * รายละเอียดพนักงาน 1 คน
     */
    public function getEmployee(int $id): ?array
    {
        $sql = "SELECT 
                    e.*, 
                    u.username, u.first_name_th, u.last_name_th,
                    u.first_name_en, u.last_name_en, u.nickname,
                    u.email, u.phone, u.avatar_url, u.gender, u.birth_date,
                    u.is_admin, u.is_active as user_is_active,
                    c.code as company_code, c.name_th as company_name,
                    b.name_th as branch_name, b.code as branch_code,
                    l.name as level_name, l.level_score,
                    r.name_th as role_name,
                    mgr_u.first_name_th as manager_first_name, mgr_u.last_name_th as manager_last_name
                FROM hrm_employees e
                JOIN core_users u ON e.user_id = u.id
                JOIN core_companies c ON e.company_id = c.id
                JOIN core_branches b ON e.branch_id = b.id
                JOIN core_levels l ON e.level_id = l.id
                JOIN core_roles r ON l.role_id = r.id
                LEFT JOIN hrm_employees mgr ON e.manager_id = mgr.id
                LEFT JOIN core_users mgr_u ON mgr.user_id = mgr_u.id
                WHERE e.id = :id LIMIT 1";
        $rows = $this->query($sql, ['id' => $id]);
        return $rows[0] ?? null;
    }

    // ========================================
    // CREATE (พนักงานใหม่ = core_users + hrm_employees)
    // ========================================

    public function createEmployee(array $data): int
    {
        $this->db->beginTransaction();
        try {
            // 1. สร้าง core_users
            $stmt = $this->db->prepare(
                "INSERT INTO core_users (username, password_hash, first_name_th, last_name_th, 
                 first_name_en, last_name_en, nickname, email, phone, gender, birth_date, is_admin)
                 VALUES (:username, :password_hash, :first_name_th, :last_name_th,
                 :first_name_en, :last_name_en, :nickname, :email, :phone, :gender, :birth_date, :is_admin)"
            );
            $stmt->execute([
                'username'      => $data['username'],
                'password_hash' => password_hash($data['password'] ?? '1234', PASSWORD_BCRYPT, ['cost' => 12]),
                'first_name_th' => $data['first_name_th'],
                'last_name_th'  => $data['last_name_th'],
                'first_name_en' => $data['first_name_en'] ?? null,
                'last_name_en'  => $data['last_name_en'] ?? null,
                'nickname'      => $data['nickname'] ?? null,
                'email'         => $data['email'] ?? null,
                'phone'         => $data['phone'] ?? null,
                'gender'        => $data['gender'] ?? null,
                'birth_date'    => $data['birth_date'] ?? null,
                'is_admin'      => $data['is_admin'] ?? 0,
            ]);
            $userId = (int) $this->db->lastInsertId();

            // 2. สร้าง hrm_employees
            $stmt = $this->db->prepare(
                "INSERT INTO hrm_employees (user_id, employee_code, company_id, branch_id, level_id,
                 manager_id, status, start_date, salary_type, base_salary)
                 VALUES (:user_id, :employee_code, :company_id, :branch_id, :level_id,
                 :manager_id, :status, :start_date, :salary_type, :base_salary)"
            );
            $stmt->execute([
                'user_id'       => $userId,
                'employee_code' => $data['employee_code'],
                'company_id'    => $data['company_id'],
                'branch_id'     => $data['branch_id'],
                'level_id'      => $data['level_id'],
                'manager_id'    => $data['manager_id'] ?? null,
                'status'        => $data['status'] ?? 'PROBATION',
                'start_date'    => $data['start_date'],
                'salary_type'   => $data['salary_type'] ?? 'MONTHLY',
                'base_salary'   => $data['base_salary'] ?? 0,
            ]);
            $empId = (int) $this->db->lastInsertId();

            // 3. กำหนดสิทธิ์ default (level_permissions)
            $this->db->prepare(
                "INSERT IGNORE INTO core_level_permissions (level_id, app_structure_id)
                 SELECT :level_id, app_structure_id FROM core_level_permissions WHERE level_id = :level_id"
            )->execute(['level_id' => $data['level_id']]);

            $this->db->commit();
            return $empId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ========================================
    // UPDATE
    // ========================================

    public function updateEmployee(int $id, array $data): bool
    {
        $this->db->beginTransaction();
        try {
            // Get employee & user_id
            $emp = $this->find($id);
            if (!$emp) throw new \Exception('ไม่พบพนักงาน');

            // Update core_users fields
            $userFields = [];
            $userParams = ['user_id' => $emp['user_id']];
            $userCols = [
                'first_name_th',
                'last_name_th',
                'first_name_en',
                'last_name_en',
                'nickname',
                'email',
                'phone',
                'gender',
                'birth_date',
                'is_admin'
            ];
            foreach ($userCols as $col) {
                if (array_key_exists($col, $data)) {
                    $userFields[] = "`{$col}` = :{$col}";
                    $userParams[$col] = $data[$col];
                }
            }
            if (!empty($userFields)) {
                $sql = "UPDATE core_users SET " . implode(', ', $userFields) . " WHERE id = :user_id";
                $this->db->prepare($sql)->execute($userParams);
            }

            // Update hrm_employees fields
            $empFields = [];
            $empParams = ['emp_id' => $id];
            $empCols = [
                'employee_code',
                'company_id',
                'branch_id',
                'level_id',
                'manager_id',
                'status',
                'start_date',
                'end_date',
                'salary_type',
                'base_salary'
            ];
            foreach ($empCols as $col) {
                if (array_key_exists($col, $data)) {
                    $empFields[] = "`{$col}` = :{$col}";
                    $empParams[$col] = $data[$col];
                }
            }
            if (!empty($empFields)) {
                $sql = "UPDATE hrm_employees SET " . implode(', ', $empFields) . " WHERE id = :emp_id";
                $this->db->prepare($sql)->execute($empParams);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ========================================
    // DOCUMENTS
    // ========================================

    public function getDocuments(int $employeeId): array
    {
        return $this->query(
            "SELECT d.*, u.first_name_th as uploader_name
             FROM hrm_employee_documents d
             JOIN core_users u ON d.uploaded_by = u.id
             WHERE d.employee_id = :emp_id ORDER BY d.created_at DESC",
            ['emp_id' => $employeeId]
        );
    }

    public function createDocument(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO hrm_employee_documents (employee_id, document_type, file_name, file_path, 
             file_size, mime_type, description, uploaded_by)
             VALUES (:employee_id, :document_type, :file_name, :file_path,
             :file_size, :mime_type, :description, :uploaded_by)"
        );
        $stmt->execute($data);
        return (int) $this->db->lastInsertId();
    }

    public function deleteDocument(int $docId): bool
    {
        return $this->execute("DELETE FROM hrm_employee_documents WHERE id = :id", ['id' => $docId]);
    }

    /**
     * ดึงเอกสาร 1 รายการ (สำหรับ download/delete)
     */
    public function getDocument(int $docId): ?array
    {
        $rows = $this->query(
            "SELECT * FROM hrm_employee_documents WHERE id = :id LIMIT 1",
            ['id' => $docId]
        );
        return $rows[0] ?? null;
    }

    // ========================================
    // HELPERS
    // ========================================

    /**
     * ดึง subordinates ตาม manager chain
     */
    public function getSubordinates(int $managerId): array
    {
        return $this->query(
            "SELECT e.id, e.employee_code, u.first_name_th, u.last_name_th, u.nickname
             FROM hrm_employees e
             JOIN core_users u ON e.user_id = u.id
             WHERE e.manager_id = :mgr_id AND e.status IN ('PROBATION','FULL_TIME')
             ORDER BY e.employee_code",
            ['mgr_id' => $managerId]
        );
    }

    /**
     * ดึง employee_id จาก user_id
     */
    public function getByUserId(int $userId): ?array
    {
        return $this->findWhere(['user_id' => $userId]);
    }
}
