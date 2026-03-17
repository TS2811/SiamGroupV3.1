<?php

/**
 * gdrive_helper.php — V3.1 Shared Google Drive Helper
 * ใช้ร่วมได้ทุกโมดูล (ACC, HRM, Core, etc.)
 * 
 * Architecture:
 * - OAuth Client: สำหรับ อัปโหลด/ลบ/สร้างโฟลเดอร์
 * - Auto-refresh token เมื่อหมดอายุ
 * 
 * Config files ต้องอยู่ใน: backend/config/gdrive/
 *   - oauth_web.json       (OAuth credentials จาก Google Cloud Console)
 *   - gdrive_token.json    (Auto-generated token: สร้างจาก auth_gdrive.php)
 */

require_once __DIR__ . '/vendor/autoload.php';

// ===================== Config =====================
define('GDRIVE_CONFIG_DIR', __DIR__ . '/config/gdrive');
define('GDRIVE_OAUTH_CREDENTIALS_PATH', GDRIVE_CONFIG_DIR . '/oauth_web.json');
define('GDRIVE_TOKEN_PATH', GDRIVE_CONFIG_DIR . '/gdrive_token.json');
// Google Drive Root Folder for V3.1 files
define('GDRIVE_ROOT_FOLDER_ID', '1D4RXpv9zSG2dkvYgCf_P6KzwkhRMKh9k');

// ===================== Singleton =====================
$_gdrive_client = null;
$_gdrive_service = null;
$_gdrive_folder_cache = [];

// ================================================================
//  GOOGLE DRIVE CLIENT — OAuth (with auto-refresh)
// ================================================================
function getGDriveClient()
{
    global $_gdrive_client;
    if ($_gdrive_client !== null && !$_gdrive_client->isAccessTokenExpired()) {
        return $_gdrive_client;
    }

    if (!file_exists(GDRIVE_OAUTH_CREDENTIALS_PATH)) {
        throw new Exception('OAuth credentials not found: ' . GDRIVE_OAUTH_CREDENTIALS_PATH);
    }
    if (!file_exists(GDRIVE_TOKEN_PATH)) {
        throw new Exception('OAuth token not found. Visit: /v3_1/backend/auth_gdrive.php to authorize.');
    }

    $client = new Google\Client();
    $client->setAuthConfig(GDRIVE_OAUTH_CREDENTIALS_PATH);
    $client->addScope(Google\Service\Drive::DRIVE);
    $client->setAccessType('offline');
    $client->setPrompt('consent');

    $accessToken = json_decode(file_get_contents(GDRIVE_TOKEN_PATH), true);
    $client->setAccessToken($accessToken);

    // Auto-refresh if expired
    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            // บันทึก token ใหม่ (พร้อม refresh_token เดิม)
            $newToken = $client->getAccessToken();
            if (empty($newToken['refresh_token']) && !empty($accessToken['refresh_token'])) {
                $newToken['refresh_token'] = $accessToken['refresh_token'];
            }
            file_put_contents(GDRIVE_TOKEN_PATH, json_encode($newToken));
        } else {
            throw new Exception('OAuth token expired and no refresh token. Visit: /v3_1/backend/auth_gdrive.php');
        }
    }

    $_gdrive_client = $client;
    return $client;
}

function getGDriveService()
{
    global $_gdrive_service;
    if ($_gdrive_service !== null) {
        return $_gdrive_service;
    }
    $_gdrive_service = new Google\Service\Drive(getGDriveClient());
    return $_gdrive_service;
}

// ================================================================
//  FOLDER OPERATIONS
// ================================================================
function gdrive_getOrCreateFolder($folderName, $parentId)
{
    global $_gdrive_folder_cache;
    $cacheKey = $parentId . ':' . $folderName;
    if (isset($_gdrive_folder_cache[$cacheKey])) {
        return $_gdrive_folder_cache[$cacheKey];
    }

    $service = getGDriveService();
    $safeName = addslashes($folderName);
    $query = "name = '$safeName' and '$parentId' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    $results = $service->files->listFiles([
        'q' => $query,
        'fields' => 'files(id, name)',
        'pageSize' => 1
    ]);

    if (count($results->getFiles()) > 0) {
        $folderId = $results->getFiles()[0]->getId();
        $_gdrive_folder_cache[$cacheKey] = $folderId;
        return $folderId;
    }

    // สร้างโฟลเดอร์ใหม่
    $folderMeta = new Google\Service\Drive\DriveFile([
        'name' => $folderName,
        'mimeType' => 'application/vnd.google-apps.folder',
        'parents' => [$parentId]
    ]);
    $folder = $service->files->create($folderMeta, ['fields' => 'id']);
    $folderId = $folder->getId();
    $_gdrive_folder_cache[$cacheKey] = $folderId;

    return $folderId;
}

function gdrive_getOrCreateNestedFolders($folderParts)
{
    $currentParentId = GDRIVE_ROOT_FOLDER_ID;
    foreach ($folderParts as $folderName) {
        if (empty($folderName)) continue;
        $currentParentId = gdrive_getOrCreateFolder($folderName, $currentParentId);
    }
    return $currentParentId;
}

// ================================================================
//  UPLOAD / DELETE
// ================================================================

/**
 * อัปโหลดไฟล์ไป Google Drive
 * @param string $localFilePath path ไฟล์ local
 * @param string $fileName ชื่อไฟล์ที่จะเก็บ
 * @param array $folderParts path โฟลเดอร์ เช่น ['ACC', '2025-03', 'EXP-2503-001']
 * @return string gdrive:// URI
 */
function gdrive_uploadFile($localFilePath, $fileName, $folderParts)
{
    $service = getGDriveService();
    $parentId = gdrive_getOrCreateNestedFolders($folderParts);

    $fileMetadata = new Google\Service\Drive\DriveFile([
        'name' => $fileName,
        'parents' => [$parentId]
    ]);

    $mimeType = mime_content_type($localFilePath) ?: 'application/octet-stream';
    $content = file_get_contents($localFilePath);

    $file = $service->files->create($fileMetadata, [
        'data' => $content,
        'mimeType' => $mimeType,
        'uploadType' => 'multipart',
        'fields' => 'id'
    ]);

    return 'gdrive://' . $file->getId();
}

/**
 * ลบไฟล์จาก Google Drive
 * @param string $gdriveFilePath gdrive:// URI
 * @return bool
 */
function gdrive_deleteFile($gdriveFilePath)
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return false;
    }
    $fileId = substr($gdriveFilePath, 9);
    try {
        $service = getGDriveService();
        $service->files->delete($fileId);
        return true;
    } catch (Exception $e) {
        error_log("gdrive_deleteFile error: " . $e->getMessage());
        return false;
    }
}

// ================================================================
//  READ / VIEW / STREAM
// ================================================================

/**
 * สร้าง URL สำหรับดูไฟล์ผ่าน backend proxy
 * @param string $gdriveFilePath gdrive:// URI
 * @param string $module module name (acc, hrm, core) — default: acc
 * @return string URL
 */
function gdrive_getViewUrl($gdriveFilePath, $module = 'acc')
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return $gdriveFilePath;
    }
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    switch ($module) {
        case 'hrm':
            return $protocol . $host . '/v3_1/backend/api/hrm/files/stream?file=' . urlencode($gdriveFilePath);
        case 'core':
            return $protocol . $host . '/v3_1/backend/api/core/profile/avatar/view';
        default:
            return $protocol . $host . '/v3_1/backend/api/acc/?action=download_file&file=' . urlencode($gdriveFilePath);
    }
}

/**
 * Stream ไฟล์จาก Google Drive ไปยัง browser
 * @param string $gdriveFilePath gdrive:// URI
 * @return bool
 */
function gdrive_streamFile($gdriveFilePath)
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return false;
    }
    $fileId = substr($gdriveFilePath, 9);

    try {
        $service = getGDriveService();
        $fileMeta = $service->files->get($fileId, ['fields' => 'name, mimeType, size']);
        $fileName = $fileMeta->getName();
        $mimeType = $fileMeta->getMimeType();

        /** @var \GuzzleHttp\Psr7\Response $response */
        $response = $service->files->get($fileId, ['alt' => 'media']);
        $content = $response->getBody()->getContents();

        header_remove('Content-Type');
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . $fileName . '"');
        header('Content-Length: ' . strlen($content));
        header('Cache-Control: public, max-age=86400');
        echo $content;
        return true;
    } catch (Exception $e) {
        error_log("gdrive_streamFile error: " . $e->getMessage());
        throw $e;
    }
}

/**
 * ตรวจสอบว่า Google Drive พร้อมใช้งานหรือไม่
 * @return array ['ready' => bool, 'message' => string]
 */
function gdrive_checkStatus()
{
    try {
        if (!file_exists(GDRIVE_OAUTH_CREDENTIALS_PATH)) {
            return ['ready' => false, 'message' => 'OAuth credentials not found'];
        }
        if (!file_exists(GDRIVE_TOKEN_PATH)) {
            return ['ready' => false, 'message' => 'Token not found. Visit /v3_1/backend/auth_gdrive.php to authorize.'];
        }
        $client = getGDriveClient();
        return ['ready' => true, 'message' => 'Google Drive connected'];
    } catch (Exception $e) {
        return ['ready' => false, 'message' => $e->getMessage()];
    }
}
