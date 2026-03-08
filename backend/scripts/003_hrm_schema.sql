-- ============================================
-- SiamGroup V3.1 — HRM Module Schema
-- Database: siamgroup_v3
-- ============================================

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. hrm_shifts — กะการทำงาน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_shifts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `code` VARCHAR(20) NOT NULL COMMENT 'D=Day, N=Night, etc.',
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `start_time` TIME NOT NULL COMMENT 'เวลาเข้างาน เช่น 08:30',
    `end_time` TIME NOT NULL COMMENT 'เวลาเลิกงาน เช่น 17:30',
    `break_minutes` INT DEFAULT 60 COMMENT 'พักเที่ยง (นาที)',
    `work_hours` DECIMAL(4,2) NOT NULL DEFAULT 8.00 COMMENT 'ชม.ทำงานจริง',
    `is_overnight` TINYINT(1) DEFAULT 0 COMMENT 'กะข้ามคืน',
    `late_grace_minutes` INT DEFAULT 0 COMMENT 'ผ่อนผันสาย (นาที)',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_shift_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`),
    UNIQUE KEY `uk_shift_code` (`company_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='กะการทำงาน';

-- ============================================
-- 2. hrm_employee_shifts — กะ ↔ พนักงาน
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_employee_shifts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `shift_id` INT NOT NULL,
    `effective_date` DATE NOT NULL COMMENT 'วันที่เริ่มใช้กะนี้',
    `end_date` DATE NULL COMMENT 'วันที่สิ้นสุด (null = ยังใช้อยู่)',
    `day_of_week` TINYINT NULL COMMENT '0=อา, 1=จ, ..., 6=ส (null = ทุกวัน)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_es_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_es_shift` FOREIGN KEY (`shift_id`) REFERENCES `hrm_shifts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='กะ ↔ พนักงาน';

-- ============================================
-- 3. hrm_time_logs — บันทึกเข้า-ออก ✨
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_time_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `work_date` DATE NOT NULL COMMENT 'วันทำงาน (Logical Date)',
    `scan_time` DATETIME NOT NULL COMMENT 'เวลาจริงที่กดปุ่ม',
    `scan_type` ENUM('IN','OUT') NOT NULL,
    `check_in_type` ENUM('ONSITE','OFFSITE') NOT NULL DEFAULT 'ONSITE',
    `latitude` DECIMAL(10,7) NULL,
    `longitude` DECIMAL(10,7) NULL,
    `location_name` VARCHAR(200) NULL COMMENT 'ชื่อสาขา/สถานที่',
    `distance_from_base` INT NULL COMMENT 'ระยะห่างจากสาขา (เมตร)',
    `is_verified_location` TINYINT(1) DEFAULT 0 COMMENT '1=อยู่ในรัศมี',
    `offsite_reason` TEXT NULL COMMENT 'เหตุผล (กรณี OFFSITE)',
    `offsite_attachment` VARCHAR(500) NULL COMMENT 'Path รูปแนบ (OFFSITE)',
    `user_agent` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `device_risk_flag` TINYINT(1) DEFAULT 0 COMMENT 'Shared Device Detected',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tl_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    INDEX `idx_tl_emp_date` (`employee_id`, `work_date`),
    INDEX `idx_tl_date` (`work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='บันทึกเข้า-ออกงาน';

-- ============================================
-- 4. hrm_holidays — วันหยุดบริษัท
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_holidays` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `holiday_date` DATE NOT NULL,
    `name_th` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NULL,
    `holiday_type` ENUM('NATIONAL','COMPANY','SPECIAL') DEFAULT 'NATIONAL',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hol_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`),
    UNIQUE KEY `uk_holiday` (`company_id`, `holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='วันหยุดบริษัท';

-- ============================================
-- 5. hrm_leave_types — ประเภทการลา
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_leave_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'SICK, PERSONAL, ANNUAL, etc.',
    `name_th` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `max_days` INT NULL COMMENT 'สิทธิ์สูงสุดต่อปี (null=ไม่จำกัด)',
    `requires_file` TINYINT(1) DEFAULT 0 COMMENT 'ต้องแนบไฟล์มั้ย',
    `min_days_advance` INT DEFAULT 0 COMMENT 'ต้องลาล่วงหน้ากี่วัน',
    `allow_half_day` TINYINT(1) DEFAULT 1 COMMENT 'ลาครึ่งวันได้',
    `allow_hourly` TINYINT(1) DEFAULT 0 COMMENT 'ลาเป็นชั่วโมงได้',
    `is_paid` TINYINT(1) DEFAULT 1 COMMENT 'ได้เงินเดือนมั้ย',
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ประเภทการลา';

-- ============================================
-- 6. hrm_employee_leave_quotas — สิทธิ์วันลา
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_employee_leave_quotas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `leave_type_id` INT NOT NULL,
    `year` YEAR NOT NULL,
    `quota_days` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT 'สิทธิ์ทั้งปี',
    `used_days` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT 'ใช้ไปแล้ว',
    `carried_days` DECIMAL(5,1) DEFAULT 0 COMMENT 'ยกมาจากปีก่อน',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_lq_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_lq_leave_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hrm_leave_types` (`id`),
    UNIQUE KEY `uk_quota` (`employee_id`, `leave_type_id`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='สิทธิ์วันลาพนักงาน';

-- ============================================
-- 7. hrm_leave_requests — คำร้องขอลา
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_leave_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `leave_type_id` INT NOT NULL,
    `leave_format` ENUM('FULL_DAY','HALF_DAY','HOURLY') DEFAULT 'FULL_DAY',
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `start_time` TIME NULL COMMENT 'กรณีลาชั่วโมง',
    `end_time` TIME NULL,
    `total_days` DECIMAL(5,1) NOT NULL,
    `reason` TEXT NULL,
    `attachment` VARCHAR(500) NULL,
    `is_urgent` TINYINT(1) DEFAULT 0,
    `status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `approved_by` INT NULL,
    `approved_at` DATETIME NULL,
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_lr_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_lr_leave_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hrm_leave_types` (`id`),
    CONSTRAINT `fk_lr_approver` FOREIGN KEY (`approved_by`) REFERENCES `hrm_employees` (`id`),
    INDEX `idx_lr_emp_status` (`employee_id`, `status`),
    INDEX `idx_lr_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='คำร้องขอลา';

-- ============================================
-- 8. hrm_ot_requests — คำร้องขอ OT
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_ot_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `ot_date` DATE NOT NULL,
    `ot_type` ENUM('OT_1_0','OT_1_5','OT_2_0','OT_3_0','SHIFT_PREMIUM') NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `total_hours` DECIMAL(4,1) NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `approved_by` INT NULL,
    `approved_at` DATETIME NULL,
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ot_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_ot_approver` FOREIGN KEY (`approved_by`) REFERENCES `hrm_employees` (`id`),
    INDEX `idx_ot_emp_status` (`employee_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='คำร้อง OT';

-- ============================================
-- 9. hrm_time_correction_requests — แก้เวลา
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_time_correction_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `correction_date` DATE NOT NULL,
    `correction_type` ENUM('FORGOT_IN','FORGOT_OUT','WRONG_TIME','OTHER') NOT NULL,
    `original_time` TIME NULL COMMENT 'เวลาเดิม',
    `corrected_time` TIME NOT NULL COMMENT 'เวลาที่ต้องการแก้',
    `reason` TEXT NOT NULL,
    `attachment` VARCHAR(500) NULL,
    `status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `approved_by` INT NULL,
    `approved_at` DATETIME NULL,
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tc_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_tc_approver` FOREIGN KEY (`approved_by`) REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='คำร้องแก้เวลา';

-- ============================================
-- 10. hrm_shift_swap_requests — สลับกะ
-- ============================================
CREATE TABLE IF NOT EXISTS `hrm_shift_swap_requests` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `requester_id` INT NOT NULL COMMENT 'คนขอสลับ',
    `target_id` INT NOT NULL COMMENT 'คนที่จะสลับด้วย',
    `requester_date` DATE NOT NULL COMMENT 'วันที่ของคนขอ',
    `target_date` DATE NOT NULL COMMENT 'วันที่ของอีกคน',
    `reason` TEXT NULL,
    `status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `target_accepted` TINYINT(1) DEFAULT 0 COMMENT 'ฝ่ายตรงข้ามยอมรับมั้ย',
    `approved_by` INT NULL,
    `approved_at` DATETIME NULL,
    `reject_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ss_requester` FOREIGN KEY (`requester_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_ss_target` FOREIGN KEY (`target_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_ss_approver` FOREIGN KEY (`approved_by`) REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='คำร้องสลับกะ';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Seed Data
-- ============================================

-- กะการทำงาน (SDR)
INSERT INTO `hrm_shifts` (`company_id`, `code`, `name_th`, `start_time`, `end_time`, `break_minutes`, `work_hours`, `late_grace_minutes`) VALUES
(1, 'D', 'กะปกติ (เช้า)', '08:30:00', '17:30:00', 60, 8.00, 5),
(1, 'N', 'กะดึก', '20:00:00', '05:00:00', 60, 8.00, 5),
(1, 'M', 'กะเช้า (Operation)', '06:00:00', '15:00:00', 60, 8.00, 5);

-- กะ SXD
INSERT INTO `hrm_shifts` (`company_id`, `code`, `name_th`, `start_time`, `end_time`, `break_minutes`, `work_hours`, `late_grace_minutes`) VALUES
(2, 'D', 'กะปกติ (เช้า)', '08:30:00', '17:30:00', 60, 8.00, 5),
(2, 'N', 'กะดึก', '20:00:00', '05:00:00', 60, 8.00, 5);

-- กำหนดกะให้ Admin (employee_id=1)
INSERT INTO `hrm_employee_shifts` (`employee_id`, `shift_id`, `effective_date`) VALUES
(1, 1, '2026-01-01');

-- ประเภทการลา
INSERT INTO `hrm_leave_types` (`code`, `name_th`, `name_en`, `max_days`, `requires_file`, `min_days_advance`, `is_paid`, `sort_order`) VALUES
('SICK', 'ลาป่วย', 'Sick Leave', 30, 0, 0, 1, 1),
('PERSONAL', 'ลากิจ', 'Personal Leave', 3, 0, 1, 1, 2),
('ANNUAL', 'ลาพักร้อน', 'Annual Leave', NULL, 0, 3, 1, 3),
('MATERNITY', 'ลาคลอด', 'Maternity Leave', 98, 1, 7, 1, 4),
('ORDINATION', 'ลาบวช', 'Ordination Leave', 15, 1, 30, 1, 5),
('MILITARY', 'ลาทหาร', 'Military Leave', NULL, 1, 7, 1, 6),
('UNPAID', 'ลาไม่รับค่าจ้าง', 'Unpaid Leave', NULL, 0, 1, 0, 7);

-- สิทธิ์วันลา Admin ปี 2569
INSERT INTO `hrm_employee_leave_quotas` (`employee_id`, `leave_type_id`, `year`, `quota_days`, `used_days`) VALUES
(1, 1, 2026, 30, 2),     -- ป่วย 30 วัน ใช้ 2
(1, 2, 2026, 3, 0),      -- กิจ 3 วัน
(1, 3, 2026, 10, 1);
-- พักร้อน 10 วัน ใช้ 1

-- วันหยุด 2569 (ตัวอย่าง)
INSERT INTO `hrm_holidays` (`company_id`, `holiday_date`, `name_th`, `holiday_type`) VALUES
(1, '2026-01-01', 'วันขึ้นปีใหม่', 'NATIONAL'),
(1, '2026-02-12', 'วันมาฆบูชา', 'NATIONAL'),
(1, '2026-04-06', 'วันจักรี', 'NATIONAL'),
(1, '2026-04-13', 'วันสงกรานต์', 'NATIONAL'),
(1, '2026-04-14', 'วันสงกรานต์', 'NATIONAL'),
(1, '2026-04-15', 'วันสงกรานต์', 'NATIONAL'),
(1, '2026-05-01', 'วันแรงงาน', 'NATIONAL'),
(1, '2026-05-11', 'วันวิสาขบูชา', 'NATIONAL'),
(1, '2026-06-03', 'วันเฉลิมฯ สมเด็จพระราชินี', 'NATIONAL'),
(1, '2026-07-09', 'วันอาสาฬหบูชา', 'NATIONAL'),
(1, '2026-07-28', 'วันเฉลิมฯ ร.10', 'NATIONAL'),
(1, '2026-08-12', 'วันแม่แห่งชาติ', 'NATIONAL'),
(1, '2026-10-13', 'วันคล้ายวันสวรรคต ร.9', 'NATIONAL'),
(1, '2026-10-23', 'วันปิยมหาราช', 'NATIONAL'),
(1, '2026-12-05', 'วันพ่อแห่งชาติ', 'NATIONAL'),
(1, '2026-12-10', 'วันรัฐธรรมนูญ', 'NATIONAL'),
(1, '2026-12-31', 'วันสิ้นปี', 'NATIONAL');

-- ตัวอย่าง time_logs (ย้อนหลัง 2 สัปดาห์)
INSERT INTO `hrm_time_logs` (`employee_id`, `work_date`, `scan_time`, `scan_type`, `check_in_type`, `latitude`, `longitude`, `location_name`, `distance_from_base`, `is_verified_location`) VALUES
-- สัปดาห์ที่ 1
(1, '2026-02-21', '2026-02-21 08:20:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 15, 1),
(1, '2026-02-21', '2026-02-21 17:38:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 15, 1),
(1, '2026-02-23', '2026-02-23 08:06:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 12, 1),
(1, '2026-02-23', '2026-02-23 17:08:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 12, 1),
(1, '2026-02-24', '2026-02-24 08:10:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 10, 1),
(1, '2026-02-24', '2026-02-24 17:23:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 10, 1),
(1, '2026-02-25', '2026-02-25 08:43:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 18, 1),
(1, '2026-02-25', '2026-02-25 17:21:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 18, 1),
(1, '2026-02-26', '2026-02-26 08:23:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 8, 1),
(1, '2026-02-26', '2026-02-26 17:50:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 8, 1),
(1, '2026-02-27', '2026-02-27 08:51:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 20, 1),
(1, '2026-02-27', '2026-02-27 17:05:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 20, 1),
(1, '2026-02-28', '2026-02-28 08:17:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 14, 1),
(1, '2026-02-28', '2026-02-28 17:51:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 14, 1),
-- สัปดาห์ที่ 2
(1, '2026-03-02', '2026-03-02 08:31:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 11, 1),
(1, '2026-03-02', '2026-03-02 17:51:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 11, 1),
(1, '2026-03-03', '2026-03-03 08:18:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 9, 1),
(1, '2026-03-03', '2026-03-03 17:09:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 9, 1),
(1, '2026-03-04', '2026-03-04 08:41:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 16, 1),
(1, '2026-03-04', '2026-03-04 17:28:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 16, 1),
(1, '2026-03-05', '2026-03-05 08:47:00', 'IN', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 13, 1),
(1, '2026-03-05', '2026-03-05 17:11:00', 'OUT', 'ONSITE', 13.7563, 100.5018, 'สำนักงานใหญ่ SDR', 13, 1);