SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `core_app_structure`;

CREATE TABLE `core_app_structure` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `parent_id` int(11) DEFAULT NULL COMMENT 'ถ้าเป็น NULL คือ System Group, ถ้ามีค่าคือ Page',
    `code` varchar(50) NOT NULL COMMENT 'e.g. HRM, HRM_LEAVE',
    `name_th` varchar(100) NOT NULL COMMENT 'e.g. ระบบ HR, หน้าขอลา',
    `type` enum('SYSTEM', 'PAGE', 'SECTION') DEFAULT 'PAGE' COMMENT 'ประเภทโครงสร้าง',
    `sort_order` int(11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_app_parent` (`parent_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'โครงสร้างระบบและเมนู';

DROP TABLE IF EXISTS `core_branches`;

CREATE TABLE `core_branches` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `company_id` int(11) NOT NULL,
    `code` varchar(20) NOT NULL,
    `name_th` varchar(255) NOT NULL,
    `name_en` varchar(255) DEFAULT NULL,
    `peak_category` varchar(100) DEFAULT NULL COMMENT 'กลุ่มจัดประเภทสาขาในระบบ PEAK',
    `is_active` tinyint(1) DEFAULT 1,
    `latitude` decimal(10, 8) DEFAULT NULL COMMENT 'พิกัดละติจูด',
    `longitude` decimal(11, 8) DEFAULT NULL COMMENT 'พิกัดลองจิจูด',
    `check_radius` int(11) DEFAULT 200 COMMENT 'รัศมีเช็คอิน (เมตร)',
    `address` text DEFAULT NULL,
    `mapping_code` varchar(50) DEFAULT NULL COMMENT 'รหัสเชื่อมโยงระบบอื่น',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_branch_to_company` (`company_id`),
    CONSTRAINT `fk_branch_to_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `core_companies`;

CREATE TABLE `core_companies` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `type` varchar(20) NOT NULL COMMENT 'HEADQUARTER, SUBSIDIARY',
    `code` varchar(20) NOT NULL,
    `name_th` varchar(255) NOT NULL,
    `name_en` varchar(255) DEFAULT NULL,
    `tax_id` varchar(20) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
    `logo_url` varchar(255) DEFAULT NULL,
    `address` text DEFAULT NULL,
    `phone` varchar(50) DEFAULT NULL,
    `email` varchar(100) DEFAULT NULL,
    `website` varchar(100) DEFAULT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `core_departments`;

CREATE TABLE `core_departments` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `company_id` int(11) NULL DEFAULT NULL,
    `name` varchar(100) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_dept_to_company` (`company_id`),
    CONSTRAINT `fk_dept_to_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `core_level_permissions`;

CREATE TABLE `core_level_permissions` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `level_id` int(11) NOT NULL,
    `app_structure_id` int(11) NOT NULL COMMENT 'Link to core_app_structure',
    `actions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON e.g. ["VIEW","CREATE","APPROVE"]',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_perm_level` (`level_id`),
    KEY `fk_perm_app` (`app_structure_id`),
    CONSTRAINT `fk_perm_app` FOREIGN KEY (`app_structure_id`) REFERENCES `core_app_structure` (`id`),
    CONSTRAINT `fk_perm_level` FOREIGN KEY (`level_id`) REFERENCES `core_levels` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'กำหนดสิทธิ์รายหน้า';

DROP TABLE IF EXISTS `core_levels`;

CREATE TABLE `core_levels` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `role_id` int(11) NOT NULL,
    `department_id` int(11) DEFAULT NULL,
    `level_score` int(11) NOT NULL DEFAULT 10 COMMENT '1=Highest, 10=Lowest',
    `description` varchar(255) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_level_to_role` (`role_id`),
    KEY `fk_level_to_dept` (`department_id`),
    CONSTRAINT `fk_level_to_dept` FOREIGN KEY (`department_id`) REFERENCES `core_departments` (`id`),
    CONSTRAINT `fk_level_to_role` FOREIGN KEY (`role_id`) REFERENCES `core_roles` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `core_roles`;

CREATE TABLE `core_roles` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name_en` varchar(50) NOT NULL COMMENT 'e.g. CEO, Manager, Driver',
    `name_th` varchar(50) NOT NULL COMMENT 'e.g. CEO, Manager, Driver',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `core_users`;

CREATE TABLE `core_users` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `email` varchar(100) DEFAULT NULL,
    `first_name_th` varchar(100) NOT NULL,
    `last_name_th` varchar(100) NOT NULL,
    `first_name_en` varchar(100) DEFAULT NULL,
    `last_name_en` varchar(100) DEFAULT NULL,
    `nickname` varchar(50) DEFAULT NULL,
    `gender` enum('MALE', 'FEMALE', 'OTHER') DEFAULT NULL,
    `birth_date` date DEFAULT NULL,
    `phone_number` varchar(20) DEFAULT NULL,
    `avatar_url` varchar(255) DEFAULT NULL COMMENT 'URL รูปโปรไฟล์ผู้ใช้งาน',
    `line_user_id` varchar(255) DEFAULT NULL,
    `line_token` varchar(255) DEFAULT NULL COMMENT 'Line Notify',
    `discord_token` varchar(255) DEFAULT NULL COMMENT 'ใช้สำหรับเชื่อมต่อ Discord',
    `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะผู้ใช้งาน',
    `is_admin` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'สิทธิ์ผู้ดูแลระบบ — ตั้งค่าระบบได้',
    `last_login_at` datetime DEFAULT NULL COMMENT 'เวลาที่เข้าสู่ระบบล่าสุด',
    `last_login_ip` varchar(45) DEFAULT NULL COMMENT 'IP Address ล่าสุดที่เข้าใช้งาน',
    `created_by` bigint(20) DEFAULT NULL,
    `updated_by` bigint(20) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hrm_employees`;

CREATE TABLE `hrm_employees` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned NOT NULL,
    `employee_code` varchar(20) NOT NULL,
    `company_id` int(11) NOT NULL,
    `branch_id` int(11) unsigned NOT NULL,
    `level_id` int(11) NOT NULL,
    `start_date` date DEFAULT NULL COMMENT 'วันเริ่มงาน',
    `salary_type` enum(
        'MONTHLY',
        'DAILY',
        'JOB_BASED'
    ) DEFAULT 'MONTHLY',
    `base_salary` decimal(12, 2) DEFAULT 0.00,
    `status` enum(
        'PROBATION',
        'FULL_TIME',
        'RESIGNED',
        'TERMINATED'
    ) DEFAULT 'PROBATION',
    `manager_id` int(11) unsigned DEFAULT NULL COMMENT 'หัวหน้างานสายตรง',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_emp_to_level` (`level_id`),
    KEY `fk_emp_to_user` (`user_id`),
    KEY `fk_emp_manager` (`manager_id`),
    CONSTRAINT `fk_emp_manager` FOREIGN KEY (`manager_id`) REFERENCES `hrm_employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_emp_to_level` FOREIGN KEY (`level_id`) REFERENCES `core_levels` (`id`),
    CONSTRAINT `fk_emp_to_user` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hrm_employee_leave_quotas`;

CREATE TABLE `hrm_employee_leave_quotas` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `employee_id` int(11) unsigned NOT NULL COMMENT 'รหัสพนักงาน',
    `leave_type_id` int(11) unsigned NOT NULL COMMENT 'ประเภทลา',
    `year` int(4) NOT NULL COMMENT 'ปี (ค.ศ.)',
    `quota_days` decimal(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'สิทธิ์วันลาทั้งหมดของปีนี้',
    `used_days` decimal(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'ใช้ไปแล้ว',
    `remaining_days` decimal(5, 2) GENERATED ALWAYS AS (`quota_days` - `used_days`) VIRTUAL COMMENT 'คงเหลือ (Virtual)',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_quota_unique` (
        `employee_id`,
        `leave_type_id`,
        `year`
    ),
    KEY `fk_quota_type` (`leave_type_id`),
    CONSTRAINT `fk_quota_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_quota_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hrm_leave_types` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'โควต้าวันลาพนักงานรายปี';

DROP TABLE IF EXISTS `hrm_holidays`;

CREATE TABLE `hrm_holidays` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสวันหยุด',
    `company_id` int(11) DEFAULT NULL COMMENT 'ระบุบริษัท (ว่าง=ใช้ทุกบริษัท)',
    `branch_id` int(11) unsigned DEFAULT NULL COMMENT 'ระบุสาขา (ว่าง=ใช้ทุกสาขา)',
    `holiday_date` date NOT NULL COMMENT 'วันที่หยุด (เช่น 2026-04-13)',
    `name` varchar(100) NOT NULL COMMENT 'ชื่อวันหยุด (เช่น วันสงกรานต์)',
    `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะใช้งาน',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้าง',
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_date_branch` (
        `holiday_date`,
        `company_id`,
        `branch_id`
    ),
    KEY `fk_hol_comp` (`company_id`),
    KEY `fk_hol_branch` (`branch_id`),
    CONSTRAINT `fk_hol_branch` FOREIGN KEY (`branch_id`) REFERENCES `core_branches` (`id`),
    CONSTRAINT `fk_hol_comp` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ตารางวันหยุดประจำปี';

DROP TABLE IF EXISTS `hrm_leave_requests`;

CREATE TABLE `hrm_leave_requests` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสใบลา',
    `employee_id` int(11) unsigned NOT NULL COMMENT 'ผู้ขอลา',
    `leave_type_id` int(11) unsigned NOT NULL COMMENT 'ประเภทการลา',
    `leave_format` enum('DAILY', 'HOURLY') DEFAULT 'DAILY' COMMENT 'รูปแบบการลา (รายวัน/รายชั่วโมง)',
    `start_date` date NOT NULL COMMENT 'วันที่เริ่มลา',
    `end_date` date NOT NULL COMMENT 'วันที่สิ้นสุดลา',
    `start_time` time DEFAULT NULL COMMENT 'เวลาเริ่ม (กรณีลาชั่วโมง)',
    `end_time` time DEFAULT NULL COMMENT 'เวลาสิ้นสุด (กรณีลาชั่วโมง)',
    `days_count` decimal(5, 2) NOT NULL COMMENT 'จำนวนวันลา (ถ้าลาชั่วโมงให้คำนวณเป็นทศนิยม)',
    `reason` text DEFAULT NULL COMMENT 'เหตุผลการลา',
    `attachment_path` varchar(500) DEFAULT NULL COMMENT 'ไฟล์แนบ (ใบรับรองแพทย์)',
    `is_urgent` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1=ลาด่วน, 0=ลาปกติ',
    `status` enum(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) DEFAULT 'PENDING' COMMENT 'สถานะคำร้อง',
    `approved_by` bigint(20) unsigned DEFAULT NULL COMMENT 'ผู้อนุมัติ',
    `approved_at` datetime DEFAULT NULL COMMENT 'เวลาที่อนุมัติ',
    `approver_comment` text DEFAULT NULL COMMENT 'ความเห็นผู้อนุมัติ',
    `acknowledge` tinyint(1) DEFAULT NULL COMMENT 'ผู้ขอรับทราบผลแล้ว: 1=รับทราบ, NULL=ยังไม่ดู',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'เวลาที่สร้างคำร้อง',
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_leave_emp` (`employee_id`),
    KEY `fk_leave_type` (`leave_type_id`),
    KEY `idx_leave_emp_dates` (
        `employee_id`,
        `start_date`,
        `end_date`,
        `status`
    ),
    KEY `idx_leave_status` (`status`),
    CONSTRAINT `fk_leave_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`),
    CONSTRAINT `fk_leave_type` FOREIGN KEY (`leave_type_id`) REFERENCES `hrm_leave_types` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'คำร้องขอลา';

DROP TABLE IF EXISTS `hrm_leave_types`;

CREATE TABLE `hrm_leave_types` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสประเภทลา',
    `name_th` varchar(100) NOT NULL COMMENT 'ชื่อประเภทลา (ไทย)',
    `name_en` varchar(100) DEFAULT NULL COMMENT 'ชื่อประเภทลา (อังกฤษ)',
    `requires_file` tinyint(1) DEFAULT 0 COMMENT 'ต้องแนบไฟล์หรือไม่ (1=ต้องแนบ)',
    `is_paid` tinyint(1) DEFAULT 1 COMMENT 'ได้รับค่าจ้างหรือไม่ (1=จ่าย)',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ประเภทการลา';

DROP TABLE IF EXISTS `hrm_ot_requests`;

CREATE TABLE `hrm_ot_requests` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสคำร้อง OT',
    `employee_id` int(11) unsigned NOT NULL COMMENT 'ผู้ขอ OT',
    `request_date` date NOT NULL COMMENT 'วันที่ทำ OT',
    `ot_type` enum(
        'OT_1_5',
        'OT_1_0',
        'OT_2_0',
        'OT_3_0',
        'SHIFT_PREMIUM'
    ) NOT NULL DEFAULT 'OT_1_5' COMMENT '1.5=วันธรรมดา, 1.0/2.0=ทำงานวันหยุด, 3.0=OTวันหยุด',
    `start_time` time NOT NULL COMMENT 'เวลาเริ่ม',
    `end_time` time NOT NULL COMMENT 'เวลาสิ้นสุด',
    `reason` text DEFAULT NULL COMMENT 'เหตุผล/รายละเอียดงาน',
    `status` enum(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) DEFAULT 'PENDING' COMMENT 'สถานะ',
    `approved_by` bigint(20) unsigned DEFAULT NULL COMMENT 'ผู้อนุมัติ',
    `approver_comment` text DEFAULT NULL COMMENT 'ความเห็นผู้อนุมัติ',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_ot_emp` (`employee_id`),
    CONSTRAINT `fk_ot_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'คำร้องขอทำล่วงเวลา (OT)';

DROP TABLE IF EXISTS `hrm_personal_off_days`;

CREATE TABLE `hrm_personal_off_days` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `employee_id` int(11) unsigned NOT NULL COMMENT 'รหัสพนักงาน (อ้างอิง hrm_employees)',
    `day_off_date` date NOT NULL COMMENT 'วันที่หยุด (เช่น 2026-03-02)',
    `description` varchar(255) DEFAULT NULL COMMENT 'สาเหตุการหยุด',
    `reason` varchar(255) DEFAULT NULL,
    `user_id` int(11) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_emp_date` (`employee_id`, `day_off_date`),
    CONSTRAINT `fk_personal_off_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'วันหยุดเฉพาะบุคคล (Individual Off Days)';

DROP TABLE IF EXISTS `hrm_shift_swap_requests`;

CREATE TABLE `hrm_shift_swap_requests` (
    `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสคำร้อง',
    `requester_id` INT(11) UNSIGNED NOT NULL COMMENT 'ผู้ขอสลับ',
    `target_employee_id` INT(11) UNSIGNED NULL DEFAULT NULL COMMENT 'ผู้ที่จะสลับด้วย (ถ้ามี)',
    `type` ENUM('SWAP', 'BANK', 'USE_BANK') NOT NULL DEFAULT 'SWAP' COLLATE 'utf8mb4_unicode_ci',
    `requester_date` DATE NOT NULL COMMENT 'วันที่ของผู้ขอ (วันหยุดเดิม/กะเดิม)',
    `target_date` DATE NULL DEFAULT NULL,
    `bank_use_date` DATE NULL DEFAULT NULL,
    `reason` TEXT NULL DEFAULT NULL COMMENT 'เหตุผล' COLLATE 'utf8mb4_unicode_ci',
    `status` ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) NULL DEFAULT 'PENDING' COMMENT 'สถานะ' COLLATE 'utf8mb4_unicode_ci',
    `approved_by` BIGINT(20) UNSIGNED NULL DEFAULT NULL COMMENT 'ผู้อนุมัติ',
    `approver_comment` TEXT NULL DEFAULT NULL COMMENT 'ความเห็นผู้อนุมัติ' COLLATE 'utf8mb4_unicode_ci',
    `is_banked` TINYINT(1) NULL DEFAULT '0',
    `acknowledge` TINYINT(1) NULL DEFAULT NULL COMMENT 'ผู้ขอรับทราบผลแล้ว: 1=รับทราบ, NULL=ยังไม่ดู',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `fk_swap_req` (`requester_id`) USING BTREE,
    INDEX `fk_swap_target` (`target_employee_id`) USING BTREE,
    INDEX `idx_swap_req_dates` (
        `requester_id`,
        `requester_date`,
        `status`
    ) USING BTREE,
    CONSTRAINT `fk_swap_req` FOREIGN KEY (`requester_id`) REFERENCES `hrm_employees` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT `fk_swap_target` FOREIGN KEY (`target_employee_id`) REFERENCES `hrm_employees` (`id`) ON UPDATE RESTRICT ON DELETE RESTRICT
) COMMENT = 'คำร้องขอสลับกะ/วันหยุด' COLLATE = 'utf8mb4_unicode_ci' ENGINE = InnoDB;

DROP TABLE IF EXISTS `hrm_time_correction_requests`;

CREATE TABLE `hrm_time_correction_requests` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสคำร้อง',
    `employee_id` int(11) unsigned NOT NULL COMMENT 'ผู้ขอปรับปรุงเวลา',
    `work_date` date NOT NULL COMMENT 'วันที่ต้องการแก้ไข',
    `old_in_time` datetime DEFAULT NULL COMMENT 'เวลาเข้าเดิม (ถ้ามี)',
    `new_in_time` datetime DEFAULT NULL COMMENT 'เวลาเข้าที่ขอแก้ไข',
    `old_out_time` datetime DEFAULT NULL COMMENT 'เวลาออกเดิม (ถ้ามี)',
    `new_out_time` datetime DEFAULT NULL COMMENT 'เวลาออกที่ขอแก้ไข',
    `reason` text NOT NULL COMMENT 'เหตุผลที่ขอแก้ไข',
    `attachment_path` varchar(255) DEFAULT NULL COMMENT 'ไฟล์แนบ',
    `status` enum(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) DEFAULT 'PENDING' COMMENT 'สถานะ',
    `approved_by` bigint(20) unsigned DEFAULT NULL COMMENT 'ผู้อนุมัติ',
    `approver_comment` text DEFAULT NULL COMMENT 'ความเห็นผู้อนุมัติ',
    `acknowledge` tinyint(1) DEFAULT 0 COMMENT 'การยืนยัน',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_fix_emp` (`employee_id`),
    CONSTRAINT `fk_fix_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'คำร้องขอแก้ไขเวลา/ลืมลงเวลา';

DROP TABLE IF EXISTS `hrm_time_logs`;

CREATE TABLE `hrm_time_logs` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสรายการ',
    `employee_id` int(11) unsigned NOT NULL COMMENT 'รหัสพนักงาน',
    `work_date` date NOT NULL COMMENT 'วันที่ของกะงาน (Logical Date)',
    `scan_time` datetime NOT NULL COMMENT 'เวลาจริงที่กด',
    `scan_type` enum('IN', 'OUT') NOT NULL,
    `latitude` decimal(10, 8) DEFAULT NULL,
    `longitude` decimal(11, 8) DEFAULT NULL,
    `location_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อสถานที่',
    `distance_from_base` int(11) DEFAULT NULL COMMENT 'ระยะห่าง(เมตร)',
    `is_verified_location` tinyint(1) DEFAULT 0 COMMENT '1=ในพิกัด',
    `user_agent` text DEFAULT NULL,
    `device_risk_flag` varchar(255) DEFAULT NULL,
    `ip_address` varchar(50) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'เวลาที่บันทึกข้อมูล',
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_emp_workdate` (`employee_id`, `work_date`),
    CONSTRAINT `fk_log_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'บันทึกเวลาทำงาน';

DROP TABLE IF EXISTS `hrm_user_daily_remarks`;

CREATE TABLE `hrm_user_daily_remarks` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `employee_id` int(11) NOT NULL,
    `work_date` date NOT NULL,
    `remarks` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `employee_id` (`employee_id`, `work_date`) USING BTREE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

DROP TABLE IF EXISTS `hrm_daily_remarks`;

DROP TABLE IF EXISTS `hrm_work_schedules`;

CREATE TABLE `hrm_work_schedules` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'รหัสตารางงาน',
    `employee_id` int(11) unsigned NOT NULL COMMENT 'รหัสพนักงาน',
    `day_of_week` tinyint(1) NOT NULL COMMENT '1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat,7=Sun',
    `week_pattern` enum('ALL', 'ODD', 'EVEN') DEFAULT 'ALL' COMMENT 'ALL=ทุกสัปดาห์, ODD=คี่, EVEN=คู่ (เสาร์เว้นเสาร์)',
    `schedule_type` enum('FIXED', 'FLEXIBLE') DEFAULT 'FIXED' COMMENT 'fixed=เวลาตายตัว, flexible=นับชั่วโมง',
    `is_day_off` tinyint(1) DEFAULT 0 COMMENT '1=วันหยุดประจำสัปดาห์',
    `start_time` time DEFAULT NULL COMMENT 'เวลาเข้า (เช่น 21:00)',
    `end_time` time DEFAULT NULL COMMENT 'เวลาออก (เช่น 06:00)',
    `is_cross_day` tinyint(1) DEFAULT 0 COMMENT '1=เลิกงานข้ามวัน (ช่วยคำนวณ date+1)',
    `required_hours` decimal(4, 2) DEFAULT NULL COMMENT 'สำหรับ Flexible (เช่น 8.00 ชม.)',
    `location_type` enum('OFFICE', 'ANYWHERE') DEFAULT 'OFFICE',
    `effective_from` date NOT NULL COMMENT 'เริ่มใช้กะนี้เมื่อไหร่',
    `effective_to` date DEFAULT NULL,
    `created_by` bigint(20) unsigned DEFAULT NULL,
    `updated_by` bigint(20) unsigned DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_emp_pattern` (
        `employee_id`,
        `day_of_week`,
        `week_pattern`
    ),
    CONSTRAINT `fk_sched_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ตารางกะการทำงาน (Work Schedules)';

SET FOREIGN_KEY_CHECKS = 1;