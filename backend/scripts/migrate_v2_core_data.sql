-- ============================================================
-- Migration Script: V2 (longter1_v2) → V3.1 (siamgroup_v3)
-- ============================================================
-- วัตถุประสงค์: Import ข้อมูล core tables จาก V2 เข้า V3.1
-- ⚠️ WARNING: Script นี้จะ TRUNCATE ข้อมูลเดิมใน V3!
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

SET NAMES utf8mb4;

-- ============================================================
-- 0. TRUNCATE ตารางที่มี FK dependencies ก่อน
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_level_permissions;

TRUNCATE TABLE siamgroup_v3.core_level_action_permissions;

TRUNCATE TABLE siamgroup_v3.core_user_permissions;

TRUNCATE TABLE siamgroup_v3.core_user_action_permissions;

TRUNCATE TABLE siamgroup_v3.core_user_company_access;

TRUNCATE TABLE siamgroup_v3.core_user_branch_access;

TRUNCATE TABLE siamgroup_v3.hrm_employees;

TRUNCATE TABLE siamgroup_v3.core_refresh_tokens;

-- ============================================================
-- 1. CORE_COMPANIES — ใส่ใหม่ตาม V2 IDs
--    V2: id=1=SXD, id=2=SDR, id=3=SPD, id=4=SAR
--    V3 เดิม: id=1=SDR, id=2=SXD (สลับกัน!)
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_companies;

INSERT INTO
    siamgroup_v3.core_companies (
        id,
        code,
        name_th,
        name_en,
        company_type,
        type,
        tax_id,
        address,
        phone
    )
SELECT
    oc.id,
    oc.company_code AS code,
    oc.name_th,
    oc.name_en,
    CASE oc.business_type
        WHEN 'DHL' THEN 'DHL'
        WHEN 'CarRental' THEN 'CAR_RENTAL'
        ELSE 'DHL'
    END AS company_type,
    CASE oc.id
        WHEN 2 THEN 'HEADQUARTER'
        ELSE 'SUBSIDIARY'
    END AS type,
    oc.tax_id,
    oc.address,
    oc.phone
FROM longter1_v2.our_companies oc
ORDER BY oc.id;

-- ============================================================
-- 2. CORE_BRANCHES — Import 43 สาขาจาก V2
--    คง ID เดิมเพราะ ACC data อ้าง branch_id
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_branches;

INSERT INTO
    siamgroup_v3.core_branches (
        id,
        company_id,
        code,
        name_th,
        name_en,
        latitude,
        longitude,
        check_radius,
        peak_category,
        mapping_code,
        is_active
    )
SELECT
    b.id,
    b.company_id,
    b.code,
    b.name_th,
    NULL AS name_en,
    b.latitude,
    b.longitude,
    b.check_radius,
    b.peak_category,
    b.mapping_group_code AS mapping_code,
    b.is_active
FROM longter1_v2.branches b
ORDER BY b.id;

-- ============================================================
-- 3. CORE_ROLES — 6 กลุ่มตาม PRD #00
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_roles;

INSERT INTO
    siamgroup_v3.core_roles (id, name_th, name_en)
VALUES (1, 'ผู้บริหาร', 'Executive'),
    (
        2,
        'รองผู้บริหาร',
        'Asst. Executive'
    ),
    (3, 'ผู้จัดการ', 'Manager'),
    (4, 'หัวหน้างาน', 'Supervisor'),
    (5, 'พนักงาน', 'Staff'),
    (6, 'พนักงานทั่วไป', 'General');

-- ============================================================
-- 4. CORE_DEPARTMENTS — 8 แผนกตาม PRD #00
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_departments;

INSERT INTO
    siamgroup_v3.core_departments (id, name, name_en, is_active)
VALUES (
        1,
        'ฝ่ายบริหาร',
        'Executive',
        1
    ),
    (2, 'ฝ่ายขาย', 'Sales', 1),
    (
        3,
        'ปฏิบัติการ',
        'Operation',
        1
    ),
    (
        4,
        'บัญชีและการเงิน',
        'Acc & Finance',
        1
    ),
    (5, 'ทรัพยากรบุคคล', 'HR', 1),
    (6, 'การตลาด', 'Marketing', 1),
    (
        7,
        'ฝ่ายบริการลูกค้า',
        'Customer Service',
        1
    ),
    (8, 'IT', 'IT', 1);

-- ============================================================
-- 5. CORE_COMPANY_DEPARTMENTS — Junction: บริษัท ↔ แผนก
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_company_departments;

INSERT INTO
    siamgroup_v3.core_company_departments (company_id, department_id)
VALUES
    -- SXD (id=1, DHL) — ไม่มี Marketing(6), Customer Service(7)
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (1, 5),
    -- SDR (id=2, CarRental) — มีทุกแผนก + IT
    (2, 1),
    (2, 2),
    (2, 3),
    (2, 4),
    (2, 5),
    (2, 6),
    (2, 7),
    (2, 8),
    -- SPD (id=3, DHL) — เหมือน SXD
    (3, 1),
    (3, 2),
    (3, 3),
    (3, 4),
    (3, 5),
    -- SAR (id=4, CarRental) — เหมือน SDR แต่ไม่มี IT
    (4, 1),
    (4, 2),
    (4, 3),
    (4, 4),
    (4, 5),
    (4, 6),
    (4, 7);

-- ============================================================
-- 6. CORE_DEPARTMENT_ROLES — Junction: แผนก ↔ Role
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_department_roles;

INSERT INTO
    siamgroup_v3.core_department_roles (department_id, role_id)
VALUES
    -- Executive dept → Executive, Asst. Executive roles
    (1, 1),
    (1, 2),
    -- Sales → Manager, Supervisor, Staff, General
    (2, 3),
    (2, 4),
    (2, 5),
    (2, 6),
    -- Operation → Manager, Supervisor, Staff, General
    (3, 3),
    (3, 4),
    (3, 5),
    (3, 6),
    -- Acc & Finance → Manager, Staff, General
    (4, 3),
    (4, 5),
    (4, 6),
    -- HR → Manager, Staff, General
    (5, 3),
    (5, 5),
    (5, 6),
    -- Marketing → Manager, Staff
    (6, 3),
    (6, 5),
    -- Customer Service → Manager, Staff, General
    (7, 3),
    (7, 5),
    (7, 6),
    -- IT → Manager, Staff
    (8, 3),
    (8, 5);

-- ============================================================
-- 7. CORE_LEVELS — ตำแหน่งจริงตาม PRD #00 Section 2.3
--    column: level_score (ไม่ใช่ score)
-- ============================================================
TRUNCATE TABLE siamgroup_v3.core_levels;

INSERT INTO
    siamgroup_v3.core_levels (
        id,
        role_id,
        level_score,
        name,
        description
    )
VALUES (
        1,
        1,
        1,
        'MD',
        'Managing Director'
    ),
    (
        2,
        1,
        1,
        'CFO',
        'Chief Financial Officer'
    ),
    (
        3,
        2,
        2,
        'Asst MD',
        'Assistant Managing Director'
    ),
    (
        4,
        2,
        2,
        'GM',
        'General Manager'
    ),
    (
        5,
        3,
        3,
        'Sale Director',
        'Sale Director'
    ),
    (
        6,
        3,
        3,
        'Head of IT',
        'Head of IT'
    ),
    (
        7,
        3,
        4,
        'HR Manager',
        'HR Manager'
    ),
    (
        8,
        3,
        4,
        'Acc Manager',
        'Accounting Manager'
    ),
    (
        9,
        3,
        4,
        'Area Manager',
        'Area Manager'
    ),
    (
        10,
        4,
        5,
        'Branch Manager',
        'Branch Manager'
    ),
    (
        11,
        4,
        5,
        'Sale Manager',
        'Sale Manager'
    ),
    (
        12,
        5,
        7,
        'Programmer',
        'Programmer'
    ),
    (
        13,
        5,
        7,
        'Sales Executive',
        'Sales Executive'
    ),
    (
        14,
        5,
        7,
        'HR Officer',
        'HR Officer'
    ),
    (
        15,
        5,
        7,
        'Courier',
        'Courier'
    ),
    (
        16,
        5,
        7,
        'พนักงานบัญชี',
        'Accounting Staff'
    ),
    (
        17,
        6,
        8,
        'Jr. Staff',
        'Junior Staff'
    );

-- ============================================================
-- 8. CORE_USERS — ยังไม่ TRUNCATE ตอนนี้
--    จะ import users แยก script ภายหลัง
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFY: ตรวจสอบผลลัพธ์
-- ============================================================
SELECT 'core_companies' AS tbl, COUNT(*) AS cnt
FROM siamgroup_v3.core_companies
UNION ALL
SELECT 'core_branches', COUNT(*)
FROM siamgroup_v3.core_branches
UNION ALL
SELECT 'core_roles', COUNT(*)
FROM siamgroup_v3.core_roles
UNION ALL
SELECT 'core_departments', COUNT(*)
FROM siamgroup_v3.core_departments
UNION ALL
SELECT 'core_company_depts', COUNT(*)
FROM siamgroup_v3.core_company_departments
UNION ALL
SELECT 'core_dept_roles', COUNT(*)
FROM siamgroup_v3.core_department_roles
UNION ALL
SELECT 'core_levels', COUNT(*)
FROM siamgroup_v3.core_levels;