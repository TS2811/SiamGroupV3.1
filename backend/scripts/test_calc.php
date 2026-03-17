<?php
// Quick test: calculate payroll for period_id=2
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/models/BaseModel.php';
require_once __DIR__ . '/../../backend/pay/models/PayPayroll.php';

$model = new PayPayroll($pdo);

// Check period
$period = $model->find(2);
echo "Period: " . json_encode($period, JSON_UNESCAPED_UNICODE) . "\n\n";

// Check employees for this company
$emps = $model->query(
    "SELECT e.id, e.employee_code, e.status, e.base_salary, u.first_name_th 
     FROM hrm_employees e JOIN core_users u ON e.user_id = u.id 
     WHERE e.company_id = :cid AND e.status NOT IN ('RESIGNED', 'TERMINATED')",
    ['cid' => $period['company_id']]
);
echo "Employees found: " . count($emps) . "\n";
foreach ($emps as $e) {
    echo "  - {$e['employee_code']} | {$e['first_name_th']} | status={$e['status']} | salary={$e['base_salary']}\n";
}

// Try calculate
echo "\nRunning calculatePeriod(2)...\n";
try {
    $results = $model->calculatePeriod(2);
    echo "SUCCESS: " . count($results) . " employees calculated\n";
    foreach ($results as $r) {
        echo "  - {$r['name']}: base={$r['base_salary']}, net={$r['net_pay']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
