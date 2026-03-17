<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/models/BaseModel.php';
require_once __DIR__ . '/../../backend/pay/models/PayBonus.php';

$model = new PayBonus($pdo);

echo "Testing calculateBonusScores(2026, company=1)...\n";
try {
    $results = $model->calculateBonusScores(2026, 1);
    echo "SUCCESS: " . count($results) . " employees\n";
    foreach ($results as $r) {
        echo "  - {$r['name']}: eval={$r['evaluation_score']}, attend={$r['attendance_score']}, total={$r['total_score']}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
