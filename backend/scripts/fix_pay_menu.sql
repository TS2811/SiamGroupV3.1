SET NAMES utf8mb4;

-- Fix item types Thai names
UPDATE pay_item_types
SET
    name_th = 'เงินเดือนพื้นฐาน'
WHERE
    code = 'BASE_SALARY';

UPDATE pay_item_types
SET
    name_th = 'ค่าล่วงเวลา (OT)'
WHERE
    code = 'OT_PAY';

UPDATE pay_item_types
SET
    name_th = 'ค่าทำงานวันหยุด'
WHERE
    code = 'HOLIDAY_WORK';

UPDATE pay_item_types
SET
    name_th = 'ประกันสังคม'
WHERE
    code = 'SOCIAL_SECURITY';

UPDATE pay_item_types
SET
    name_th = 'ภาษีหัก ณ ที่จ่าย'
WHERE
    code = 'WITHHOLDING_TAX';

UPDATE pay_item_types
SET
    name_th = 'เบิกเงินเดือนล่วงหน้า'
WHERE
    code = 'SALARY_ADVANCE';

UPDATE pay_item_types
SET
    name_th = 'หักเงินกู้ยืม'
WHERE
    code = 'LOAN_PAYMENT';

UPDATE pay_item_types
SET
    name_th = 'ค่าประชุม'
WHERE
    code = 'MEETING_FEE';

UPDATE pay_item_types
SET
    name_th = 'เบี้ยเลี้ยง/ค่าเดินทาง'
WHERE
    code = 'ALLOWANCE';

UPDATE pay_item_types
SET
    name_th = 'ค่าคอมมิชชั่น'
WHERE
    code = 'COMMISSION';

UPDATE pay_item_types
SET
    name_th = 'ค่าขับรถ'
WHERE
    code = 'DRIVING_PAY';

UPDATE pay_item_types
SET
    name_th = 'ค่าหอพัก'
WHERE
    code = 'DORM_FEE';

-- Fix PAY menu Thai names (in case)
UPDATE core_app_structure
SET
    name_th = 'เงินเดือน'
WHERE
    slug = 'PAY_PAYROLL';

UPDATE core_app_structure
SET
    name_th = 'กู้ยืม/เบิกล่วงหน้า'
WHERE
    slug = 'PAY_LOANS';