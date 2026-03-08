<?php

/**
 * SiamGroup V3.1 — Profile Model
 * 
 * จัดการข้อมูลส่วนตัว: ดูโปรไฟล์, แก้ contact, เปลี่ยนรหัสผ่าน
 */

require_once __DIR__ . '/BaseModel.php';

class Profile extends BaseModel
{
    protected string $table = 'core_users';

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
     * ดึงข้อมูล Profile เต็ม (user + employee + company + branch)
     */
    public function getFullProfile(int $userId): ?array
    {
        $user = $this->query(
            "SELECT u.id, u.username, u.first_name_th, u.last_name_th, 
                    u.first_name_en, u.last_name_en, u.nickname,
                    u.email, u.phone, u.avatar_url, u.level_id, u.is_admin,
                    u.created_at
             FROM core_users u 
             WHERE u.id = :uid",
            ['uid' => $userId]
        );

        if (empty($user)) return null;
        $userData = $user[0];

        // Employee data
        $emp = $this->query(
            "SELECT e.*, 
                    c.name_th AS company_name, c.name_en AS company_name_en,
                    b.name_th AS branch_name, b.latitude AS branch_lat, b.longitude AS branch_lng, b.check_radius,
                    d.name_th AS department_name,
                    p.name_th AS position_name,
                    CONCAT(m_u.first_name_th, ' ', m_u.last_name_th) AS manager_name
             FROM hrm_employees e
             LEFT JOIN core_companies c ON c.id = e.company_id
             LEFT JOIN core_branches b ON b.id = e.branch_id
             LEFT JOIN core_departments d ON d.id = e.department_id
             LEFT JOIN core_positions p ON p.id = e.position_id
             LEFT JOIN hrm_employees m ON m.id = e.manager_id
             LEFT JOIN core_users m_u ON m_u.id = m.user_id
             WHERE e.user_id = :uid",
            ['uid' => $userId]
        );

        $userData['employee'] = $emp[0] ?? null;

        return $userData;
    }

    /**
     * อัปเดต contact info (เบอร์โทร + อีเมล)
     * 
     * พนักงานแก้ได้เอง — แค่ phone, email
     */
    public function updateContact(int $userId, array $data): bool
    {
        $updateData = [];
        if (isset($data['phone'])) {
            $updateData['phone'] = $data['phone'];
        }
        if (isset($data['email'])) {
            // Validate email format
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new \RuntimeException('รูปแบบอีเมลไม่ถูกต้อง');
            }
            $updateData['email'] = $data['email'];
        }

        if (empty($updateData)) {
            throw new \RuntimeException('ไม่มีข้อมูลที่ต้องแก้ไข');
        }

        return $this->update($userId, $updateData);
    }

    /**
     * เปลี่ยนรหัสผ่าน
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): bool
    {
        // Validate new password
        if (strlen($newPassword) < 6) {
            throw new \RuntimeException('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        }

        // ดึง hash ปัจจุบัน
        $user = $this->query(
            "SELECT password FROM core_users WHERE id = :uid",
            ['uid' => $userId]
        );

        if (empty($user)) {
            throw new \RuntimeException('ไม่พบผู้ใช้');
        }

        // ตรวจรหัสผ่านเดิม
        if (!password_verify($currentPassword, $user[0]['password'])) {
            throw new \RuntimeException('รหัสผ่านปัจจุบันไม่ถูกต้อง');
        }

        // ป้องกัน reuse
        if (password_verify($newPassword, $user[0]['password'])) {
            throw new \RuntimeException('รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม');
        }

        // Hash + update
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        return $this->execute(
            "UPDATE core_users SET password = :pwd, updated_at = NOW() WHERE id = :uid",
            ['pwd' => $hashedPassword, 'uid' => $userId]
        );
    }

    /**
     * ดึงประวัติลา
     */
    public function getLeaveHistory(int $employeeId, int $year): array
    {
        return $this->query(
            "SELECT lr.*, lt.name_th AS leave_type_name
             FROM hrm_leave_requests lr
             LEFT JOIN hrm_leave_types lt ON lt.id = lr.leave_type_id
             WHERE lr.employee_id = :eid 
               AND YEAR(lr.date_from) = :yr
             ORDER BY lr.date_from DESC",
            ['eid' => $employeeId, 'yr' => $year]
        );
    }

    /**
     * ดึงประวัติ OT
     */
    public function getOTHistory(int $employeeId, int $year): array
    {
        return $this->query(
            "SELECT * FROM hrm_ot_requests
             WHERE employee_id = :eid 
               AND YEAR(work_date) = :yr
             ORDER BY work_date DESC",
            ['eid' => $employeeId, 'yr' => $year]
        );
    }

    /**
     * ดึงเอกสาร (จาก employee_documents ถ้ามี — future table)
     * ตอนนี้ return mock
     */
    public function getDocuments(int $employeeId): array
    {
        // TODO: implement when document management is ready
        return [];
    }
}
