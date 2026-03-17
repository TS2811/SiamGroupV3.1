SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- Rename old tables → _legacy (preserve data)
RENAME TABLE `users` TO `users_legacy`;

RENAME TABLE `our_companies` TO `our_companies_legacy`;

RENAME TABLE `roles` TO `roles_legacy`;

RENAME TABLE `branches` TO `branches_legacy`;

CREATE VIEW `users` AS
SELECT 
    u.id,
    u.username,
    CONCAT(COALESCE(u.first_name_th, ''), ' ', COALESCE(u.last_name_th, '')) AS name,
    u.first_name_th,
    u.last_name_th,
    u.first_name_en,
    u.last_name_en,
    u.email,
    u.is_admin,
    u.avatar_url,
    u.avatar_url AS avatar_path,
    IF(u.is_active = 1, 'active', 'inactive') AS status,
    u.is_active,
    u.created_at,
    u.updated_at,
    -- role_id from hrm_employees → core_levels → core_roles
    r.id AS role_id,
    r.name_th AS role_name
FROM core_users u
LEFT JOIN hrm_employees e ON u.id = e.user_id AND e.status IN ('FULL_TIME', 'PROBATION')
LEFT JOIN core_levels l ON e.level_id = l.id
LEFT JOIN core_roles r ON l.role_id = r.id;

-- 2. our_companies VIEW
-- api.php expects: id, name_th, tax_id, company_code

CREATE VIEW `our_companies` AS
SELECT 
    id,
    code AS company_code,
    name_th,
    name_en,
    company_type,
    type,
    tax_id,
    logo_url,
    address,
    phone,
    email,
    website,
    is_active,
    created_at,
    updated_at
FROM core_companies;

-- 3. roles VIEW
-- api.php expects: id, name

CREATE VIEW `roles` AS
SELECT 
    id,
    name_th AS name,
    name_th,
    name_en,
    created_at,
    updated_at
FROM core_roles;

-- 4. branches VIEW

CREATE VIEW `branches` AS
SELECT 
    id,
    company_id,
    code,
    name_th,
    name_th AS name,
    name_en,
    address,
    latitude,
    longitude,
    check_radius,
    peak_category,
    mapping_code,
    is_active,
    created_at,
    updated_at
FROM core_branches;

SET FOREIGN_KEY_CHECKS = 1;