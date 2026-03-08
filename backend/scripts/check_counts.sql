SELECT 'employees' AS tbl, COUNT(*) AS cnt
FROM hrm_employees
UNION ALL
SELECT 'time_logs', COUNT(*)
FROM hrm_time_logs
UNION ALL
SELECT 'leave_req', COUNT(*)
FROM hrm_leave_requests
UNION ALL
SELECT 'ot_req', COUNT(*)
FROM hrm_ot_requests
UNION ALL
SELECT 'leave_quotas', COUNT(*)
FROM hrm_employee_leave_quotas
UNION ALL
SELECT 'holidays', COUNT(*)
FROM hrm_holidays
UNION ALL
SELECT 'shifts_assign', COUNT(*)
FROM hrm_employee_shifts
UNION ALL
SELECT 'users', COUNT(*)
FROM core_users;