-- =============================================
-- ACC Module Tables for V3.1 (New DB)
-- Generated: 2026-03-12
-- Source: longter1_v2 → v3_1 DB
-- Excluded: v3_acc_bank_statements (BankReconciliation removed)
-- =============================================

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. MASTER / LOOKUP TABLES (no FK dependencies)
-- =============================================

-- 1.1 ธนาคาร Master
CREATE TABLE IF NOT EXISTS `v3_acc_banks_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_th` varchar(255) NOT NULL COMMENT 'ชื่อภาษาไทย',
  `name_en` varchar(255) DEFAULT NULL COMMENT 'ชื่อภาษาอังกฤษ',
  `code` varchar(10) NOT NULL COMMENT 'รหัสที่เราใช้ภายใน เช่น KBANK, TTB',
  `bot_code` varchar(4) NOT NULL COMMENT 'รหัส 3-4 หลักตามมาตรฐานธปท. เช่น 004',
  `swift_code` varchar(11) DEFAULT NULL COMMENT 'รหัส SWIFT Code สำหรับธุรกรรมต่างประเทศ',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `bot_code` (`bot_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Actions Master
CREATE TABLE IF NOT EXISTS `v3_acc_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_name` varchar(50) NOT NULL COMMENT 'รหัส Action (เช่น CHECK, CONFIRM)',
  `label` varchar(100) NOT NULL COMMENT 'ชื่อแสดงผล',
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_action_name` (`action_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.3 Workflow Status (สถานะ)
CREATE TABLE IF NOT EXISTS `v3_acc_workflow_status` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'System Name (ENUM Key)',
  `label_th` varchar(100) NOT NULL COMMENT 'ชื่อแสดงผล (ไทย)',
  `label_en` varchar(100) NOT NULL COMMENT 'Display Name (Eng)',
  `description` varchar(255) DEFAULT NULL COMMENT 'คำอธิบายเพิ่มเติม',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='เก็บสถานะของ Workflow (10 ขั้นตอน)';

-- 1.4 Workflow Types (ประเภท)
CREATE TABLE IF NOT EXISTS `v3_acc_workflow_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_type` enum('GENERAL','PCASH','AUTO','CLAIM','FCASH','TRANSFER','FREFUND') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expense_type` (`expense_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores the workflow step sequence for each expense type.';

-- 1.5 Workflow Sequences (ลำดับ)
CREATE TABLE IF NOT EXISTS `v3_acc_workflow_sequences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_type` varchar(50) NOT NULL COMMENT 'ประเภท Expense',
  `workflow_status_id` int(11) NOT NULL COMMENT 'สถานะ (v3_acc_workflow_status.id)',
  `step_order` int(11) NOT NULL COMMENT 'ลำดับที่',
  PRIMARY KEY (`id`),
  KEY `idx_expense_type` (`expense_type`),
  KEY `fk_seq_status` (`workflow_status_id`),
  CONSTRAINT `fk_seq_status` FOREIGN KEY (`workflow_status_id`) REFERENCES `v3_acc_workflow_status` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='เก็บลำดับการทำงานของแต่ละ Expense Type';

-- =============================================
-- 2. SYSTEM / PERMISSION TABLES
-- =============================================

-- 2.1 System Modules
CREATE TABLE IF NOT EXISTS `v3_system_modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(100) NOT NULL COMMENT 'ชื่อหน้าจอ (เช่น บันทึกค่าใช้จ่าย, อนุมัติรวม)',
  `module_slug` varchar(100) NOT NULL COMMENT 'Slug สำหรับเช็คในโค้ด (เช่น acc_expense_create)',
  `parent_id` int(11) DEFAULT NULL COMMENT 'กรณีมีเมนูย่อย',
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`module_slug`),
  KEY `FK_v3_system_modules_v3_system_modules` (`parent_id`),
  CONSTRAINT `FK_v3_system_modules_v3_system_modules` FOREIGN KEY (`parent_id`) REFERENCES `v3_system_modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='ตารางเก็บรายชื่อหน้าจอหรือโมดูลในระบบ';

-- 2.2 Role Module Access
CREATE TABLE IF NOT EXISTS `v3_role_module_access` (
  `role_id` int(11) NOT NULL COMMENT 'FK: roles.id',
  `module_id` int(11) NOT NULL COMMENT 'FK: v3_system_modules.id',
  PRIMARY KEY (`role_id`,`module_id`),
  KEY `fk_access_role` (`role_id`),
  KEY `fk_access_module` (`module_id`),
  CONSTRAINT `fk_access_module` FOREIGN KEY (`module_id`) REFERENCES `v3_system_modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_access_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางกำหนดสิทธิ์การเข้าถึงโมดูลตาม Role';

-- 2.3 User Branch Access
CREATE TABLE IF NOT EXISTS `v3_user_branch_access` (
  `user_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='ตารางกำหนดสิทธิ์การมองเห็นสาขารายบุคคล';

-- 2.4 User Company Access
CREATE TABLE IF NOT EXISTS `v3_user_company_access` (
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`company_id`),
  CONSTRAINT `fk_uca_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='ตารางกำหนดสิทธิ์การมองเห็นบริษัทรายบุคคล';

-- 2.5 Approval Rules
CREATE TABLE IF NOT EXISTS `v3_acc_approval_rules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `role_id` int(11) NOT NULL COMMENT 'FK: สิทธิ์ที่ได้รับสิทธิ์อนุมัติ (roles.id)',
  `action_name` varchar(50) DEFAULT 'CHECK' COMMENT 'ชื่อแอคชั่นที่สามารถทำได้',
  `company_id` int(11) DEFAULT NULL COMMENT 'มีผลกับบริษัทที่กำหนด (NULL = ทุกบริษัท)',
  `branch_id` int(11) DEFAULT NULL COMMENT 'มีผลกับสาขาที่กำหนด (NULL = ทุกสาขา)',
  `min_amount` decimal(14,2) DEFAULT 0.00 COMMENT 'ยอดขั้นต่ำที่เริ่มมีอำนาจอนุมัติ',
  `max_amount` decimal(14,2) DEFAULT NULL COMMENT 'ยอดสูงสุดที่สามารถอนุมัติได้',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'สถานะการใช้งานกฎนี้: 1=เปิด, 0=ปิด',
  PRIMARY KEY (`id`),
  KEY `fk_rule_role` (`role_id`),
  KEY `fk_rules_branch` (`branch_id`),
  KEY `fk_rules_company` (`company_id`),
  CONSTRAINT `fk_rule_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rules_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rules_company` FOREIGN KEY (`company_id`) REFERENCES `our_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางกำหนดเงื่อนไขและวงเงินการอนุมัติรายตำแหน่ง';

-- =============================================
-- 3. PAYEE TABLES
-- =============================================

-- 3.1 Payees (ผู้รับเงิน)
CREATE TABLE IF NOT EXISTS `v3_acc_payees` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `name` varchar(100) NOT NULL COMMENT 'ชื่อร้านค้า หรือ ชื่อพนักงานผู้รับเงิน',
  `type` enum('INTERNAL','EXTERNAL') NOT NULL COMMENT 'ประเภท: INTERNAL(พนักงาน), EXTERNAL(คู่ค้านอก)',
  `peak_id` varchar(50) DEFAULT NULL COMMENT 'ID ติดต่อ/ผู้จำหน่าย ในระบบ PEAK',
  `tax_id` varchar(20) DEFAULT NULL COMMENT 'เลขเสียภาษีของร้านค้า (ถ้ามี)',
  `branch_code` varchar(10) DEFAULT NULL,
  `is_peak` tinyint(1) DEFAULT 0,
  `company_id` int(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_v3_acc_payees_our_companies` (`company_id`),
  CONSTRAINT `FK_v3_acc_payees_our_companies` FOREIGN KEY (`company_id`) REFERENCES `our_companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บทะเบียนผู้รับเงิน/Vendor';

-- 3.2 Payee Banks (บัญชีผู้รับเงิน)
CREATE TABLE IF NOT EXISTS `v3_acc_payee_banks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `payee_id` int(11) NOT NULL COMMENT 'FK: อ้างอิง id จาก v3_acc_payees',
  `bank_id` int(11) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL COMMENT 'เลขที่บัญชีธนาคาร',
  `account_name` varchar(255) DEFAULT NULL COMMENT 'ชื่อเจ้าของบัญชี',
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'สถานะบัญชีหลัก: 1=ใช่, 0=ไม่ใช่',
  `balance` decimal(14,2) DEFAULT 0.00,
  `branches` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_payee_bank` (`payee_id`),
  KEY `FK_v3_acc_payee_banks_v3_acc_banks_master` (`bank_id`),
  CONSTRAINT `FK_v3_acc_payee_banks_v3_acc_banks_master` FOREIGN KEY (`bank_id`) REFERENCES `v3_acc_banks_master` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payee_bank` FOREIGN KEY (`payee_id`) REFERENCES `v3_acc_payees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บเลขบัญชีธนาคารของผู้รับเงิน (1 รายมีได้หลายบัญชี)';

-- =============================================
-- 4. COMPANY ACCOUNTS
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_company_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key: ไอดีบัญชีบริษัท',
  `company_id` int(11) NOT NULL COMMENT 'FK: อ้างอิง id จาก our_companies',
  `name` varchar(100) NOT NULL COMMENT 'ชื่อเรียกบัญชี (เช่น กสิกร-ออมทรัพย์)',
  `bank_id` int(11) DEFAULT NULL,
  `number` varchar(50) DEFAULT NULL COMMENT 'เลขที่บัญชีบริษัท',
  `gl_code` varchar(20) DEFAULT NULL COMMENT 'รหัส GL ผังบัญชีธนาคารใน PEAK (หมวด 1)',
  `nickname` varchar(50) DEFAULT NULL,
  `balance` decimal(20,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `FK_v3_acc_company_accounts_v3_acc_banks_master` (`bank_id`),
  KEY `fk_comp_acc_company` (`company_id`),
  CONSTRAINT `FK_v3_acc_company_accounts_v3_acc_banks_master` FOREIGN KEY (`bank_id`) REFERENCES `v3_acc_banks_master` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_acc_company` FOREIGN KEY (`company_id`) REFERENCES `our_companies` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บสมุดบัญชีธนาคารของบริษัทสำหรับจ่ายเงินออก';

-- =============================================
-- 5. EXPENSE CATEGORIES
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `name` varchar(255) NOT NULL COMMENT 'ชื่อหมวดหมู่ค่าใช้จ่าย',
  `gl_code` varchar(10) NOT NULL COMMENT 'รหัสบัญชีแยกประเภท (GL 6+ หลัก)',
  `company_id` int(11) DEFAULT NULL COMMENT 'FK: ถ้าเป็นหมวดเฉพาะบริษัท, NULL = ทั่วไป',
  `has_vat` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'หมวดนี้มี VAT หรือไม่: 1=มี, 0=ไม่มี',
  `default_wht_rate` decimal(5,2) DEFAULT 0.00 COMMENT 'อัตราหัก ณ ที่จ่ายเริ่มต้น',
  `updated_by` int(11) DEFAULT NULL COMMENT 'ID คนอัพเดต',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'สถานะ: 1=ใช้งาน, 0=ปิด',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_gl_code_company` (`gl_code`,`company_id`),
  KEY `fk_cat_company` (`company_id`),
  KEY `FK_v3_acc_expense_categories_users` (`updated_by`),
  CONSTRAINT `FK_v3_acc_expense_categories_users` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_cat_company` FOREIGN KEY (`company_id`) REFERENCES `our_companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางหมวดหมู่ค่าใช้จ่ายและผังบัญชี (GL)';

-- =============================================
-- 6. GROUPS
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL COMMENT 'ชื่อกลุ่ม (มีหรือไม่ก็ได้)',
  `group_date` date NOT NULL COMMENT 'วันที่ของกลุ่ม (ต้องมี)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `group_off` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_group_date` (`group_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================
-- 7. PAYMENT RUNS
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_payment_runs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key: ไอดีรอบการจ่าย',
  `run_code` varchar(20) DEFAULT NULL COMMENT 'รหัสรัน (เช่น PR-202310-001)',
  `run_name` varchar(100) DEFAULT NULL COMMENT 'ชื่อเรียกกลุ่มการจ่าย',
  `group_id` int(11) DEFAULT NULL COMMENT 'FK: เชื่อมกับ v3_acc_groups',
  `payment_date` date NOT NULL COMMENT 'วันที่โอนเงินจริง (Transfer Date)',
  `source_bank_id` int(11) NOT NULL COMMENT 'FK: จ่ายจากบัญชีบริษัทไหน',
  `peak_payment_id` varchar(50) DEFAULT NULL COMMENT 'ID การจ่ายเงินที่ได้รับกลับมาจาก PEAK API',
  `created_by_id` int(11) DEFAULT NULL COMMENT 'FK: ผู้สร้างรอบจ่าย',
  `reconciled_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่กระทบยอด',
  `reconciled_by_id` int(11) DEFAULT NULL COMMENT 'FK: ผู้กระทบยอด',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างรอบการจ่าย',
  PRIMARY KEY (`id`),
  KEY `fk_run_group` (`group_id`),
  KEY `fk_run_source_bank` (`source_bank_id`),
  KEY `fk_run_creator` (`created_by_id`),
  CONSTRAINT `fk_run_creator` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_run_group` FOREIGN KEY (`group_id`) REFERENCES `v3_acc_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_run_source_bank` FOREIGN KEY (`source_bank_id`) REFERENCES `v3_acc_company_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางรวบรวมรายการค่าใช้จ่ายเพื่อจ่ายเป็นก้อน';

-- =============================================
-- 8. EXPENSE DOCS (หัวเอกสาร)
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_expense_docs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key: ไอดีใบเบิก',
  `doc_id` varchar(20) DEFAULT NULL COMMENT 'เลขที่เอกสารภายใน (เช่น EXP-23001)',
  `user_id` int(11) NOT NULL COMMENT 'FK: ผู้ขอเบิก (users.id)',
  `company_id` int(11) DEFAULT NULL COMMENT 'FK: บริษัทที่เกิดค่าใช้จ่าย',
  `branch_id` int(11) DEFAULT NULL COMMENT 'FK: สาขาที่เกิดค่าใช้จ่าย',
  `payee_id` int(11) DEFAULT NULL COMMENT 'FK: ผู้รับเงิน (v3_acc_payees.id)',
  `payee_bank_id` int(11) DEFAULT NULL COMMENT 'FK: บัญชีธนาคารผู้รับเงิน (v3_acc_payee_banks.id)',
  `vendor_name` varchar(255) DEFAULT NULL,
  `Id_bank` int(11) DEFAULT NULL,
  `branches_bank` varchar(50) DEFAULT NULL,
  `num_bank` varchar(50) DEFAULT NULL COMMENT 'เลขที่บัญชี (Manual)',
  `u_name_bank` varchar(255) DEFAULT NULL COMMENT 'ชื่อบัญชีธนาคาร (Manual)',
  `expense_type` enum('GENERAL','PCASH','AUTO_CAR','CLAIM','FCASH','TRANSFER','FREFUND') NOT NULL COMMENT 'ประเภทการเบิก',
  `status_id` int(11) NOT NULL DEFAULT 1 COMMENT 'FK: สถานะใบเบิก (v3_acc_workflow_status.id)',
  `run_id` int(11) DEFAULT NULL COMMENT 'FK: เชื่อมกับ v3_acc_payment_runs',
  `checked_by` int(11) DEFAULT NULL COMMENT 'FK: ผู้ตรวจสอบเอกสาร (users.id)',
  `checked_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ตรวจสอบเอกสาร',
  `confirmed_by` int(11) DEFAULT NULL COMMENT 'FK: ผู้ยืนยันทางบัญชี (users.id)',
  `confirmed_at` timestamp NULL DEFAULT NULL COMMENT 'วันที่ยืนยันทางบัญชี',
  `invoice_date` date DEFAULT NULL COMMENT 'วันที่ใบเสร็จ',
  `tax_record_date` date DEFAULT NULL COMMENT 'วันที่บันทึกภาษีซื้อ',
  `invoice_number` varchar(50) DEFAULT NULL COMMENT 'เลขที่ใบกำกับภาษี',
  `tax_invoice_date` date DEFAULT NULL COMMENT 'วันที่ใบกำกับภาษี',
  `received_inv_by` int(11) DEFAULT NULL,
  `sent_inv_by` int(11) DEFAULT NULL,
  `wht_type` varchar(10) DEFAULT NULL COMMENT 'ประเภท ภ.ง.ด. (1, 3, 53)',
  `description` text DEFAULT NULL COMMENT 'รายละเอียดเหตุผลการใช้จ่าย',
  `remark` text DEFAULT NULL COMMENT 'หมายเหตุเพิ่มเติม',
  `external_ref` varchar(255) DEFAULT NULL,
  `peak_journal_id` varchar(50) DEFAULT NULL COMMENT 'ID สมุดรายวันที่ได้รับกลับมาจาก PEAK API',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่บันทึกรายการ',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่แก้ไขล่าสุด',
  `is_refund` int(11) DEFAULT NULL,
  `is_duplicate` tinyint(1) DEFAULT 0,
  `to_peak` tinyint(1) DEFAULT 0,
  `wait_bill` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_id` (`doc_id`),
  KEY `fk_doc_user` (`user_id`),
  KEY `fk_doc_company` (`company_id`),
  KEY `fk_doc_payee` (`payee_id`),
  KEY `fk_doc_run` (`run_id`),
  KEY `FK_v3_acc_expense_docs_branches` (`branch_id`),
  KEY `FK_v3_acc_expense_docs_users` (`checked_by`),
  KEY `FK_v3_acc_expense_docs_users_2` (`confirmed_by`),
  KEY `bank` (`num_bank`,`u_name_bank`),
  KEY `FK_v3_acc_expense_docs_status` (`status_id`),
  CONSTRAINT `FK_v3_acc_expense_docs_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_v3_acc_expense_docs_status` FOREIGN KEY (`status_id`) REFERENCES `v3_acc_workflow_status` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_v3_acc_expense_docs_users` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_v3_acc_expense_docs_users_2` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_company` FOREIGN KEY (`company_id`) REFERENCES `our_companies` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_payee` FOREIGN KEY (`payee_id`) REFERENCES `v3_acc_payees` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_run` FOREIGN KEY (`run_id`) REFERENCES `v3_acc_payment_runs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บข้อมูลหัวเอกสารเบิกจ่าย (Header)';

-- =============================================
-- 9. EXPENSE ITEMS (รายการย่อย)
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_expense_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_id` int(11) NOT NULL COMMENT 'FK: อ้างอิงเอกสารหลัก (v3_acc_expense_docs.id)',
  `category_id` int(11) DEFAULT NULL COMMENT 'FK: หมวดหมู่ค่าใช้จ่าย (v3_acc_expense_categories.id)',
  `expense_date` date NOT NULL COMMENT 'วันที่เกิดค่าใช้จ่ายตามใบเสร็จ',
  `invoice_due_later` tinyint(1) DEFAULT 0 COMMENT 'สถานะรอใบกำกับ: 1=ส่งภายหลัง, 0=ส่งแล้ว',
  `description` text DEFAULT NULL COMMENT 'รายละเอียดรายการ',
  `amount_before_vat` decimal(14,2) NOT NULL COMMENT 'ยอดเงินก่อนภาษีมูลค่าเพิ่ม',
  `vat_rate` decimal(5,2) DEFAULT 0.00 COMMENT 'เปอร์เซ็นต์ VAT (เช่น 7.00)',
  `vat_amount` decimal(14,2) DEFAULT 0.00 COMMENT 'จำนวนเงิน VAT',
  `wht_rate` decimal(5,2) DEFAULT 0.00 COMMENT 'เปอร์เซ็นต์ หัก ณ ที่จ่าย (เช่น 3.00)',
  `wht_amount` decimal(14,2) DEFAULT 0.00 COMMENT 'จำนวนเงินที่หักไว้',
  `wht_pay_type` varchar(1) NOT NULL DEFAULT '1' COMMENT '1=ไม่ออกแทน, 2=ออกให้ตลอดไป, 3=ออกให้ครั้งเดียว',
  `total_amount` decimal(14,2) NOT NULL COMMENT 'ยอดเงินรวมของรายการนี้ (ก่อนหัก WHT)',
  `net_payment` decimal(14,2) GENERATED ALWAYS AS (`total_amount` - `wht_amount`) STORED COMMENT 'ยอดสุทธิที่ต้องจ่ายจริง',
  `price_type` enum('1','2','3') DEFAULT '1' COMMENT 'ประเภทราคา (1=แยกนอก, 2=รวมใน, 3=ไม่มีภาษี)',
  `item_sequence` int(11) NOT NULL DEFAULT 1 COMMENT 'ลำดับที่',
  `payee_tax_id` varchar(13) DEFAULT NULL COMMENT 'เลขทะเบียน 13 หลัก',
  `payee_branch_code` varchar(5) DEFAULT '00000' COMMENT 'เลขสาขา 5 หลัก',
  `mapping_group_code` varchar(50) DEFAULT NULL COMMENT 'กลุ่มจัดประเภท',
  `refun_from_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_item_doc` (`doc_id`),
  KEY `fk_item_category` (`category_id`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `v3_acc_expense_categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_item_doc` FOREIGN KEY (`doc_id`) REFERENCES `v3_acc_expense_docs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บรายการค่าใช้จ่ายย่อย (Line Items)';

-- =============================================
-- 10. EXPENSE ATTACHMENTS (ไฟล์แนบ)
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_expense_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `doc_id` int(11) NOT NULL COMMENT 'FK: ผูกกับใบเบิก id ไหน',
  `file_path` varchar(255) NOT NULL COMMENT 'ที่อยู่ไฟล์ใน Server/Cloud',
  `original_name` varchar(255) NOT NULL COMMENT 'ชื่อไฟล์เดิมที่ User อัปโหลด',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่อัปโหลดไฟล์',
  PRIMARY KEY (`id`),
  KEY `fk_attach_doc` (`doc_id`),
  CONSTRAINT `fk_attach_doc` FOREIGN KEY (`doc_id`) REFERENCES `v3_acc_expense_docs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บข้อมูลไฟล์หลักฐานประกอบการเบิก';

-- =============================================
-- 11. EXPENSE HISTORY (ประวัติ/Log)
-- =============================================

CREATE TABLE IF NOT EXISTS `v3_acc_expense_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `doc_id` int(11) DEFAULT NULL COMMENT 'FK: เกี่ยวข้องกับใบเบิก id ไหน',
  `payment_run_id` int(11) DEFAULT NULL COMMENT 'FK: เกี่ยวข้องกับรอบจ่าย id ไหน',
  `user_id` int(11) NOT NULL COMMENT 'FK: ผู้กระทำการ (users.id)',
  `action` varchar(100) NOT NULL COMMENT 'กิจกรรมที่ทำ (เช่น REJECTED, APPROVED)',
  `comment` text DEFAULT NULL COMMENT 'เหตุผลหรือหมายเหตุเพิ่มเติม',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่บันทึกกิจกรรม',
  PRIMARY KEY (`id`),
  KEY `idx_history_doc` (`doc_id`),
  KEY `idx_history_run` (`payment_run_id`),
  KEY `FK_v3_acc_expense_history_users` (`user_id`),
  CONSTRAINT `FK_v3_acc_expense_history_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_v3_acc_expense_history_v3_acc_expense_docs` FOREIGN KEY (`doc_id`) REFERENCES `v3_acc_expense_docs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_v3_acc_expense_history_v3_acc_payment_runs` FOREIGN KEY (`payment_run_id`) REFERENCES `v3_acc_payment_runs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ตารางเก็บประวัติและ Log ทุกกิจกรรมที่เกิดขึ้นในระบบ';

-- =============================================

SET FOREIGN_KEY_CHECKS = 1;

-- Summary: 20 tables (excluded v3_acc_bank_statements)
-- =============================================
-- Master:    v3_acc_banks_master, v3_acc_actions, v3_acc_workflow_status,
--            v3_acc_workflow_types, v3_acc_workflow_sequences
-- System:    v3_system_modules, v3_role_module_access,
--            v3_user_branch_access, v3_user_company_access, v3_acc_approval_rules
-- Payee:     v3_acc_payees, v3_acc_payee_banks
-- Company:   v3_acc_company_accounts
-- Category:  v3_acc_expense_categories
-- Groups:    v3_acc_groups
-- Payment:   v3_acc_payment_runs
-- Expense:   v3_acc_expense_docs, v3_acc_expense_items,
--            v3_acc_expense_attachments, v3_acc_expense_history
-- =============================================