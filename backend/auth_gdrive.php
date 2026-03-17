<?php

/**
 * auth_gdrive.php — V3.1 Google Drive OAuth Authorization
 * 
 * เข้า URL: http://localhost/v3_1/backend/auth_gdrive.php
 * ระบบจะ redirect ไป Google เพื่อ authorize
 * หลัง authorize แล้วจะ redirect กลับมาพร้อม code
 * ระบบจะแลก code เป็น token แล้วบันทึกไว้
 */

require_once __DIR__ . '/vendor/autoload.php';

$configDir = __DIR__ . '/config/gdrive';
$credentialsPath = $configDir . '/oauth_web.json';
$tokenPath = $configDir . '/gdrive_token.json';

if (!file_exists($credentialsPath)) {
    die("❌ OAuth credentials not found at: $credentialsPath\nPlease download from Google Cloud Console.");
}

$client = new Google\Client();
$client->setAuthConfig($credentialsPath);
$client->addScope(Google\Service\Drive::DRIVE);
$client->setAccessType('offline');
$client->setPrompt('consent');
$client->setRedirectUri('http://localhost/v3_1/backend/auth_gdrive.php');

// Step 2: ถ้ามี ?code → แลก token
if (isset($_GET['code'])) {
    $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);

    if (isset($token['error'])) {
        echo "<h2>❌ Error</h2><pre>" . print_r($token, true) . "</pre>";
        exit;
    }

    file_put_contents($tokenPath, json_encode($token));

    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Google Drive - Authorized</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:50px auto;padding:20px;}
    .success{background:#d4edda;border:1px solid #c3e6cb;padding:20px;border-radius:8px;color:#155724;}
    .info{background:#d1ecf1;border:1px solid #bee5eb;padding:15px;border-radius:8px;color:#0c5460;margin-top:15px;}
    code{background:#f8f9fa;padding:2px 6px;border-radius:3px;}</style></head><body>";
    echo "<div class='success'><h2>✅ Google Drive Authorization Successful!</h2>";
    echo "<p>Token saved to: <code>config/gdrive/gdrive_token.json</code></p></div>";
    echo "<div class='info'><h3>Token Details:</h3>";
    echo "<p>Access Token: <code>" . substr($token['access_token'], 0, 20) . "...</code></p>";
    echo "<p>Refresh Token: <code>" . (isset($token['refresh_token']) ? substr($token['refresh_token'], 0, 20) . '...' : 'N/A') . "</code></p>";
    echo "<p>Expires In: <code>" . ($token['expires_in'] ?? 'N/A') . " seconds</code></p>";
    echo "</div>";

    // Test connection
    try {
        $client->setAccessToken($token);
        $service = new Google\Service\Drive($client);
        $about = $service->about->get(['fields' => 'user']);
        echo "<div class='info'><h3>Connected Account:</h3>";
        echo "<p>Email: <code>" . $about->getUser()->getEmailAddress() . "</code></p>";
        echo "<p>Name: <code>" . $about->getUser()->getDisplayName() . "</code></p>";
        echo "</div>";
    } catch (Exception $e) {
        echo "<p>⚠️ Test failed: " . $e->getMessage() . "</p>";
    }

    echo "<p style='margin-top:20px'><a href='/v3_1/backend/auth_gdrive.php?check=1'>🔍 Check Status</a></p>";
    echo "</body></html>";
    exit;
}

// Step 3: ถ้ามี ?check → ตรวจสอบ status
if (isset($_GET['check'])) {
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Google Drive Status</title>
    <style>body{font-family:sans-serif;max-width:600px;margin:50px auto;padding:20px;}
    .ok{color:#155724;background:#d4edda;padding:15px;border-radius:8px;border:1px solid #c3e6cb;}
    .err{color:#721c24;background:#f8d7da;padding:15px;border-radius:8px;border:1px solid #f5c6cb;}
    code{background:#f8f9fa;padding:2px 6px;border-radius:3px;}</style></head><body>";
    echo "<h2>🔍 Google Drive Status Check</h2>";

    if (!file_exists($tokenPath)) {
        echo "<div class='err'>❌ Token not found. <a href='/v3_1/backend/auth_gdrive.php'>Click here to authorize</a></div>";
    } else {
        try {
            $token = json_decode(file_get_contents($tokenPath), true);
            $client->setAccessToken($token);

            if ($client->isAccessTokenExpired()) {
                if ($client->getRefreshToken()) {
                    $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
                    $newToken = $client->getAccessToken();
                    if (empty($newToken['refresh_token']) && !empty($token['refresh_token'])) {
                        $newToken['refresh_token'] = $token['refresh_token'];
                    }
                    file_put_contents($tokenPath, json_encode($newToken));
                    echo "<div class='ok'>✅ Token refreshed successfully</div>";
                } else {
                    echo "<div class='err'>❌ Token expired, no refresh token. <a href='/v3_1/backend/auth_gdrive.php'>Re-authorize</a></div>";
                }
            } else {
                echo "<div class='ok'>✅ Token is valid</div>";
            }

            $service = new Google\Service\Drive($client);
            $about = $service->about->get(['fields' => 'user, storageQuota']);
            echo "<div class='ok' style='margin-top:10px'>";
            echo "<p><strong>Account:</strong> " . $about->getUser()->getEmailAddress() . "</p>";
            $quota = $about->getStorageQuota();
            if ($quota) {
                $used = round($quota->getUsage() / 1073741824, 2);
                $limit = $quota->getLimit() ? round($quota->getLimit() / 1073741824, 2) : '∞';
                echo "<p><strong>Storage:</strong> {$used} GB / {$limit} GB</p>";
            }
            echo "</div>";

            // Test root folder access
            try {
                $rootFolder = $service->files->get('1D4RXpv9zSG2dkvYgCf_P6KzwkhRMKh9k', ['fields' => 'id, name']);
                echo "<div class='ok' style='margin-top:10px'>";
                echo "<p><strong>Root Folder:</strong> " . $rootFolder->getName() . " ✅</p>";
                echo "</div>";
            } catch (Exception $e) {
                echo "<div class='err' style='margin-top:10px'>⚠️ Cannot access root folder: " . $e->getMessage() . "</div>";
            }
        } catch (Exception $e) {
            echo "<div class='err'>❌ Error: " . $e->getMessage() . "</div>";
        }
    }
    echo "<p style='margin-top:20px'><a href='/v3_1/backend/auth_gdrive.php'>🔄 Re-authorize</a></p>";
    echo "</body></html>";
    exit;
}

// Step 1: ถ้ายังไม่มี code → redirect ไป Google
$authUrl = $client->createAuthUrl();
header('Location: ' . filter_var($authUrl, FILTER_SANITIZE_URL));
exit;
