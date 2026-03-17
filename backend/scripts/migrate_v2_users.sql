-- ============================================================
-- Migration Script: Import Users from V2 → V3.1
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

SET NAMES utf8mb4;

-- ============================================================
-- 1. CORE_USERS
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_users;

INSERT INTO
    siamgroup_v3.core_users (
        id,
        username,
        password_hash,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        email,
        phone,
        avatar_url,
        birth_date,
        is_admin,
        is_active,
        created_at,
        updated_at
    )
SELECT
    u.id,
    CASE
        WHEN dup.name IS NOT NULL
        AND u.id != dup.min_id THEN CONCAT(LOWER(u.name), '_', u.id)
        ELSE LOWER(u.name)
    END AS username,
    u.password_hash,
    CASE
        WHEN u.name_th IS NOT NULL
        AND u.name_th LIKE '% %' THEN SUBSTRING_INDEX (u.name_th, ' ', 1)
        ELSE COALESCE(u.name_th, u.name)
    END AS first_name_th,
    CASE
        WHEN u.name_th IS NOT NULL
        AND u.name_th LIKE '% %' THEN SUBSTRING(
            u.name_th,
            LOCATE (' ', u.name_th) + 1
        )
        ELSE ''
    END AS last_name_th,
    CASE
        WHEN u.name_en IS NOT NULL
        AND u.name_en LIKE '% %' THEN SUBSTRING_INDEX (u.name_en, ' ', 1)
        ELSE u.name_en
    END AS first_name_en,
    CASE
        WHEN u.name_en IS NOT NULL
        AND u.name_en LIKE '% %' THEN SUBSTRING(
            u.name_en,
            LOCATE (' ', u.name_en) + 1
        )
        ELSE NULL
    END AS last_name_en,
    u.email,
    u.phone_number AS phone,
    CASE
        WHEN u.avatar_path IS NOT NULL
        AND u.avatar_path != '' THEN CONCAT(
            '/v2/user_avatar/',
            u.avatar_path
        )
        ELSE NULL
    END AS avatar_url,
    u.birthday AS birth_date,
    u.is_admin,
    CASE u.status
        WHEN 'active' THEN 1
        ELSE 0
    END AS is_active,
    u.created_at,
    COALESCE(u.updated_at, u.created_at)
FROM longter1_v2.users u
    LEFT JOIN (
        SELECT LOWER(name) as name, MIN(id) as min_id
        FROM longter1_v2.users
        GROUP BY
            LOWER(name)
        HAVING
            COUNT(*) > 1
    ) dup ON LOWER(u.name) = dup.name
ORDER BY u.id;

-- ============================================================
-- 2. HRM_EMPLOYEES
--    V2 role_id → V3 level_id mapping
-- ============================================================
TRUNCATE TABLE siamgroup_v3.hrm_employees;

INSERT INTO
    siamgroup_v3.hrm_employees (
        id,
        user_id,
        employee_code,
        company_id,
        branch_id,
        level_id,
        manager_id,
        status,
        start_date,
        end_date,
        base_salary,
        created_at,
        updated_at
    )
SELECT
    u.id AS id,
    u.id AS user_id,
    u.employee_code,
    u.company_id,
    u.branch_id,
    CASE u.role_id
        WHEN 1 THEN 12 -- Admin → Programmer
        WHEN 2 THEN 17 -- staff → Jr. Staff
        WHEN 3 THEN 1 -- CEO → MD
        WHEN 4 THEN 2 -- CFO → CFO
        WHEN 5 THEN 9 -- Area Manager
        WHEN 6 THEN 8 -- Acc Manager
        WHEN 7 THEN 4 -- GM
        WHEN 16 THEN 13 -- Sales → Sales Executive
        WHEN 17 THEN 16 -- Accounting → พนักงานบัญชี
        WHEN 18 THEN 15 -- Operation → Courier
        WHEN 19 THEN 17 -- Marketing → Jr. Staff
        WHEN 20 THEN 17 -- Customer Support → Jr. Staff
        WHEN 21 THEN 14 -- HR → HR Officer
        WHEN 22 THEN 12 -- Programmer
        WHEN 23 THEN 10 -- Car Rental Mgr → Branch Manager
        WHEN 25 THEN 15 -- Driver → Courier
        ELSE 17 -- Default → Jr. Staff
    END AS level_id,
    u.manager_id,
    CASE u.status
        WHEN 'active' THEN 'FULL_TIME'
        WHEN 'inactive' THEN 'RESIGNED'
        WHEN 'terminated' THEN 'TERMINATED'
        ELSE 'FULL_TIME'
    END AS status,
    COALESCE(u.start_date, u.created_at) AS start_date,
    u.terminate_date AS end_date,
    0.00 AS base_salary,
    u.created_at,
    COALESCE(u.updated_at, u.created_at)
FROM longter1_v2.users u
ORDER BY u.id;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'core_users' AS tbl, COUNT(*) AS cnt
FROM siamgroup_v3.core_users
UNION ALL
SELECT 'hrm_employees', COUNT(*)
FROM siamgroup_v3.hrm_employees
UNION ALL
SELECT 'active_users', COUNT(*)
FROM siamgroup_v3.core_users
WHERE
    is_active = 1
UNION ALL
SELECT 'admin_users', COUNT(*)
FROM siamgroup_v3.core_users
WHERE
    is_admin = 1;