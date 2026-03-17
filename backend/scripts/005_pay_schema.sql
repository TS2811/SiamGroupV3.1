-- ================================================================
-- SiamGroup V3.1 — Payroll Module Schema
-- ================================================================
-- PRD Reference: PRD_03_PAYROLL_SYSTEM.md
-- TSD Reference: TSD_03_PAYROLL_MODULE.md
-- Database: siamgroup_v3
-- Prefix: pay_
-- ================================================================

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. pay_ot_types — Master: ประเภท OT (Configurable)
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_ot_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'รหัสประเภท OT',
    `name_th` VARCHAR(100) NOT NULL COMMENT 'ชื่อไทย',
    `name_en` VARCHAR(100) NULL COMMENT 'ชื่ออังกฤษ',
    `calc_method` ENUM('FORMULA','FIXED_RATE','TIME_SLOT') NOT NULL COMMENT 'วิธีคำนวณ',
    `formula_base` ENUM('HOURLY','DAILY') NULL COMMENT 'HOURLY=÷30÷8, DAILY=÷30 (ใช้กับ FORMULA)',
    `multiplier` DECIMAL(3,1) NULL COMMENT 'ตัวคูณ (ใช้กับ FORMULA)',
    `min_hours` DECIMAL(3,1) DEFAULT 0 COMMENT 'ชม.ขั้นต่ำถึงจะได้ OT (0=ไม่มี)',
    `company_id` INT NULL COMMENT 'NULL=ทุกบริษัท, มีค่า=เฉพาะบ.นี้',
    `branch_id` INT NULL COMMENT 'NULL=ทุกสาขา, มีค่า=เฉพาะสาขานี้',
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ot_company` (`company_id`),
    INDEX `idx_ot_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='ประเภท OT (Configurable — 3 วิธี: FORMULA, FIXED_RATE, TIME_SLOT)';

-- ================================================================
-- 2. pay_ot_fixed_rates — Tier อัตรา OT ตามเงินเดือน
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_ot_fixed_rates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ot_type_id` INT NOT NULL COMMENT 'FK → pay_ot_types.id',
    `salary_min` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'เงินเดือนขั้นต่ำ',
    `salary_max` DECIMAL(12,2) NULL COMMENT 'เงินเดือนสูงสุด (NULL = ไม่จำกัด)',
    `rate_per_hour` DECIMAL(10,2) NOT NULL COMMENT 'อัตราบาท/ชม.',
    `multiplier` DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT 'ตัวคูณ',
    CONSTRAINT `fk_fixedrate_ottype` FOREIGN KEY (`ot_type_id`)
        REFERENCES `pay_ot_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='อัตรา OT แบบ Fixed Rate (Tier ตามเงินเดือน)';

-- ================================================================
-- 3. pay_ot_time_slots — ช่วงเวลา Shift Premium
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_ot_time_slots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ot_type_id` INT NOT NULL COMMENT 'FK → pay_ot_types.id',
    `start_time` TIME NOT NULL COMMENT 'เวลาเริ่ม',
    `end_time` TIME NOT NULL COMMENT 'เวลาสิ้นสุด',
    `amount` DECIMAL(10,2) NOT NULL COMMENT 'จำนวนเงิน Flat ต่อ Segment',
    `sort_order` INT DEFAULT 0,
    CONSTRAINT `fk_timeslot_ottype` FOREIGN KEY (`ot_type_id`)
        REFERENCES `pay_ot_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='ช่วงเวลา OT แบบ Time Slot (CNX Shift Premium)';

-- ================================================================
-- 4. pay_item_types — Master: หัวข้อรายได้/เงินหัก (Configurable)
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_item_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. BASE_SALARY, OT_PAY, MEETING_FEE',
    `name_th` VARCHAR(100) NOT NULL COMMENT 'ชื่อหัวข้อ (TH)',
    `name_en` VARCHAR(100) NULL COMMENT 'ชื่อหัวข้อ (EN)',
    `type` ENUM('INCOME','DEDUCTION') NOT NULL COMMENT 'รายได้ หรือ เงินหัก',
    `calc_type` ENUM('AUTO','MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT 'ระบบคำนวณ หรือ HR กรอก',
    `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=System Item ห้ามลบ',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'เปิด/ปิดหัวข้อ',
    `sort_order` INT DEFAULT 0 COMMENT 'ลำดับการแสดงในสลิป',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='หัวข้อรายได้/เงินหัก (Configurable — HR เพิ่ม/ลบ/เปิด/ปิดได้)';

-- ================================================================
-- 5. pay_payroll_periods — รอบเงินเดือนรายเดือน
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_payroll_periods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL COMMENT 'FK → core_companies.id',
    `period_month` VARCHAR(7) NOT NULL COMMENT 'YYYY-MM (e.g. 2026-02)',
    `start_date` DATE NOT NULL COMMENT 'วันเริ่มรอบ (21 ของเดือนก่อน)',
    `end_date` DATE NOT NULL COMMENT 'วันสิ้นรอบ (20 ของเดือนนี้)',
    `pay_date` DATE NOT NULL COMMENT 'วันจ่ายเงิน (1 ของเดือนถัดไป)',
    `status` ENUM('DRAFT','REVIEWING','FINALIZED','PAID') DEFAULT 'DRAFT',
    `finalized_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `finalized_at` DATETIME NULL,
    `paid_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_company_period` (`company_id`, `period_month`),
    CONSTRAINT `fk_period_company` FOREIGN KEY (`company_id`) 
        REFERENCES `core_companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='รอบเงินเดือนรายเดือน (21-20 cycle)';

-- ================================================================
-- 6. pay_payroll_records — สรุปเงินเดือนรายบุคคล
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_payroll_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `period_id` INT NOT NULL COMMENT 'FK → pay_payroll_periods.id',
    `employee_id` INT NOT NULL COMMENT 'FK → hrm_employees.id',
    `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'เงินเดือนฐาน (ณ รอบนั้น)',
    `working_days` INT NULL COMMENT 'จำนวนวันทำงาน (สำหรับ DAILY)',
    `total_income` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'รวมรายได้',
    `total_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'รวมเงินหัก',
    `net_pay` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'เงินเดือนสุทธิ',
    `tax_auto_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'ภาษีที่ระบบคำนวณ',
    `tax_final_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'ภาษีที่ใช้จริง (HR override ได้)',
    `notes` TEXT NULL COMMENT 'หมายเหตุ',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_period_employee` (`period_id`, `employee_id`),
    CONSTRAINT `fk_record_period` FOREIGN KEY (`period_id`) 
        REFERENCES `pay_payroll_periods` (`id`),
    CONSTRAINT `fk_record_employee` FOREIGN KEY (`employee_id`) 
        REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='สรุปเงินเดือนรายบุคคลต่อรอบ';

-- ================================================================
-- 7. pay_payroll_items — รายการรายได้/หักแต่ละหัวข้อ
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_payroll_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_id` INT NOT NULL COMMENT 'FK → pay_payroll_records.id',
    `item_type_id` INT NOT NULL COMMENT 'FK → pay_item_types.id',
    `amount` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'จำนวนเงิน',
    `description` VARCHAR(255) NULL COMMENT 'รายละเอียดเพิ่มเติม',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_record_item` (`record_id`, `item_type_id`),
    CONSTRAINT `fk_item_record` FOREIGN KEY (`record_id`) 
        REFERENCES `pay_payroll_records` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_type` FOREIGN KEY (`item_type_id`) 
        REFERENCES `pay_item_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='รายการรายได้/เงินหักแต่ละหัวข้อต่อคนต่อรอบ';

-- ================================================================
-- 8. pay_salary_advances — คำขอเบิกเงินเดือนล่วงหน้า (Dual Approval)
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_salary_advances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL COMMENT 'FK → hrm_employees.id',
    `period_month` VARCHAR(7) NOT NULL COMMENT 'รอบเดือนที่เบิก (YYYY-MM)',
    `amount` DECIMAL(12,2) NOT NULL COMMENT 'จำนวนเงินเบิก',
    `reason` TEXT NULL COMMENT 'เหตุผล',
    `manager_status` ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    `manager_id` BIGINT UNSIGNED NULL COMMENT 'หัวหน้าที่อนุมัติ',
    `manager_approved_at` DATETIME NULL,
    `manager_comment` TEXT NULL,
    `hr_status` ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    `hr_id` BIGINT UNSIGNED NULL COMMENT 'HR ที่อนุมัติ',
    `hr_approved_at` DATETIME NULL,
    `hr_comment` TEXT NULL,
    `overall_status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_advance_emp` (`employee_id`),
    INDEX `idx_advance_month` (`period_month`),
    INDEX `idx_advance_status` (`overall_status`),
    CONSTRAINT `fk_advance_emp` FOREIGN KEY (`employee_id`) 
        REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='คำขอเบิกเงินเดือนล่วงหน้า (Dual Approval: หัวหน้า+HR)';

-- ================================================================
-- 9. pay_loans — เงินกู้ยืมพนักงาน
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_loans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL COMMENT 'FK → hrm_employees.id',
    `loan_amount` DECIMAL(12,2) NOT NULL COMMENT 'ยอดเงินกู้ (เงินต้น)',
    `has_interest` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=มีดอกเบี้ย, 0=ไม่มี',
    `interest_rate` DECIMAL(5,2) DEFAULT 0 COMMENT 'อัตราดอกเบี้ย %/ปี (Flat Rate)',
    `total_interest` DECIMAL(12,2) DEFAULT 0 COMMENT 'ดอกเบี้ยรวม',
    `total_amount` DECIMAL(12,2) NOT NULL COMMENT 'ยอดรวม (เงินต้น + ดอกเบี้ย)',
    `monthly_payment` DECIMAL(12,2) NOT NULL COMMENT 'ยอดผ่อนต่อเดือน',
    `total_installments` INT NOT NULL COMMENT 'จำนวนงวดทั้งหมด',
    `paid_installments` INT NOT NULL DEFAULT 0 COMMENT 'ผ่อนไปแล้ว (งวด)',
    `remaining_balance` DECIMAL(12,2) NOT NULL COMMENT 'ยอดคงเหลือ',
    `start_date` DATE NOT NULL COMMENT 'เดือนที่เริ่มหัก (วันแรกของเดือน)',
    `status` ENUM('ACTIVE','COMPLETED','CANCELLED') DEFAULT 'ACTIVE',
    `approved_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_loan_emp` (`employee_id`),
    INDEX `idx_loan_status` (`status`),
    CONSTRAINT `fk_loan_emp` FOREIGN KEY (`employee_id`) 
        REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='เงินกู้ยืมพนักงาน (Flat Rate Interest)';

-- ================================================================
-- 10. pay_loan_payments — ประวัติการหักผ่อนกู้ยืมรายเดือน
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_loan_payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `loan_id` INT NOT NULL COMMENT 'FK → pay_loans.id',
    `period_id` INT NOT NULL COMMENT 'FK → pay_payroll_periods.id',
    `installment_no` INT NOT NULL COMMENT 'งวดที่',
    `payment_amount` DECIMAL(12,2) NOT NULL COMMENT 'จำนวนเงินที่หัก',
    `remaining_balance` DECIMAL(12,2) NOT NULL COMMENT 'ยอดคงเหลือหลังหัก',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_loan_period` (`loan_id`, `period_id`),
    CONSTRAINT `fk_loanpay_loan` FOREIGN KEY (`loan_id`) 
        REFERENCES `pay_loans` (`id`),
    CONSTRAINT `fk_loanpay_period` FOREIGN KEY (`period_id`) 
        REFERENCES `pay_payroll_periods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='ประวัติการหักผ่อนกู้ยืมรายเดือน';

-- ================================================================
-- 11. pay_certificates — เอกสาร Generate จากระบบ (6 ประเภท, 2 ฝั่งลงนาม)
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_certificates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL COMMENT 'FK → hrm_employees.id',
    `doc_type` ENUM('CERT_WORK','CERT_SALARY','CONTRACT','SUBCONTRACT','RESIGN','DISCIPLINARY') NOT NULL,
    `document_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'เลขที่เอกสาร (Auto-Generate)',
    `issued_date` DATE NOT NULL COMMENT 'วันที่ออก',
    `requested_by` BIGINT UNSIGNED NOT NULL COMMENT 'FK → core_users.id (ผู้ขอเอกสาร)',
    `approver_id` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id (ผู้ยืนยันเอกสาร)',
    `status` ENUM('PENDING_APPROVAL','SIGNED','APPROVED','REJECTED') DEFAULT 'PENDING_APPROVAL',
    `sign_method` ENUM('UPLOAD_IMAGE','E_SIGNATURE','PRINT_SIGN_UPLOAD','APPROVE_ONLY') NULL COMMENT 'วิธีที่ผู้ยืนยันเลือก',
    `file_path` VARCHAR(500) NULL COMMENT 'Path ไฟล์ PDF ที่ Generate',
    `signature_image_path` VARCHAR(500) NULL COMMENT 'Path รูปลายเซ็น (วิธี 1)',
    `signed_document_path` VARCHAR(500) NULL COMMENT 'Path เอกสารที่เซ็นแล้ว (วิธี 2)',
    `salary_at_issue` DECIMAL(12,2) NULL COMMENT 'เงินเดือน ณ วันที่ออก',
    `approved_at` DATETIME NULL COMMENT 'วันเวลาที่ลงนาม/อนุมัติ',
    `reject_reason` TEXT NULL COMMENT 'เหตุผลที่ปฏิเสธ',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cert_emp` (`employee_id`),
    INDEX `idx_cert_type` (`doc_type`),
    INDEX `idx_cert_status` (`status`),
    CONSTRAINT `fk_cert_emp` FOREIGN KEY (`employee_id`) 
        REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='เอกสาร Generate (หนังสือรับรอง, สัญญาจ้าง, ใบลาออก, ฯลฯ)';

-- ================================================================
-- 12. pay_bonuses — โบนัสประจำปี
-- ================================================================
CREATE TABLE IF NOT EXISTS `pay_bonuses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL COMMENT 'FK → hrm_employees.id',
    `year` INT NOT NULL COMMENT 'ปี (ค.ศ.)',
    `evaluation_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนนประเมิน (เต็ม 70)',
    `attendance_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนน Attendance (เต็ม 30)',
    `total_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนนรวม (เต็ม 100)',
    `bonus_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'จำนวนเงินโบนัส (HR กำหนด)',
    `status` ENUM('DRAFT','APPROVED','PAID') DEFAULT 'DRAFT',
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_bonus_emp_year` (`employee_id`, `year`),
    CONSTRAINT `fk_bonus_emp` FOREIGN KEY (`employee_id`) 
        REFERENCES `hrm_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='โบนัสประจำปี (คะแนนประเมิน 70% + Attendance 30%)';

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- SEED DATA: System Item Types (ห้ามลบ)
-- ================================================================
INSERT INTO `pay_item_types` (`code`, `name_th`, `name_en`, `type`, `calc_type`, `is_system`, `is_active`, `sort_order`) VALUES
('BASE_SALARY',     'เงินเดือนฐาน',        'Base Salary',        'INCOME',    'AUTO', 1, 1, 1),
('OT_PAY',          'ค่าล่วงเวลา',         'OT Pay',             'INCOME',    'AUTO', 1, 1, 2),
('HOLIDAY_WORK',    'ค่าทำงานวันหยุด',     'Holiday Work Pay',   'INCOME',    'AUTO', 1, 1, 3),
('SOCIAL_SECURITY', 'ประกันสังคม',         'Social Security',    'DEDUCTION', 'AUTO', 1, 1, 10),
('WITHHOLDING_TAX', 'ภาษีหัก ณ ที่จ่าย',   'Withholding Tax',    'DEDUCTION', 'AUTO', 1, 1, 11),
('SALARY_ADVANCE',  'หักเบิกเงินล่วงหน้า', 'Salary Advance',     'DEDUCTION', 'AUTO', 1, 1, 12),
('LOAN_PAYMENT',    'หักผ่อนกู้ยืม',       'Loan Payment',       'DEDUCTION', 'AUTO', 1, 1, 13);

-- Custom Item Types ตัวอย่าง (จาก Meeting HR)
INSERT INTO `pay_item_types` (`code`, `name_th`, `name_en`, `type`, `calc_type`, `is_system`, `is_active`, `sort_order`) VALUES
('MEETING_FEE',  'เบี้ยประชุม',            'Meeting Fee',        'INCOME',    'MANUAL', 0, 1, 20),
('ALLOWANCE',    'เบี้ยเลี้ยงต่างจังหวัด', 'Per Diem Allowance', 'INCOME',    'MANUAL', 0, 1, 21),
('COMMISSION',   'คอมมิชชั่น',             'Commission',         'INCOME',    'MANUAL', 0, 1, 22),
('DRIVING_PAY',  'ค่าขับรถ',               'Driving Pay',        'INCOME',    'MANUAL', 0, 1, 23),
('DORM_FEE',     'ค่าหอพัก',               'Dormitory Fee',      'DEDUCTION', 'MANUAL', 0, 1, 30);

-- ================================================================
-- SEED DATA: OT Types (ตาม PRD_03 Section 4.3)
-- ================================================================

-- กลุ่ม A: DHL (SXD=company 3, SPD=company 4) — FORMULA
INSERT INTO `pay_ot_types` (`code`, `name_th`, `calc_method`, `formula_base`, `multiplier`, `min_hours`, `company_id`, `sort_order`) VALUES
('OT_REGULAR_DHL',           'OT วันธรรมดา (DHL)',           'FORMULA', 'HOURLY', 1.5, 0, 3, 1),
('HOLIDAY_WORK_MONTHLY_DHL', 'ทำงานวันหยุด MONTHLY (DHL)',   'FORMULA', 'DAILY',  1.0, 0, 3, 2),
('HOLIDAY_WORK_DAILY_DHL',   'ทำงานวันหยุด DAILY (DHL)',     'FORMULA', 'DAILY',  2.0, 0, 3, 3),
('OT_HOLIDAY_DHL',           'OT วันหยุด (DHL)',             'FORMULA', 'HOURLY', 3.0, 0, 3, 4);

-- Copy สำหรับ SPD (company 4)
INSERT INTO `pay_ot_types` (`code`, `name_th`, `calc_method`, `formula_base`, `multiplier`, `min_hours`, `company_id`, `sort_order`) VALUES
('OT_REGULAR_SPD',           'OT วันธรรมดา (SPD)',           'FORMULA', 'HOURLY', 1.5, 0, 4, 1),
('HOLIDAY_WORK_MONTHLY_SPD', 'ทำงานวันหยุด MONTHLY (SPD)',   'FORMULA', 'DAILY',  1.0, 0, 4, 2),
('HOLIDAY_WORK_DAILY_SPD',   'ทำงานวันหยุด DAILY (SPD)',     'FORMULA', 'DAILY',  2.0, 0, 4, 3),
('OT_HOLIDAY_SPD',           'OT วันหยุด (SPD)',             'FORMULA', 'HOURLY', 3.0, 0, 4, 4);

-- กลุ่ม B: CarRental (SDR=company 1, SAR=company 2) — FIXED_RATE + FORMULA
INSERT INTO `pay_ot_types` (`code`, `name_th`, `calc_method`, `formula_base`, `multiplier`, `min_hours`, `company_id`, `sort_order`) VALUES
('OT_OFFICE_REG_CAR_SDR',    'OT ออฟฟิศ วันธรรมดา (SDR)',   'FIXED_RATE', NULL, NULL, 1.0, 1, 10),
('OT_OFFICE_HOL_CAR_SDR',    'OT ออฟฟิศ วันหยุด (SDR)',     'FIXED_RATE', NULL, NULL, 1.0, 1, 11),
('OT_SALES_CAR_SDR',         'OT เซลล์ (SDR)',               'FIXED_RATE', NULL, NULL, 0,   1, 12),
('HOLIDAY_WORK_REG_CAR_SDR', 'ทำงานวันหยุดปกติ (SDR)',       'FORMULA', 'DAILY',  1.0, 0,   1, 13),
('HOLIDAY_WORK_NAT_CAR_SDR', 'ทำงานวันหยุดนักขัตฤกษ์ (SDR)', 'FORMULA', 'DAILY',  1.5, 0,   1, 14);

-- Copy สำหรับ SAR (company 2)
INSERT INTO `pay_ot_types` (`code`, `name_th`, `calc_method`, `formula_base`, `multiplier`, `min_hours`, `company_id`, `sort_order`) VALUES
('OT_OFFICE_REG_CAR_SAR',    'OT ออฟฟิศ วันธรรมดา (SAR)',   'FIXED_RATE', NULL, NULL, 1.0, 2, 10),
('OT_OFFICE_HOL_CAR_SAR',    'OT ออฟฟิศ วันหยุด (SAR)',     'FIXED_RATE', NULL, NULL, 1.0, 2, 11),
('OT_SALES_CAR_SAR',         'OT เซลล์ (SAR)',               'FIXED_RATE', NULL, NULL, 0,   2, 12),
('HOLIDAY_WORK_REG_CAR_SAR', 'ทำงานวันหยุดปกติ (SAR)',       'FORMULA', 'DAILY',  1.0, 0,   2, 13),
('HOLIDAY_WORK_NAT_CAR_SAR', 'ทำงานวันหยุดนักขัตฤกษ์ (SAR)', 'FORMULA', 'DAILY',  1.5, 0,   2, 14);

-- กลุ่ม C: CNX Shift Premium — TIME_SLOT (เฉพาะสาขา CNX)
-- ต้องหา branch_id จริงของ CNX — สมมุติ branch_id = 5 (SXD เชียงใหม่)
INSERT INTO `pay_ot_types` (`code`, `name_th`, `calc_method`, `company_id`, `branch_id`, `sort_order`) VALUES
('CNX_SHIFT_PREMIUM', 'Shift Premium (CNX)', 'TIME_SLOT', 3, 5, 20);

-- SDR Fixed Rates (inline subquery แทน SET variable เพื่อหลีกเลี่ยงปัญหา encoding)
INSERT INTO `pay_ot_fixed_rates` (`ot_type_id`, `salary_min`, `salary_max`, `rate_per_hour`, `multiplier`) VALUES
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_REG_CAR_SDR'), 0,     19999.99, 70, 1.0),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_REG_CAR_SDR'), 20000, NULL,     90, 1.0),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_HOL_CAR_SDR'), 0,     19999.99, 70, 1.5),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_HOL_CAR_SDR'), 20000, NULL,     90, 1.5),
((SELECT id FROM pay_ot_types WHERE code = 'OT_SALES_CAR_SDR'),      0,     NULL,     90, 1.0);

-- SAR Fixed Rates (ใช้กฎเดียวกัน)
INSERT INTO `pay_ot_fixed_rates` (`ot_type_id`, `salary_min`, `salary_max`, `rate_per_hour`, `multiplier`) VALUES
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_REG_CAR_SAR'), 0,     19999.99, 70, 1.0),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_REG_CAR_SAR'), 20000, NULL,     90, 1.0),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_HOL_CAR_SAR'), 0,     19999.99, 70, 1.5),
((SELECT id FROM pay_ot_types WHERE code = 'OT_OFFICE_HOL_CAR_SAR'), 20000, NULL,     90, 1.5),
((SELECT id FROM pay_ot_types WHERE code = 'OT_SALES_CAR_SAR'),      0,     NULL,     90, 1.0);

-- CNX Time Slots
INSERT INTO `pay_ot_time_slots` (`ot_type_id`, `start_time`, `end_time`, `amount`, `sort_order`) VALUES
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '17:01', '19:59', 100, 1),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '20:00', '22:00', 200, 2),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '22:01', '23:59', 300, 3),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '00:00', '01:59', 500, 4),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '02:00', '03:59', 600, 5),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '04:00', '05:00', 300, 6),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '05:01', '06:00', 200, 7),
((SELECT id FROM pay_ot_types WHERE code = 'CNX_SHIFT_PREMIUM'), '06:01', '07:59', 100, 8);