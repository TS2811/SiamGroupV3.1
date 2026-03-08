-- ============================================
-- SiamGroup V3.1 — HRM Extra Tables
-- Tables needed for PRD_02 HRM Module
-- ============================================

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. hrm_personal_off_days — วันหยุดส่วนตัว
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_personal_off_days` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `day_off_date` DATE NOT NULL,
    `description` VARCHAR(255) NULL COMMENT 'สาเหตุ',
    `created_by` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้ตั้งค่า (HR หรือหัวหน้าสาขา)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pod_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_pod_creator` FOREIGN KEY (`created_by`) REFERENCES `core_users` (`id`),
    UNIQUE KEY `uk_pod` (`employee_id`, `day_off_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='วันหยุดส่วนตัว (HR/หัวหน้าสาขาตั้ง)';

-- ============================================
-- 2. hrm_user_daily_remarks — Remark รายวัน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_user_daily_remarks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `remark_date` DATE NOT NULL,
    `remark` TEXT NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL COMMENT 'HR ที่กรอก',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_udr_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_udr_creator` FOREIGN KEY (`created_by`) REFERENCES `core_users` (`id`),
    UNIQUE KEY `uk_udr` (`employee_id`, `remark_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Remark รายวัน (HR กรอก)';

-- ============================================
-- 3. hrm_employee_documents — เอกสารพนักงาน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_employee_documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `document_type` ENUM('CONTRACT','ID_CARD','HOUSE_REG','APPLICATION','DRIVING_LICENSE','OTHER') NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INT NULL COMMENT 'ขนาดไฟล์ (bytes)',
    `mime_type` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,
    `uploaded_by` BIGINT UNSIGNED NOT NULL COMMENT 'HR ที่อัปโหลด',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ed_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_ed_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `core_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='เอกสารพนักงาน';

-- ============================================
-- 4. hrm_evaluation_criteria — หมวดการประเมิน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_evaluation_criteria` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `weight` DECIMAL(5,2) NOT NULL DEFAULT 20.00 COMMENT 'น้ำหนัก %',
    `sort_order` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='หมวดการประเมินผลงาน';

-- ============================================
-- 5. hrm_evaluations — ผลประเมินรายเดือน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_evaluations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `evaluator_id` INT NOT NULL COMMENT 'หัวหน้าผู้ประเมิน',
    `evaluation_month` DATE NOT NULL COMMENT 'เดือนที่ประเมิน (YYYY-MM-01)',
    `weighted_score` DECIMAL(5,2) NULL COMMENT 'คะแนนเฉลี่ยถ่วงน้ำหนัก',
    `comment` TEXT NULL COMMENT 'ความเห็นเพิ่มเติม',
    `status` ENUM('DRAFT','SUBMITTED') DEFAULT 'DRAFT',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_eval_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_eval_evaluator` FOREIGN KEY (`evaluator_id`) REFERENCES `hrm_employees` (`id`),
    UNIQUE KEY `uk_eval` (`employee_id`, `evaluation_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ผลประเมินรายเดือน';

-- ============================================
-- 6. hrm_evaluation_scores — คะแนนแต่ละหมวด
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_evaluation_scores` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `evaluation_id` INT NOT NULL,
    `criteria_id` INT NOT NULL,
    `score` TINYINT NOT NULL COMMENT 'คะแนน 1-5',
    CONSTRAINT `fk_es_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `hrm_evaluations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_es_criteria` FOREIGN KEY (`criteria_id`) REFERENCES `hrm_evaluation_criteria` (`id`),
    UNIQUE KEY `uk_eval_score` (`evaluation_id`, `criteria_id`),
    CONSTRAINT `chk_score` CHECK (`score` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='คะแนนแต่ละหมวดประเมิน';

-- ============================================
-- Seed Data: หมวดการประเมิน (5 หมวดตาม PRD #02)
-- ============================================
INSERT INTO `hrm_evaluation_criteria` (`name_th`, `name_en`, `description`, `weight`, `sort_order`) VALUES
('คุณภาพงาน', 'Work Quality', 'ความถูกต้อง, ละเอียดรอบคอบ, ผลงานเป็นไปตามมาตรฐาน', 25.00, 1),
('ปริมาณงาน', 'Productivity', 'ทำงานได้ตามเป้า, ปริมาณงานเหมาะสม', 20.00, 2),
('ความตรงต่อเวลา', 'Punctuality', 'มาตรงเวลา, ส่งงานตามกำหนด, ไม่ขาดงาน', 20.00, 3),
('การทำงานร่วมกับผู้อื่น', 'Teamwork', 'ร่วมมือกับเพื่อนร่วมงาน, สื่อสารดี, ช่วยเหลือทีม', 20.00, 4),
('ความรับผิดชอบ', 'Responsibility', 'รับผิดชอบงาน, แก้ปัญหาได้ด้วยตนเอง, เชื่อถือได้', 15.00, 5);

-- ============================================
-- Alter: เพิ่ม is_paid ใน hrm_leave_requests
-- ============================================
-- Note: ถ้า column มีอยู่แล้วจะ error — ให้ ignore ได้
-- ALTER TABLE hrm_leave_requests ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=ได้ค่าจ้าง' AFTER is_urgent;

SET FOREIGN_KEY_CHECKS = 1;