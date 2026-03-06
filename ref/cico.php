<?php
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

$session_user = current_user();
if (!$session_user) {
    redirect('public/login.php');
}

// --- Fetch the full, up-to-date user object from the database ---
$stmt = $pdo->prepare("SELECT id, name, avatar_path, branch_id FROM users WHERE id = :id");
$stmt->execute(['id' => $session_user['id']]);
$user = $stmt->fetch();
if (!$user) {
    die("Error: Could not find user data.");
}

// Fetch user's assigned branch information
$branch_info = null;
if (!empty($user['branch_id'])) {
    $stmt = $pdo->prepare("SELECT code, latitude, longitude, check_radius FROM branches WHERE id = :id");
    $stmt->execute(['id' => $user['branch_id']]);
    $branch_info = $stmt->fetch();
}

// --- Check for an existing open check-in for today ---
$today_log = null;
$stmt = $pdo->prepare("SELECT id, check_in_at FROM cico_logs WHERE user_id = :user_id AND DATE(check_in_at) = CURDATE() AND check_out_at IS NULL ORDER BY id DESC LIMIT 1");
$stmt->execute(['user_id' => $user['id']]);
$today_log = $stmt->fetch();
$is_checked_in = ($today_log !== false);

// --- AJAX Endpoints for Check-in and Check-out ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    $action = $_POST['action'];
    $lat = $_POST['lat'] ?? null;
    $lng = $_POST['lng'] ?? null;

    if ($lat === null || $lng === null) {
        echo json_encode(['success' => false, 'message' => 'Location data is missing.']);
        exit;
    }

    try {
        if ($action === 'check_in') {
            if ($is_checked_in) {
                throw new Exception("You are already checked in for today.");
            }

            // ---------------------------------------------------------
            // START: SILENT AUDIT (Shared Device Detection)
            // ---------------------------------------------------------
            // 1. Capture Network Evidence
            $ip_address = $_SERVER['REMOTE_ADDR'];
            $user_agent = $_SERVER['HTTP_USER_AGENT'];

            // 2. Analyze Risk (The "Sticky Tag" Check)
            $risk_flag = null;
            $prev_user_on_device = isset($_POST['prev_user_on_device']) ? $_POST['prev_user_on_device'] : null;

            // If a tag exists, AND it is NOT the current user => SUSPICIOUS
            if ($prev_user_on_device && $prev_user_on_device != $user['id']) {
                // Determine who the previous user was for the log
                $stmt_spy = $pdo->prepare("SELECT name FROM users WHERE id = ?");
                $stmt_spy->execute([$prev_user_on_device]);
                $prev_name = $stmt_spy->fetchColumn();
                
                $risk_flag = "Shared Device Detected (Previous user: " . ($prev_name ? $prev_name : $prev_user_on_device) . ")";
            }
            // ---------------------------------------------------------

            // Proceed with check-in (Updated INSERT to include evidence)
            // Note: Ensuring we use the columns you added to your DB (ip_address, user_agent, device_risk_flag)
            $stmt = $pdo->prepare("INSERT INTO cico_logs (
                user_id, check_in_at, lat_in, lng_in, branch_code_in, created_at,
                ip_address, user_agent, device_risk_flag
            ) VALUES (
                :user_id, NOW(), :lat, :lng, :branch_code, NOW(),
                :ip, :ua, :flag
            )");
            
            $stmt->execute([
                'user_id' => $user['id'], 
                'lat' => $lat, 
                'lng' => $lng, 
                'branch_code' => $branch_info['code'] ?? null,
                'ip' => $ip_address,
                'ua' => $user_agent,
                'flag' => $risk_flag
            ]);

            echo json_encode([
                'success' => true, 
                'message' => 'บันทึกเข้างานสำเร็จ',
                'current_user_id' => $user['id'] // Return ID to update the "Sticky Tag"
            ]);

        } elseif ($action === 'check_out') {
            if (!$is_checked_in) {
                throw new Exception("You have not checked in yet.");
            }

            // Proceed with check-out
            $stmt = $pdo->prepare("UPDATE cico_logs SET check_out_at = NOW(), lat_out = :lat, lng_out = :lng WHERE id = :log_id");
            $stmt->execute(['lat' => $lat, 'lng' => $lng, 'log_id' => $today_log['id']]);
            echo json_encode(['success' => true, 'message' => 'บันทึกออกงานสำเร็จ']);
        }
    } catch (Exception $e) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

require_once __DIR__ . '/../templates/header.php';
?>

<style>
    body {
        background-color: #f0f2f5;
    }

    .cico-container {
        max-width: 480px;
        margin: auto;
    }

    .cico-card {
        background-color: #ffffff;
        border-radius: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
    }

    .user-header {
        display: flex;
        align-items: center;
        padding: 1rem;
    }

    .user-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }

    .user-avatar-initials {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #e9ecef;
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .user-details {
        margin-left: 1rem;
        flex-grow: 1;
    }

    .user-details .date {
        font-weight: 600;
        font-size: 1.1rem;
    }

    .user-details .name {
        color: #6c757d;
    }

    .branch-tag {
        background-color: #0d6efd;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-weight: 600;
    }

    #map {
        height: 250px;
        background-color: #e9ecef;
    }

    .info-footer {
        padding: 1.5rem;
        text-align: center;
    }

    #actionButton {
        width: 100%;
        padding: 0.8rem;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .location-status {
        font-size: 0.9rem;
        margin-top: 1rem;
    }

    #successPopup {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #28a745;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 1050;
        font-size: 1.1rem;
        display: none;
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    #successPopup.show {
        display: block;
        opacity: 1;
    }
</style>

<div class="cico-container py-4">
    <h3 class="text-center mb-3 fw-bold">ระบบบันทึกเวลา</h3>
    <div class="cico-card">
        <div class="user-header">
            <?php if (!empty($user['avatar_path'])): ?> <img src="../user_avatar/<?php echo htmlspecialchars($user['avatar_path']); ?>" alt="Avatar" class="user-avatar">
            <?php else: ?> <div class="user-avatar-initials"><?php echo strtoupper(mb_substr($user['name'] ?? 'U', 0, 1)); ?></div>
            <?php endif; ?>
            <div class="user-details">
                <div class="date"><?php echo date('d M Y'); ?></div>
                <div class="name"><?php echo htmlspecialchars($user['name'] ?? 'Employee'); ?></div>
            </div>
            <?php if ($branch_info): ?> <div class="branch-tag"><?php echo htmlspecialchars($branch_info['code']); ?></div>
            <?php endif; ?>
        </div>

        <div id="map"></div>

        <div class="info-footer">
            <?php if ($is_checked_in): ?>
                <p class="lead mb-2">เข้างานแล้วเวลา <strong><?php echo date('H:i', strtotime($today_log['check_in_at'])); ?> น.</strong></p>
            <?php else: ?>
                <p class="lead mb-2">บันทึกเข้างานเวลา <strong><?php echo date('H:i'); ?> น.</strong></p>
            <?php endif; ?>
            <p class="text-muted" id="currentLocation">กำลังค้นหาตำแหน่งของคุณ...</p>

            <button id="actionButton" class="btn <?php echo $is_checked_in ? 'btn-danger' : 'btn-primary'; ?> mt-3" disabled>
                <span id="btnSpinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="display: none;"></span>
                <i id="btnIcon" class="bi <?php echo $is_checked_in ? 'bi-box-arrow-right' : 'bi-geo-alt-fill'; ?>"></i>
                <span id="btnText"><?php echo $is_checked_in ? 'บันทึกออกงาน' : 'บันทึกเข้างาน'; ?></span>
            </button>
            <div id="locationStatus" class="location-status text-danger">กรุณาอยู่ในพื้นที่สาขาเพื่อบันทึกเวลา</div>
        </div>
    </div>
</div>

<div id="successPopup"></div>

<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDBDtOpHyH2UezLqznfq833JXRDMP4J08c&libraries=geometry"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const actionButton = document.getElementById('actionButton');
        const locationStatus = document.getElementById('locationStatus');
        const currentLocationEl = document.getElementById('currentLocation');
        const btnText = document.getElementById('btnText');
        const btnIcon = document.getElementById('btnIcon');
        const btnSpinner = document.getElementById('btnSpinner');
        const successPopup = document.getElementById('successPopup');

        const branchLat = <?php echo json_encode($branch_info['latitude'] ?? null); ?>;
        const branchLng = <?php echo json_encode($branch_info['longitude'] ?? null); ?>;
        const checkRadius = <?php echo json_encode($branch_info['check_radius'] ?? 50); ?>;
        const dashboardUrl = '<?php echo BASE_URL . "public/dashboard.php"; ?>';
        const isCheckedIn = <?php echo json_encode($is_checked_in); ?>;

        let userLat = null;
        let userLng = null;

        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371e3;
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        function initMap(lat, lng) {
            const userLocation = {
                lat: lat,
                lng: lng
            };
            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 17,
                center: userLocation,
                disableDefaultUI: true,
            });
            new google.maps.Marker({
                position: userLocation,
                map: map
            });
        }

        if (navigator.geolocation && branchLat !== null && branchLng !== null) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLat = position.coords.latitude;
                    userLng = position.coords.longitude;

                    currentLocationEl.textContent = 'ตรวจสอบตำแหน่งเรียบร้อย';
                    initMap(userLat, userLng);

                    const distance = getDistance(branchLat, branchLng, userLat, userLng);

                    if (distance <= checkRadius) {
                        locationStatus.textContent = `คุณอยู่ในระยะที่กำหนด (${distance.toFixed(0)}m)`;
                        locationStatus.classList.replace('text-danger', 'text-success');
                        actionButton.disabled = false;
                    } else {
                        locationStatus.textContent = `คุณอยู่นอกพื้นที่ (${distance.toFixed(0)}m)`;
                        locationStatus.classList.replace('text-success', 'text-danger');
                        actionButton.disabled = true;
                    }
                },
                () => {
                    locationStatus.textContent = 'ไม่สามารถเข้าถึงตำแหน่งของคุณได้';
                }, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        } else {
            locationStatus.textContent = 'ไม่สามารถใช้งาน Geolocation หรือไม่มีข้อมูลสาขา';
        }

        function showSuccessPopup(message) {
            successPopup.textContent = message;
            successPopup.classList.add('show');
            setTimeout(() => {
                successPopup.classList.remove('show');
                window.location.href = dashboardUrl;
            }, 3000);
        }

        actionButton.addEventListener('click', function() {
            btnIcon.style.display = 'none';
            btnSpinner.style.display = 'inline-block';
            this.disabled = true;
            const action = isCheckedIn ? 'check_out' : 'check_in';
            btnText.textContent = isCheckedIn ? 'กำลังออกงาน...' : 'กำลังเข้างาน...';

            const formData = new FormData();
            formData.append('action', action);
            formData.append('lat', userLat);
            formData.append('lng', userLng);

            // ---------------------------------------------------------
            // START: SEND EVIDENCE (Silent Audit)
            // ---------------------------------------------------------
            // Retrieve the "Sticky Tag" left by the last user
            const lastUser = localStorage.getItem('cico_last_user_id');
            if (lastUser) {
                formData.append('prev_user_on_device', lastUser);
            }
            // ---------------------------------------------------------

            fetch('cico.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // ---------------------------------------------------------
                        // UPDATE: STAMP THIS USER ON THE DEVICE
                        // ---------------------------------------------------------
                        // If server returns current_user_id, save it as the new "Sticky Tag"
                        if (data.current_user_id) {
                            localStorage.setItem('cico_last_user_id', data.current_user_id);
                        }
                        // ---------------------------------------------------------
                        
                        showSuccessPopup(data.message);
                    } else {
                        alert('Error: ' + data.message);
                        btnIcon.style.display = 'inline-block';
                        btnSpinner.style.display = 'none';
                        this.disabled = false;
                        btnText.textContent = isCheckedIn ? 'บันทึกออกงาน' : 'บันทึกเข้างาน';
                    }
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                    alert('A network error occurred. Please try again.');
                    btnIcon.style.display = 'inline-block';
                    btnSpinner.style.display = 'none';
                    this.disabled = false;
                    btnText.textContent = isCheckedIn ? 'บันทึกออกงาน' : 'บันทึกเข้างาน';
                });
        });
    });
</script>

<?php require_once __DIR__ . '/../templates/footer.php'; ?>