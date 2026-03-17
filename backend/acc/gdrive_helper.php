<?php

/**
 * gdrive_helper.php
 * Helper functions สำหรับ Google Drive API
 * - Service Account: ใช้สำหรับ อ่าน/ดาวน์โหลด (ไม่มีวันหมดอายุ)
 * - OAuth: ใช้สำหรับ อัปโหลด/ลบ/สร้างโฟลเดอร์ (ต้อง refresh token เป็นระยะ)
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// ===================== Config =====================
define('GDRIVE_SERVICE_ACCOUNT_PATH', __DIR__ . '/config/service_account.json');
define('GDRIVE_OAUTH_CREDENTIALS_PATH', __DIR__ . '/config/oauth_web.json');
define('GDRIVE_TOKEN_PATH', __DIR__ . '/config/gdrive_token.json');
define('GDRIVE_ROOT_FOLDER_ID', '1bBVkoEnkdOr2vfTvr1gbSWOe9_EHMbVk');

// ===================== Singleton =====================
$_gdrive_read_client = null;   // Service Account (อ่าน)
$_gdrive_write_client = null;  // OAuth (เขียน)
$_gdrive_read_service = null;
$_gdrive_write_service = null;
$_gdrive_folder_cache = [];

// ================================================================
//  READ CLIENT — Service Account (ไม่มีวันหมดอายุ)
// ================================================================
function getGDriveReadClient()
{
    global $_gdrive_read_client;
    if ($_gdrive_read_client !== null) {
        return $_gdrive_read_client;
    }

    if (!file_exists(GDRIVE_SERVICE_ACCOUNT_PATH)) {
        throw new Exception('Service Account key not found: config/service_account.json');
    }

    $client = new Google\Client();
    $client->setAuthConfig(GDRIVE_SERVICE_ACCOUNT_PATH);
    $client->addScope(Google\Service\Drive::DRIVE_READONLY);
    $_gdrive_read_client = $client;
    return $client;
}

function getGDriveReadService()
{
    global $_gdrive_read_service;
    if ($_gdrive_read_service !== null) {
        return $_gdrive_read_service;
    }
    $_gdrive_read_service = new Google\Service\Drive(getGDriveReadClient());
    return $_gdrive_read_service;
}

// ================================================================
//  WRITE CLIENT — OAuth (ต้อง refresh token)
// ================================================================
function getGDriveWriteClient()
{
    global $_gdrive_write_client;
    if ($_gdrive_write_client !== null && !$_gdrive_write_client->isAccessTokenExpired()) {
        return $_gdrive_write_client;
    }

    if (!file_exists(GDRIVE_OAUTH_CREDENTIALS_PATH) || !file_exists(GDRIVE_TOKEN_PATH)) {
        throw new Exception('OAuth credentials not found. Run: php refresh_gdrive_token.php');
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
            throw new Exception('OAuth token expired and no refresh token. Run: php refresh_gdrive_token.php');
        }
    }

    $_gdrive_write_client = $client;
    return $client;
}

function getGDriveWriteService()
{
    global $_gdrive_write_service;
    if ($_gdrive_write_service !== null) {
        return $_gdrive_write_service;
    }
    $_gdrive_write_service = new Google\Service\Drive(getGDriveWriteClient());
    return $_gdrive_write_service;
}

// ================================================================
//  LEGACY: getGDriveClient / getGDriveService (backward compatible)
//  → ใช้ Write client เป็นค่าเริ่มต้น (เพราะฟังก์ชันเดิมใช้ทั้งอ่าน+เขียน)
// ================================================================
function getGDriveClient()
{
    try {
        return getGDriveWriteClient();
    } catch (Exception $e) {
        // ถ้า OAuth ใช้ไม่ได้ fallback เป็น Service Account (อ่านได้อย่างเดียว)
        return getGDriveReadClient();
    }
}

function getGDriveService()
{
    try {
        return getGDriveWriteService();
    } catch (Exception $e) {
        return getGDriveReadService();
    }
}

// ================================================================
//  FOLDER OPERATIONS (ใช้ Write client)
// ================================================================
function gdrive_getOrCreateFolder($folderName, $parentId)
{
    global $_gdrive_folder_cache;
    $cacheKey = $parentId . ':' . $folderName;
    if (isset($_gdrive_folder_cache[$cacheKey])) {
        return $_gdrive_folder_cache[$cacheKey];
    }

    $service = getGDriveWriteService();
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
//  UPLOAD / DELETE (ใช้ Write client)
// ================================================================
function gdrive_uploadFile($localFilePath, $fileName, $folderParts)
{
    $service = getGDriveWriteService();
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

function gdrive_deleteFile($gdriveFilePath)
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return false;
    }
    $fileId = substr($gdriveFilePath, 9);
    try {
        $service = getGDriveWriteService();
        $service->files->delete($fileId);
        return true;
    } catch (Exception $e) {
        error_log("gdrive_deleteFile error: " . $e->getMessage());
        return false;
    }
}

// ================================================================
//  READ / VIEW / STREAM (ใช้ Service Account — ไม่มีวันหมดอายุ)
// ================================================================
function gdrive_getViewUrl($gdriveFilePath)
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return $gdriveFilePath;
    }
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $protocol . $host . '/v2/acc/back_end/api.php?action=download_file&file=' . urlencode($gdriveFilePath);
}

function gdrive_streamFile($gdriveFilePath)
{
    if (!str_starts_with($gdriveFilePath, 'gdrive://')) {
        return false;
    }
    $fileId = substr($gdriveFilePath, 9);

    // ลองใช้ OAuth ก่อน (owner account → เห็นทุกไฟล์)
    // ถ้าไม่ได้ fallback ไป Service Account
    $services = [];
    try {
        $services[] = getGDriveWriteService();
    } catch (Exception $e) {
    }
    try {
        $services[] = getGDriveReadService();
    } catch (Exception $e) {
    }

    $lastError = null;
    foreach ($services as $service) {
        try {
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
            $lastError = $e;
            continue; // ลองตัวถัดไป
        }
    }

    if ($lastError) {
        error_log("gdrive_streamFile error: " . $lastError->getMessage());
        throw $lastError;
    }
    return false;
}
