SET NAMES utf8mb4;

-- เพิ่ม sub-pages ใหม่ใน Payroll module (parent_id=3 คือ ระบบเงินเดือน)
INSERT IGNORE INTO core_app_structure (
    parent_id,
    slug,
    name_th,
    name_en,
    icon,
    route,
    sort_order,
    is_active
)
VALUES (
        3,
        'PAY_CERTIFICATES',
        'หนังสือรับรอง/เอกสาร',
        'Certificates',
        'Description',
        '/pay/certificates',
        3,
        1
    ),
    (
        3,
        'PAY_BONUSES',
        'โบนัสประจำปี',
        'Bonuses',
        'CardGiftcard',
        '/pay/bonuses',
        4,
        1
    );

-- เพิ่ม permissions สำหรับ pages ใหม่ (Admin level 8)
INSERT IGNORE INTO core_level_permissions (level_id, app_structure_id)
SELECT 8, id
FROM core_app_structure
WHERE
    slug IN (
        'PAY_CERTIFICATES',
        'PAY_BONUSES'
    );