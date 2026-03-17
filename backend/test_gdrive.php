<?php
require_once __DIR__ . '/gdrive_helper.php';

// อัปโหลดรูปไปที่โฟลเดอร์ _test
$uploadsDir = __DIR__ . '/../';

// ค้นหาไฟล์รูปที่เพิ่งได้มา
$logoFile = null;
$searchPaths = [
    'C:/Users/thana/Downloads/siam_auto_rent.png',
    'C:/Users/thana/Downloads/siam_auto_rent.jpg',
    'C:/Users/thana/Desktop/siam_auto_rent.png',
];

// ถ้าไม่เจอ ให้สร้างไฟล์ทดสอบ
foreach ($searchPaths as $path) {
    if (file_exists($path)) {
        $logoFile = $path;
        break;
    }
}

// ถ้ามี argument ให้ใช้ path จาก argument
if ($argc > 1 && file_exists($argv[1])) {
    $logoFile = $argv[1];
}

if (!$logoFile) {
    echo "Usage: php test_gdrive.php <path_to_file>\n";
    echo "Example: php test_gdrive.php C:\\path\\to\\logo.png\n";
    exit(1);
}

echo "Uploading: $logoFile\n";
echo "Target folder: _test\n\n";

try {
    $result = gdrive_uploadFile($logoFile, basename($logoFile), ['_test']);
    echo "✅ Upload Success!\n";
    echo "GDrive URI: $result\n";
    echo "File ID: " . substr($result, 9) . "\n";
    echo "View URL: https://drive.google.com/file/d/" . substr($result, 9) . "/view\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
