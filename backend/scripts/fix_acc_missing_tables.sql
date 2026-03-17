-- =============================================
-- ACC Gap Fix: สร้าง tables ที่ขาดหายไป
-- Database: siamgroup_v3
-- Date: 2026-03-17
-- =============================================

-- 1. v3_user_company_access — ตาราง ACC ใช้กำหนดสิทธิ์มองเห็นบริษัท
-- ACC api.php อ้างถึง 5 จุด (SELECT, DELETE, INSERT)
CREATE TABLE IF NOT EXISTS `v3_user_company_access` (
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`, `company_id`),
  KEY `fk_uca_user` (`user_id`),
  KEY `fk_uca_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางกำหนดสิทธิ์การมองเห็นบริษัทรายบุคคล (ACC module)';

-- Seed: ให้ทุก user ที่มีอยู่เข้าถึงทุกบริษัทเป็นค่าเริ่มต้น
-- INSERT IGNORE INTO v3_user_company_access (user_id, company_id)
-- SELECT u.id, c.id FROM core_users u CROSS JOIN core_companies c WHERE u.is_active = 1;
