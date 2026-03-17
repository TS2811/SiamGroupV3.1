<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/models/BaseModel.php';
require_once __DIR__ . '/../../backend/pay/models/PayCertificate.php';

$model = new PayCertificate($pdo);

// ดูรายการทั้งหมด
echo "=== All certificates ===\n";
$certs = $model->getCertificates();
foreach ($certs as $c) {
    echo "  ID={$c['id']} | doc={$c['document_number']} | status={$c['status']} | sign_method={$c['sign_method']}\n";
}

// สร้างใหม่เพื่อทดสอบ approve
echo "\n=== Creating test cert ===\n";
try {
    $id = $model->createCertificate([
        'employee_id' => 2,
        'doc_type' => 'CERT_SALARY',
        'requested_by' => 1,
    ]);
    echo "Created ID: $id\n";

    // ทดสอบ approve
    echo "\n=== Signing cert $id ===\n";
    $ok = $model->signCertificate($id, 'APPROVE_ONLY');
    echo "Sign result: " . ($ok ? 'true' : 'false') . "\n";

    // ตรวจสอบผลลัพธ์
    $cert = $model->find($id);
    echo "After sign: status={$cert['status']}, sign_method={$cert['sign_method']}\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
