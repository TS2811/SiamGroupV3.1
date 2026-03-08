<?php

/**
 * SiamGroup V3.1 — Settings Model
 * 
 * จัดการ Master Data ทั้งหมดของ Core Infrastructure
 * ตาม TSD_01 Section 4.8 และ PRD #04
 * 
 * Sections:
 *   - Companies (Edit Only)
 *   - Branches (Edit Only)
 *   - Departments (CRUD) + Junction core_company_departments
 *   - Roles (CRUD) + Junction core_department_roles
 *   - Levels (CRUD)
 *   - System Config (Read/Update)
 *   - Admin Users (List/Toggle)
 *   - Permission Matrix (Level × Page)
 *   - App Structure (CRUD)
 *   - App Actions (CRUD)
 */

require_once __DIR__ . '/BaseModel.php';

class Settings extends BaseModel
{
    protected string $table = 'core_system_config';

    // ========================================
    // 1. COMPANIES (Edit Only)
    // ========================================

    public function getCompanies(): array
    {
        $sql = "SELECT c.*, 
                (SELECT COUNT(*) FROM core_branches WHERE company_id = c.id) as branch_count,
                (SELECT COUNT(*) FROM hrm_employees e 
                 JOIN core_branches b ON e.branch_id = b.id 
                 WHERE b.company_id = c.id AND e.status = 'ACTIVE') as employee_count
                FROM core_companies c ORDER BY c.id";
        return $this->query($sql);
    }

    public function getCompany(int $id): ?array
    {
        $sql = "SELECT * FROM core_companies WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function updateCompany(int $id, array $data): bool
    {
        $allowed = ['name_th', 'name_en', 'tax_id', 'logo_url', 'address', 'phone', 'email', 'website', 'is_active'];
        return $this->updateFields('core_companies', $id, $data, $allowed);
    }

    // ========================================
    // 2. BRANCHES (Edit Only)  
    // ========================================

    public function getBranches(?int $companyId = null): array
    {
        $sql = "SELECT b.*, c.code as company_code, c.name_th as company_name,
                (SELECT COUNT(*) FROM hrm_employees WHERE branch_id = b.id AND status = 'ACTIVE') as employee_count
                FROM core_branches b
                JOIN core_companies c ON b.company_id = c.id";
        $params = [];
        if ($companyId) {
            $sql .= " WHERE b.company_id = :company_id";
            $params['company_id'] = $companyId;
        }
        $sql .= " ORDER BY c.id, b.id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function updateBranch(int $id, array $data): bool
    {
        $allowed = [
            'name_th',
            'name_en',
            'address',
            'latitude',
            'longitude',
            'check_radius',
            'peak_category',
            'mapping_code',
            'is_active'
        ];
        return $this->updateFields('core_branches', $id, $data, $allowed);
    }

    // ========================================
    // 3. DEPARTMENTS (CRUD)
    // ========================================

    public function getDepartments(): array
    {
        $sql = "SELECT d.*,
                GROUP_CONCAT(DISTINCT c.code ORDER BY c.code SEPARATOR ', ') as companies,
                (SELECT COUNT(*) FROM core_department_roles WHERE department_id = d.id) as role_count
                FROM core_departments d
                LEFT JOIN core_company_departments cd ON d.id = cd.department_id
                LEFT JOIN core_companies c ON cd.company_id = c.id
                GROUP BY d.id
                ORDER BY d.id";
        return $this->query($sql);
    }

    public function createDepartment(array $data): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO core_departments (name, name_en, is_active) VALUES (:name, :name_en, :is_active)"
            );
            $stmt->execute([
                'name' => $data['name'],
                'name_en' => $data['name_en'] ?? null,
                'is_active' => $data['is_active'] ?? 1,
            ]);
            $deptId = (int) $this->db->lastInsertId();

            // Link to companies
            if (!empty($data['company_ids'])) {
                $this->syncCompanyDepartments($deptId, $data['company_ids']);
            }

            $this->db->commit();
            return $deptId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateDepartment(int $id, array $data): bool
    {
        $this->db->beginTransaction();
        try {
            $allowed = ['name', 'name_en', 'is_active'];
            $this->updateFields('core_departments', $id, $data, $allowed);

            if (isset($data['company_ids'])) {
                $this->syncCompanyDepartments($id, $data['company_ids']);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function deleteDepartment(int $id): bool
    {
        // Check if has roles
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM core_department_roles WHERE department_id = :id");
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \Exception('ไม่สามารถลบได้ — มีตำแหน่งอ้างอิงอยู่');
        }
        return $this->softDeleteTable('core_departments', $id);
    }

    private function syncCompanyDepartments(int $deptId, array $companyIds): void
    {
        $this->db->prepare("DELETE FROM core_company_departments WHERE department_id = :id")
            ->execute(['id' => $deptId]);
        $stmt = $this->db->prepare(
            "INSERT INTO core_company_departments (company_id, department_id) VALUES (:cid, :did)"
        );
        foreach ($companyIds as $cid) {
            $stmt->execute(['cid' => $cid, 'did' => $deptId]);
        }
    }

    // ========================================
    // 4. ROLES (CRUD)
    // ========================================

    public function getRoles(): array
    {
        $sql = "SELECT r.*,
                GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', ') as departments,
                (SELECT COUNT(*) FROM core_levels WHERE role_id = r.id) as level_count
                FROM core_roles r
                LEFT JOIN core_department_roles dr ON r.id = dr.role_id
                LEFT JOIN core_departments d ON dr.department_id = d.id
                GROUP BY r.id
                ORDER BY r.id";
        return $this->query($sql);
    }

    public function createRole(array $data): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO core_roles (name_th, name_en) VALUES (:name_th, :name_en)"
            );
            $stmt->execute([
                'name_th' => $data['name_th'],
                'name_en' => $data['name_en'] ?? '',
            ]);
            $roleId = (int) $this->db->lastInsertId();

            if (!empty($data['department_ids'])) {
                $this->syncDepartmentRoles($roleId, $data['department_ids']);
            }

            $this->db->commit();
            return $roleId;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateRole(int $id, array $data): bool
    {
        $this->db->beginTransaction();
        try {
            $allowed = ['name_th', 'name_en'];
            $this->updateFields('core_roles', $id, $data, $allowed);

            if (isset($data['department_ids'])) {
                $this->syncDepartmentRoles($id, $data['department_ids']);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function deleteRole(int $id): bool
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM core_levels WHERE role_id = :id");
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \Exception('ไม่สามารถลบได้ — มี Level อ้างอิงอยู่');
        }
        $this->db->prepare("DELETE FROM core_department_roles WHERE role_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_roles WHERE id = :id")->execute(['id' => $id]);
        return true;
    }

    private function syncDepartmentRoles(int $roleId, array $deptIds): void
    {
        $this->db->prepare("DELETE FROM core_department_roles WHERE role_id = :id")
            ->execute(['id' => $roleId]);
        $stmt = $this->db->prepare(
            "INSERT INTO core_department_roles (department_id, role_id) VALUES (:did, :rid)"
        );
        foreach ($deptIds as $did) {
            $stmt->execute(['did' => $did, 'rid' => $roleId]);
        }
    }

    // ========================================
    // 5. LEVELS (CRUD)
    // ========================================

    public function getLevels(): array
    {
        $sql = "SELECT l.*, r.name_th as role_name, r.name_en as role_name_en,
                (SELECT COUNT(*) FROM hrm_employees WHERE level_id = l.id AND status = 'ACTIVE') as employee_count
                FROM core_levels l
                JOIN core_roles r ON l.role_id = r.id
                ORDER BY l.level_score ASC, l.id";
        return $this->query($sql);
    }

    public function createLevel(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO core_levels (role_id, level_score, name, description) 
             VALUES (:role_id, :level_score, :name, :description)"
        );
        $stmt->execute([
            'role_id' => $data['role_id'],
            'level_score' => $data['level_score'] ?? 10,
            'name' => $data['name'] ?? null,
            'description' => $data['description'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateLevel(int $id, array $data): bool
    {
        $allowed = ['role_id', 'level_score', 'name', 'description'];
        return $this->updateFields('core_levels', $id, $data, $allowed);
    }

    public function deleteLevel(int $id): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM hrm_employees WHERE level_id = :id AND status = 'ACTIVE'"
        );
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \Exception('ไม่สามารถลบได้ — มีพนักงานใช้ Level นี้อยู่');
        }
        // Delete related permissions
        $this->db->prepare("DELETE FROM core_level_permissions WHERE level_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_level_action_permissions WHERE level_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_levels WHERE id = :id")->execute(['id' => $id]);
        return true;
    }

    // ========================================
    // 6. SYSTEM CONFIG
    // ========================================

    public function getSystemConfig(): array
    {
        $sql = "SELECT * FROM core_system_config ORDER BY group_name, id";
        $rows = $this->query($sql);
        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row['group_name'] ?? 'GENERAL'][] = $row;
        }
        return $grouped;
    }

    public function updateSystemConfig(array $items, int $updatedBy): int
    {
        $count = 0;
        $stmt = $this->db->prepare(
            "UPDATE core_system_config SET config_value = :val WHERE config_key = :key"
        );
        foreach ($items as $key => $value) {
            $stmt->execute(['val' => (string) $value, 'key' => $key]);
            $count += $stmt->rowCount();
        }
        return $count;
    }

    public function getConfigValue(string $key, $default = null)
    {
        $stmt = $this->db->prepare("SELECT config_value, value_type FROM core_system_config WHERE config_key = :key");
        $stmt->execute(['key' => $key]);
        $row = $stmt->fetch();
        if (!$row) return $default;
        return match ($row['value_type']) {
            'NUMBER' => is_numeric($row['config_value']) && str_contains($row['config_value'], '.') ? (float) $row['config_value'] : (int) $row['config_value'],
            'BOOLEAN' => (bool) $row['config_value'],
            'JSON' => json_decode($row['config_value'], true),
            default => $row['config_value'],
        };
    }

    // ========================================
    // 7. ADMIN USERS
    // ========================================

    public function getAdminUsers(): array
    {
        $sql = "SELECT u.id, u.username, u.first_name_th, u.last_name_th, u.nickname,
                u.email, u.is_admin, u.is_active, u.last_login_at,
                e.employee_code, l.name as position_name
                FROM core_users u
                LEFT JOIN hrm_employees e ON u.id = e.user_id
                LEFT JOIN core_levels l ON e.level_id = l.id
                WHERE u.is_admin = 1
                ORDER BY u.id";
        return $this->query($sql);
    }

    public function toggleAdmin(int $userId, bool $isAdmin, int $currentUserId): bool
    {
        // ห้ามถอดสิทธิ์ตัวเอง
        if (!$isAdmin && $userId === $currentUserId) {
            throw new \Exception('ไม่สามารถถอดสิทธิ์ Admin ของตัวเองได้');
        }
        $stmt = $this->db->prepare("UPDATE core_users SET is_admin = :admin WHERE id = :id");
        $stmt->execute(['admin' => $isAdmin ? 1 : 0, 'id' => $userId]);
        return $stmt->rowCount() > 0;
    }

    public function searchUsers(string $search): array
    {
        $sql = "SELECT u.id, u.username, u.first_name_th, u.last_name_th, u.nickname, 
                u.is_admin, u.is_active,
                e.employee_code, l.name as position_name
                FROM core_users u
                LEFT JOIN hrm_employees e ON u.id = e.user_id
                LEFT JOIN core_levels l ON e.level_id = l.id
                WHERE (u.username LIKE :s OR u.first_name_th LIKE :s OR u.last_name_th LIKE :s 
                       OR u.nickname LIKE :s OR e.employee_code LIKE :s)
                AND u.is_active = 1
                ORDER BY u.id
                LIMIT 20";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['s' => "%{$search}%"]);
        return $stmt->fetchAll();
    }

    // ========================================
    // 8. PERMISSION MATRIX (Level × Page)
    // ========================================

    public function getPermissionMatrix(): array
    {
        // Get all levels
        $levels = $this->query(
            "SELECT l.id, l.name, l.level_score, r.name_th as role_name 
             FROM core_levels l JOIN core_roles r ON l.role_id = r.id 
             ORDER BY l.level_score ASC"
        );

        // Get all pages (grouped by system)
        $pages = $this->query(
            "SELECT id, parent_id, slug as code, name_th, type, sort_order 
             FROM core_app_structure 
             WHERE is_active = 1 
             ORDER BY sort_order"
        );

        // Get existing permissions
        $perms = $this->query("SELECT level_id, app_structure_id FROM core_level_permissions");
        $permMap = [];
        foreach ($perms as $p) {
            $permMap[$p['level_id'] . '_' . $p['app_structure_id']] = true;
        }

        return [
            'levels' => $levels,
            'pages' => $pages,
            'permissions' => $permMap,
        ];
    }

    public function savePermissionMatrix(int $levelId, array $pageIds): bool
    {
        $this->db->beginTransaction();
        try {
            // Delete all existing for this level
            $this->db->prepare("DELETE FROM core_level_permissions WHERE level_id = :lid")
                ->execute(['lid' => $levelId]);

            // Insert new
            $stmt = $this->db->prepare(
                "INSERT INTO core_level_permissions (level_id, app_structure_id) VALUES (:lid, :pid)"
            );
            foreach ($pageIds as $pid) {
                $stmt->execute(['lid' => $levelId, 'pid' => $pid]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ========================================
    // 9. APP STRUCTURE (CRUD)
    // ========================================

    public function getAppStructure(): array
    {
        return $this->query(
            "SELECT * FROM core_app_structure ORDER BY sort_order, id"
        );
    }

    public function createAppStructure(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO core_app_structure (parent_id, slug, name_th, name_en, type, module, route, icon, sort_order, is_active)
             VALUES (:parent_id, :slug, :name_th, :name_en, :type, :module, :route, :icon, :sort_order, :is_active)"
        );
        $stmt->execute([
            'parent_id' => $data['parent_id'] ?? null,
            'slug' => $data['slug'],
            'name_th' => $data['name_th'],
            'name_en' => $data['name_en'] ?? null,
            'type' => $data['type'] ?? 'PAGE',
            'module' => $data['module'] ?? null,
            'route' => $data['route'] ?? null,
            'icon' => $data['icon'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? 1,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateAppStructure(int $id, array $data): bool
    {
        $allowed = ['parent_id', 'slug', 'name_th', 'name_en', 'type', 'module', 'route', 'icon', 'sort_order', 'is_active'];
        return $this->updateFields('core_app_structure', $id, $data, $allowed);
    }

    public function deleteAppStructure(int $id): bool
    {
        // Check children
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM core_app_structure WHERE parent_id = :id");
        $stmt->execute(['id' => $id]);
        if ($stmt->fetchColumn() > 0) {
            throw new \Exception('ไม่สามารถลบได้ — มี Sub-menu อ้างอิงอยู่');
        }
        // Delete related permissions and actions
        $this->db->prepare("DELETE FROM core_level_permissions WHERE app_structure_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_user_permissions WHERE app_structure_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_app_actions WHERE app_structure_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_app_structure WHERE id = :id")->execute(['id' => $id]);
        return true;
    }

    // ========================================
    // 10. APP ACTIONS (CRUD)
    // ========================================

    public function getAppActions(?int $pageId = null): array
    {
        $sql = "SELECT a.*, s.code as page_code, s.name_th as page_name
                FROM core_app_actions a
                JOIN core_app_structure s ON a.page_id = s.id";
        $params = [];
        if ($pageId) {
            $sql .= " WHERE a.page_id = :page_id";
            $params['page_id'] = $pageId;
        }
        $sql .= " ORDER BY a.page_id, a.sort_order";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createAppAction(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO core_app_actions (page_id, code, name_th, name_en, description, sort_order, is_active)
             VALUES (:page_id, :code, :name_th, :name_en, :description, :sort_order, :is_active)"
        );
        $stmt->execute([
            'page_id' => $data['page_id'],
            'code' => $data['code'],
            'name_th' => $data['name_th'],
            'name_en' => $data['name_en'] ?? null,
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? 1,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateAppAction(int $id, array $data): bool
    {
        $allowed = ['page_id', 'code', 'name_th', 'name_en', 'description', 'sort_order', 'is_active'];
        return $this->updateFields('core_app_actions', $id, $data, $allowed);
    }

    public function deleteAppAction(int $id): bool
    {
        $this->db->prepare("DELETE FROM core_level_action_permissions WHERE action_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_user_action_permissions WHERE action_id = :id")->execute(['id' => $id]);
        $this->db->prepare("DELETE FROM core_app_actions WHERE id = :id")->execute(['id' => $id]);
        return true;
    }

    // ========================================
    // HELPER Methods
    // ========================================

    private function updateFields(string $table, int $id, array $data, array $allowed): bool
    {
        $sets = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "`{$field}` = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        if (empty($sets)) return false;
        $sql = "UPDATE `{$table}` SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }

    private function softDeleteTable(string $table, int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE `{$table}` SET is_active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function query(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
