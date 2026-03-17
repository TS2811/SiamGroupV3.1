-- ACC Menu Items for core_app_structure
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- Delete old ACC sub-pages (keep ACC_MAIN system id=4)
DELETE FROM core_app_structure
WHERE
    parent_id = 4
    AND slug != 'ACC_MAIN';

-- Insert ACC pages under ACC_MAIN (parent_id = 4)
INSERT INTO
    core_app_structure (
        slug,
        name_th,
        name_en,
        icon,
        parent_id,
        type,
        module,
        route,
        sort_order,
        is_active
    )
VALUES (
        'acc_easy_fill',
        'Easy Fill',
        'Easy Fill',
        'Description',
        4,
        'PAGE',
        'acc',
        '/acc/easy-fill',
        1,
        1
    ),
    (
        'acc_new_expense',
        'สร้างรายการ',
        'New Expense',
        'AddBox',
        4,
        'PAGE',
        'acc',
        '/acc/new-expense',
        2,
        1
    ),
    (
        'acc_expense_report',
        'Expense Report',
        'Expense Report',
        'Autorenew',
        4,
        'PAGE',
        'acc',
        '/acc/expense-report',
        3,
        1
    ),
    (
        'acc_expense_dash',
        'Expense Dashboard',
        'Expense Dashboard',
        'GridView',
        4,
        'PAGE',
        'acc',
        '/acc/expense-dashboard',
        4,
        1
    ),
    (
        'acc_group_dash',
        'Group Dashboard',
        'Group Dashboard',
        'EditNote',
        4,
        'PAGE',
        'acc',
        '/acc/group-dashboard',
        5,
        1
    ),
    (
        'acc_pay_approval',
        'อนุมัติรอบจ่าย',
        'Payment Approval',
        'CheckCircle',
        4,
        'PAGE',
        'acc',
        '/acc/payment-run-approval',
        6,
        1
    ),
    (
        'acc_settings_page',
        'ตั้งค่า',
        'Settings',
        'Settings',
        4,
        'PAGE',
        'acc',
        '/acc/settings',
        7,
        1
    );

-- Update ACC_MAIN route to first page
UPDATE core_app_structure
SET
    route = '/acc/easy-fill'
WHERE
    slug = 'ACC_MAIN';

-- Fix ACC_PAGE name if garbled
UPDATE core_app_structure
SET
    name_th = 'ระบบบัญชี',
    name_en = 'Accounting'
WHERE
    slug = 'ACC_MAIN';