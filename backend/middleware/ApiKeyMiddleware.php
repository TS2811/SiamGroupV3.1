<?php

/**
 * SiamGroup V3.1 — API Key Middleware
 * 
 * ตรวจสอบ X-API-Key Header ทุก Request
 */

function verifyApiKey(): void
{
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    $expectedKey = env('API_SECRET_KEY', '');

    if (empty($expectedKey)) {
        jsonError('API Key not configured', 'CONFIG_ERROR', 500);
    }

    if ($apiKey !== $expectedKey) {
        jsonError('Invalid API Key', 'UNAUTHORIZED', 401);
    }
}
