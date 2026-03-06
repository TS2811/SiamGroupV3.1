<?php
ob_start();

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/helpers.php';
$required_slug = 'accounting';
require_once APP_ROOT . '/middleware/authorize.php';

require_once APP_ROOT . '/templates/header.php';

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'];

if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
    $iframe_src = "http://localhost:5000/acc/";
} else {
    $iframe_src = $protocol . $host . '/acc/';
}
?>

<style>
    .content-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
    }
    #react-app-iframe {
        width: 100%;
        height: 92vh;
        border: none;
        display: block;
    }
</style>

<div class="container-fluid content-wrapper">
    <iframe 
        id="react-app-iframe" 
        src="<?= htmlspecialchars($iframe_src, ENT_QUOTES, 'UTF-8') ?>" 
        title="Accounting Application"
        allow="clipboard-read; clipboard-write; geolocation"
    >
        เบราว์เซอร์ของคุณไม่รองรับการใช้งาน iframe
    </iframe>
</div>

<?php
// คืนค่า Footer (ถ้าต้องการ)
// require_once APP_ROOT . '/templates/footer.php';

if (ob_get_level() > 0) {
    ob_end_flush();
}
?>