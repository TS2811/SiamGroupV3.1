<?php

/**
 * SiamGroup V3.1 — User Model
 * 
 * จัดการ Login, Token, Profile
 */

class User extends BaseModel
{
    protected string $table = 'core_users';

    /**
     * Login — ตรวจ username/password + สร้าง JWT
     */
    public function login(string $username, string $password): array
    {
        // 1. ค้นหา user
        $user = $this->findWhere(['username' => $username, 'is_active' => 1]);

        if (!$user) {
            return [
                'success'     => false,
                'message'     => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                'error_code'  => 'AUTH_FAILED',
                'status_code' => 401,
            ];
        }

        // 2. ตรวจ Lock
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            return [
                'success'     => false,
                'message'     => 'บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง',
                'error_code'  => 'ACCOUNT_LOCKED',
                'status_code' => 403,
            ];
        }

        // 3. ตรวจ Password
        if (!password_verify($password, $user['password_hash'])) {
            $failCount = ($user['failed_login_count'] ?? 0) + 1;
            $maxAttempts = $this->getSystemConfig('LOGIN_MAX_ATTEMPTS', 5);

            $updateData = ['failed_login_count' => $failCount];

            if ($failCount >= $maxAttempts) {
                $updateData['locked_until'] = date('Y-m-d H:i:s', strtotime('+30 minutes'));
            }

            $this->update($user['id'], $updateData);

            return [
                'success'     => false,
                'message'     => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                'error_code'  => 'AUTH_FAILED',
                'status_code' => 401,
            ];
        }

        // 4. Login สำเร็จ — Reset fail count
        $this->update($user['id'], [
            'failed_login_count' => 0,
            'locked_until'       => null,
            'last_login_at'      => date('Y-m-d H:i:s'),
            'last_login_ip'      => getClientIp(),
        ]);

        // 5. ดึง Employee data
        $employee = $this->getEmployeeData($user['id']);

        // 6. สร้าง Tokens
        $tokenData = [
            'user_id'     => $user['id'],
            'employee_id' => $employee['id'] ?? null,
            'company_id'  => $employee['company_id'] ?? null,
            'branch_id'   => $employee['branch_id'] ?? null,
            'level_id'    => $employee['level_id'] ?? null,
            'is_admin'    => (bool)$user['is_admin'],
        ];

        $accessToken  = createAccessToken($tokenData);
        $refreshToken = createRefreshToken($tokenData);

        // 7. ดึง Menu Tree + Permissions
        $menuTree    = $this->getMenuTree($employee['level_id'] ?? null, $user['id']);
        $permissions = $this->getPermissions($employee['level_id'] ?? null, $user['id']);

        // 8. สร้าง user object สำหรับ frontend
        $userObj = [
            'id'            => $user['id'],
            'username'      => $user['username'],
            'first_name_th' => $user['first_name_th'],
            'last_name_th'  => $user['last_name_th'],
            'nickname'      => $user['nickname'],
            'email'         => $user['email'],
            'avatar_url'    => $user['avatar_url'],
            'is_admin'      => (bool)$user['is_admin'],
            'employee'      => $employee,
        ];

        return [
            'success'       => true,
            'user'          => $userObj,
            'menu_tree'     => $menuTree,
            'permissions'   => $permissions,
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
        ];
    }

    /**
     * Refresh Session — สร้าง Token ใหม่
     */
    public function refreshSession(int $userId): array
    {
        $user = $this->find($userId);

        if (!$user || !$user['is_active']) {
            return ['success' => false, 'message' => 'ไม่พบผู้ใช้หรือถูกปิดการใช้งาน'];
        }

        $employee = $this->getEmployeeData($userId);

        $tokenData = [
            'user_id'     => $user['id'],
            'employee_id' => $employee['id'] ?? null,
            'company_id'  => $employee['company_id'] ?? null,
            'branch_id'   => $employee['branch_id'] ?? null,
            'level_id'    => $employee['level_id'] ?? null,
            'is_admin'    => (bool)$user['is_admin'],
        ];

        $userObj = [
            'id'            => $user['id'],
            'username'      => $user['username'],
            'first_name_th' => $user['first_name_th'],
            'last_name_th'  => $user['last_name_th'],
            'nickname'      => $user['nickname'],
            'avatar_url'    => $user['avatar_url'],
            'is_admin'      => (bool)$user['is_admin'],
            'employee'      => $employee,
        ];

        return [
            'success'       => true,
            'user'          => $userObj,
            'access_token'  => createAccessToken($tokenData),
            'refresh_token' => createRefreshToken($tokenData),
        ];
    }

    /**
     * ดึง Profile ข้อมูลผู้ใช้
     */
    public function getProfile(int $userId): ?array
    {
        $sql = "
            SELECT 
                u.id, u.username, u.first_name_th, u.last_name_th,
                u.first_name_en, u.last_name_en, u.nickname,
                u.email, u.phone, u.avatar_url, u.gender, u.birth_date,
                u.is_admin, u.last_login_at,
                e.id as employee_id, e.employee_code, e.company_id, e.branch_id,
                e.level_id, e.status, e.start_date, e.salary_type, e.manager_id,
                c.code as company_code, c.name_th as company_name,
                b.name_th as branch_name,
                l.name as level_name, l.level_score,
                r.name_th as role_name
            FROM core_users u
            LEFT JOIN hrm_employees e ON e.user_id = u.id
            LEFT JOIN core_companies c ON c.id = e.company_id
            LEFT JOIN core_branches b ON b.id = e.branch_id
            LEFT JOIN core_levels l ON l.id = e.level_id
            LEFT JOIN core_roles r ON r.id = l.role_id
            WHERE u.id = :user_id AND u.is_active = 1
        ";
        $results = $this->query($sql, ['user_id' => $userId]);
        return $results[0] ?? null;
    }

    /**
     * ดึง Employee data จาก user_id
     */
    private function getEmployeeData(int $userId): ?array
    {
        $sql = "
            SELECT e.*, c.code as company_code, c.name_th as company_name,
                   b.name_th as branch_name, l.name as level_name, l.level_score
            FROM hrm_employees e
            LEFT JOIN core_companies c ON c.id = e.company_id
            LEFT JOIN core_branches b ON b.id = e.branch_id
            LEFT JOIN core_levels l ON l.id = e.level_id
            WHERE e.user_id = :user_id
            LIMIT 1
        ";
        $results = $this->query($sql, ['user_id' => $userId]);
        return $results[0] ?? null;
    }

    /**
     * ดึง Menu Tree ตาม Level + User Override
     */
    public function getMenuTree(?int $levelId, int $userId): array
    {
        $sql = "
            SELECT DISTINCT
                a.id, a.slug, a.name_th, a.name_en, a.icon,
                a.parent_id, a.type, a.module, a.route, a.sort_order
            FROM core_app_structure a
            WHERE a.is_active = 1
            AND (
                -- Level permission
                EXISTS (
                    SELECT 1 FROM core_level_permissions lp 
                    WHERE lp.app_structure_id = a.id AND lp.level_id = :level_id
                )
                -- User override (granted)
                OR EXISTS (
                    SELECT 1 FROM core_user_permissions up 
                    WHERE up.app_structure_id = a.id AND up.user_id = :user_id AND up.is_granted = 1
                )
            )
            -- Exclude user overrides that deny
            AND NOT EXISTS (
                SELECT 1 FROM core_user_permissions up2 
                WHERE up2.app_structure_id = a.id AND up2.user_id = :user_id2 AND up2.is_granted = 0
            )
            ORDER BY a.sort_order ASC
        ";

        return $this->query($sql, [
            'level_id' => $levelId,
            'user_id'  => $userId,
            'user_id2' => $userId,
        ]);
    }

    /**
     * ดึง Action Permissions
     */
    public function getPermissions(?int $levelId, int $userId): array
    {
        $sql = "
            SELECT DISTINCT
                act.id, act.app_structure_id, act.action_code, act.name_th
            FROM core_app_actions act
            WHERE act.is_active = 1
            AND (
                EXISTS (
                    SELECT 1 FROM core_level_action_permissions lap 
                    WHERE lap.action_id = act.id AND lap.level_id = :level_id
                )
                OR EXISTS (
                    SELECT 1 FROM core_user_action_permissions uap 
                    WHERE uap.action_id = act.id AND uap.user_id = :user_id AND uap.is_granted = 1
                )
            )
            AND NOT EXISTS (
                SELECT 1 FROM core_user_action_permissions uap2 
                WHERE uap2.action_id = act.id AND uap2.user_id = :user_id2 AND uap2.is_granted = 0
            )
        ";

        return $this->query($sql, [
            'level_id' => $levelId,
            'user_id'  => $userId,
            'user_id2' => $userId,
        ]);
    }

    /**
     * ดึงค่าจาก system_config
     */
    private function getSystemConfig(string $key, $default = null)
    {
        $sql = "SELECT config_value FROM core_system_config WHERE config_key = :key LIMIT 1";
        $result = $this->query($sql, ['key' => $key]);
        return $result[0]['config_value'] ?? $default;
    }
}
