-- ============================================
-- SiamGroup V3.1 — Core Database Schema
-- Database: siamgroup_v3
-- ============================================

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. core_companies
-- ============================================
CREATE TABLE IF NOT EXISTS `core_companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(10) NOT NULL UNIQUE COMMENT 'SDR, SXD, SPD, SAR',
    `name_th` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NULL,
    `company_type` ENUM('DHL','CAR_RENTAL') NOT NULL COMMENT 'ประเภทธุรกิจ',
    `type` ENUM('HEADQUARTER','SUBSIDIARY') NOT NULL,
    `tax_id` VARCHAR(20) NULL,
    `logo_url` VARCHAR(500) NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='บริษัทในเครือ';

-- ============================================
-- 2. core_branches
-- ============================================
CREATE TABLE IF NOT EXISTS `core_branches` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name_th` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NULL,
    `address` TEXT NULL,
    `latitude` DECIMAL(10,7) NULL,
    `longitude` DECIMAL(10,7) NULL,
    `check_radius` INT DEFAULT 200 COMMENT 'รัศมี Check-in (เมตร)',
    `peak_category` VARCHAR(50) NULL,
    `mapping_code` VARCHAR(50) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_branch_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='สาขา';

-- ============================================
-- 3. core_departments (ลบ company_id)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='แผนก';

-- ============================================
-- 4. core_company_departments (Junction: บ. ↔ แผนก)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_company_departments` (
    `company_id` INT NOT NULL,
    `department_id` INT NOT NULL,
    PRIMARY KEY (`company_id`, `department_id`),
    CONSTRAINT `fk_cd_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`),
    CONSTRAINT `fk_cd_department` FOREIGN KEY (`department_id`) REFERENCES `core_departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='บริษัท ↔ แผนก (M:N)';

-- ============================================
-- 5. core_roles
-- ============================================
CREATE TABLE IF NOT EXISTS `core_roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ตำแหน่ง';

-- ============================================
-- 6. core_department_roles (Junction: แผนก ↔ ตำแหน่ง)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_department_roles` (
    `department_id` INT NOT NULL,
    `role_id` INT NOT NULL,
    PRIMARY KEY (`department_id`, `role_id`),
    CONSTRAINT `fk_dr_department` FOREIGN KEY (`department_id`) REFERENCES `core_departments` (`id`),
    CONSTRAINT `fk_dr_role` FOREIGN KEY (`role_id`) REFERENCES `core_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='แผนก ↔ ตำแหน่ง (M:N)';

-- ============================================
-- 7. core_levels (ลบ department_id)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_levels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `level_score` INT DEFAULT 10 COMMENT '1=สูงสุด(MD), 8=ต่ำสุด(พนักงาน)',
    `name` VARCHAR(100) NULL COMMENT 'ชื่อตำแหน่งจริง เช่น MD, Programmer',
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_level_role` FOREIGN KEY (`role_id`) REFERENCES `core_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ระดับตำแหน่ง';

-- ============================================
-- 8. core_users
-- ============================================
CREATE TABLE IF NOT EXISTS `core_users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt cost >= 12',
    `first_name_th` VARCHAR(100) NOT NULL,
    `last_name_th` VARCHAR(100) NOT NULL,
    `first_name_en` VARCHAR(100) NULL,
    `last_name_en` VARCHAR(100) NULL,
    `nickname` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `gender` ENUM('MALE','FEMALE','OTHER') NULL,
    `birth_date` DATE NULL,
    `is_admin` TINYINT(1) DEFAULT 0 COMMENT '1 = เข้าถึง Settings ทั้งหมด',
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login_at` DATETIME NULL,
    `last_login_ip` VARCHAR(45) NULL,
    `failed_login_count` INT DEFAULT 0 COMMENT 'นับ Login ผิด',
    `locked_until` DATETIME NULL COMMENT 'ล็อกถึงเมื่อไหร่',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ผู้ใช้งานระบบ';

-- ============================================
-- 9. core_refresh_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS `core_refresh_tokens` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `is_revoked` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `user_agent` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    INDEX `idx_token_hash` (`token_hash`),
    INDEX `idx_user_active` (`user_id`, `is_revoked`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='JWT Refresh Token Storage';

-- ============================================
-- 10. core_app_structure (เมนูระบบ)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_app_structure` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `icon` VARCHAR(100) NULL COMMENT 'MUI icon name',
    `parent_id` INT NULL,
    `type` ENUM('SYSTEM','PAGE','TAB') NOT NULL DEFAULT 'PAGE',
    `module` VARCHAR(50) NULL COMMENT 'CORE, HRM, PAY, ACC',
    `route` VARCHAR(255) NULL,
    `sort_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_app_parent` FOREIGN KEY (`parent_id`) REFERENCES `core_app_structure` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='โครงสร้างเมนูระบบ';

-- ============================================
-- 11. core_app_actions
-- ============================================
CREATE TABLE IF NOT EXISTS `core_app_actions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `app_structure_id` INT NOT NULL,
    `action_code` VARCHAR(50) NOT NULL COMMENT 'BTN_CREATE, BTN_EDIT, BTN_DELETE',
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_action_app` FOREIGN KEY (`app_structure_id`) REFERENCES `core_app_structure` (`id`),
    UNIQUE KEY `uk_action` (`app_structure_id`, `action_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Actions ภายในแต่ละหน้า';

-- ============================================
-- 12. core_level_permissions (Level → Page)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_level_permissions` (
    `level_id` INT NOT NULL,
    `app_structure_id` INT NOT NULL,
    PRIMARY KEY (`level_id`, `app_structure_id`),
    CONSTRAINT `fk_lp_level` FOREIGN KEY (`level_id`) REFERENCES `core_levels` (`id`),
    CONSTRAINT `fk_lp_app` FOREIGN KEY (`app_structure_id`) REFERENCES `core_app_structure` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='สิทธิ์ Level ต่อ Page';

-- ============================================
-- 13. core_level_action_permissions (Level → Action)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_level_action_permissions` (
    `level_id` INT NOT NULL,
    `action_id` INT NOT NULL,
    PRIMARY KEY (`level_id`, `action_id`),
    CONSTRAINT `fk_lap_level` FOREIGN KEY (`level_id`) REFERENCES `core_levels` (`id`),
    CONSTRAINT `fk_lap_action` FOREIGN KEY (`action_id`) REFERENCES `core_app_actions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='สิทธิ์ Level ต่อ Action';

-- ============================================
-- 14. core_user_permissions (User Override → Page)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_user_permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `app_structure_id` INT NOT NULL,
    `is_granted` TINYINT(1) NOT NULL COMMENT '1=เพิ่มสิทธิ์, 0=ถอนสิทธิ์',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    CONSTRAINT `fk_up_app` FOREIGN KEY (`app_structure_id`) REFERENCES `core_app_structure` (`id`),
    UNIQUE KEY `uk_user_page` (`user_id`, `app_structure_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User Override สิทธิ์หน้า';

-- ============================================
-- 15. core_user_action_permissions (User Override → Action)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_user_action_permissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `action_id` INT NOT NULL,
    `is_granted` TINYINT(1) NOT NULL COMMENT '1=เพิ่มสิทธิ์, 0=ถอนสิทธิ์',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_uap_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    CONSTRAINT `fk_uap_action` FOREIGN KEY (`action_id`) REFERENCES `core_app_actions` (`id`),
    UNIQUE KEY `uk_user_action` (`user_id`, `action_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User Override สิทธิ์ Action';

-- ============================================
-- 16. core_user_company_access (Visibility: บริษัทที่เห็น)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_user_company_access` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `company_id` INT NOT NULL,
    PRIMARY KEY (`user_id`, `company_id`),
    CONSTRAINT `fk_uca_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    CONSTRAINT `fk_uca_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='บริษัทที่ user เห็น (Override)';

-- ============================================
-- 17. core_user_branch_access (Visibility: สาขาที่เห็น)
-- ============================================
CREATE TABLE IF NOT EXISTS `core_user_branch_access` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `branch_id` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `branch_id`),
    CONSTRAINT `fk_uba_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    CONSTRAINT `fk_uba_branch` FOREIGN KEY (`branch_id`) REFERENCES `core_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='สาขาที่ user เห็น (Override)';

-- ============================================
-- 18. core_system_config
-- ============================================
CREATE TABLE IF NOT EXISTS `core_system_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL UNIQUE,
    `config_value` TEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `group_name` VARCHAR(50) NULL COMMENT 'SECURITY, PAYROLL, HR, SYSTEM',
    `value_type` ENUM('STRING','NUMBER','BOOLEAN','JSON') DEFAULT 'STRING',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ค่าคงที่ระบบ';

-- ============================================
-- 19. hrm_employees (พื้นฐาน — Core ต้อง JOIN)
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `employee_code` VARCHAR(20) NOT NULL UNIQUE,
    `company_id` INT NOT NULL,
    `branch_id` INT UNSIGNED NOT NULL,
    `level_id` INT NOT NULL,
    `manager_id` INT NULL COMMENT 'FK → hrm_employees.id (หัวหน้าโดยตรง)',
    `status` ENUM('PROBATION','FULL_TIME','RESIGNED','TERMINATED') DEFAULT 'PROBATION',
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `salary_type` ENUM('MONTHLY','DAILY') DEFAULT 'MONTHLY',
    `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_emp_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`),
    CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`),
    CONSTRAINT `fk_emp_branch` FOREIGN KEY (`branch_id`) REFERENCES `core_branches` (`id`),
    CONSTRAINT `fk_emp_level` FOREIGN KEY (`level_id`) REFERENCES `core_levels` (`id`),
    CONSTRAINT `fk_emp_manager` FOREIGN KEY (`manager_id`) REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ข้อมูลพนักงาน';

SET FOREIGN_KEY_CHECKS = 1;