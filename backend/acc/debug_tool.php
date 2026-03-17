<?php
// Ensure $conn is available
if (!isset($conn) && isset($pdo)) {
    $conn = $pdo;
}

$role_name = '';
$password = '';
$is_programmer = false;
if ($current_user) {
    $uid = (int)$current_user['id'];
    // Assuming 'roles' table exists and users.role_id links to it
    $stmt = $conn->prepare("SELECT r.name, u.password_hash FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
    $stmt->execute([$uid]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $role_name = $row['name'];
        $password = $row['password_hash'];
        if (strcasecmp($role_name, 'Programmer') === 0) {
            $is_programmer = true;
        }
    }
}

// 2. Handle POST requests for this interface
$msg = '';
$show_impersonate_form = false;
$p_name_val = '';
$p_code_val = '';
$p_pass_val = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['debug_action'])) {
    $act = $_POST['debug_action'];

    if ($act === 'check_programmer') {
        $p_name = $_POST['p_name'] ?? '';
        $p_code = $_POST['p_code'] ?? '';
        $p_pass = $_POST['p_password'] ?? '';

        $sql = "SELECT u.id, u.password_hash, r.name as role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE (u.name = :name OR u.id = :id) AND u.employee_code = :code";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':name' => $p_name, ':id' => $p_name, ':code' => $p_code]);
        
        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (password_verify($p_pass, $row['password_hash'])) {
                if (strcasecmp($row['role_name'], 'Programmer') === 0) {
                    // Verified, but DO NOT create session.
                    // Show the impersonation form instead.
                    $show_impersonate_form = true;
                    $p_name_val = $p_name;
                    $p_code_val = $p_code;
                    $p_pass_val = $p_pass;
                    $msg = "Programmer verified. Please enter target user.";
                } else {
                    $msg = "User found but role is '{$row['role_name']}', not 'Programmer'.";
                }
            } else {
                $msg = "Invalid Password.";
            }
        } else {
            $msg = "Invalid Name/ID or Employee Code.";
        }
    } elseif ($act === 'impersonate_with_auth') {
        $p_name = $_POST['p_name'] ?? '';
        $p_code = $_POST['p_code'] ?? '';
        $p_pass = $_POST['p_password'] ?? '';
        $target = $_POST['target_user'] ?? '';

        // Re-verify programmer credentials (stateless check)
        $sql_prog = "SELECT u.id, u.password_hash, r.name as role_name 
                     FROM users u 
                     JOIN roles r ON u.role_id = r.id 
                     WHERE (u.name = :name OR u.id = :id) AND u.employee_code = :code";
        $stmt = $conn->prepare($sql_prog);
        $stmt->execute([':name' => $p_name, ':id' => $p_name, ':code' => $p_code]);
        
        $is_prog_valid = false;
        if ($row_prog = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (password_verify($p_pass, $row_prog['password_hash'])) {
                if (strcasecmp($row_prog['role_name'], 'Programmer') === 0) {
                    $is_prog_valid = true;
                }
            }
        }

        if ($is_prog_valid) {
            // Find target user
            $sql = "SELECT u.*, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = :t1 OR u.name = :t2 OR u.employee_code = :t3 OR r.name = :t4 LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':t1' => $target, ':t2' => $target, ':t3' => $target, ':t4' => $target]);
            
            if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (function_exists('session_regenerate_id')) session_regenerate_id(true);
                $_SESSION['user'] = [
                    'id'        => $user['id'],
                    'name'      => $user['name'],
                    'email'     => $user['email'],
                    'role_id'   => $user['role_id'],
                    'branch_id' => $user['branch_id'] ?? null,
                    'company_id' => $user['company_id'] ?? null,
                    'avatar_path' => $user['avatar_path'],
                    'role_name' => $user['role_name'] ?? null,
                    'is_admin'  => (bool)$user['is_admin'],
                    'user_level' => $user['user_level']
                ];
                header("Location: " . $_SERVER['PHP_SELF']);
                exit;
            } else {
                $msg = "Target user not found.";
                // Keep form open to try again
                $show_impersonate_form = true;
                $p_name_val = $p_name;
                $p_code_val = $p_code;
                $p_pass_val = $p_pass;
            }
        } else {
            $msg = "Authorization failed. Programmer credentials invalid.";
            // Keep form open to try again
            $show_impersonate_form = true;
            $p_name_val = $p_name;
            $p_code_val = $p_code;
        }
    } elseif ($act === 'create_dummy_with_auth') {
        $p_name = $_POST['p_name'] ?? '';
        $p_code = $_POST['p_code'] ?? '';
        $p_pass = $_POST['p_password'] ?? '';

        // Re-verify programmer credentials
        $sql_prog = "SELECT u.id, u.password_hash, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE (u.name = :name OR u.id = :id) AND u.employee_code = :code";
        $stmt = $conn->prepare($sql_prog);
        $stmt->execute([':name' => $p_name, ':id' => $p_name, ':code' => $p_code]);
        
        $is_prog_valid = false;
        if ($row_prog = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (password_verify($p_pass, $row_prog['password_hash']) && strcasecmp($row_prog['role_name'], 'Programmer') === 0) {
                $is_prog_valid = true;
            }
        }

        if ($is_prog_valid) {
            $dummy_role_name = trim($_POST['dummy_role_name'] ?? 'Guest');
            if (empty($dummy_role_name)) {
                $msg = "Role name cannot be empty.";
                $show_impersonate_form = true;
                $p_name_val = $_POST['p_name'];
                $p_code_val = $_POST['p_code'];
                $p_pass_val = $_POST['p_password'];
            } else {
                if (function_exists('session_regenerate_id')) session_regenerate_id(true);
                $_SESSION['user'] = [
                    'id' => -1,
                    'name' => 'Dummy User (' . htmlspecialchars($dummy_role_name) . ')',
                    'email' => 'dummy@example.com',
                    'branch_id' => 0,
                    'company_id' => 0,
                    'role_id' => null,
                    'avatar_path' => 'dummy_user.png',
                    'role_name' => $dummy_role_name,
                    'is_admin' => false,
                    'user_level' => $dummy_role_name
                ];
                header("Location: " . $_SERVER['PHP_SELF']);
                exit;
            }
        } else {
            $msg = "Authorization failed. Programmer credentials invalid.";
        }
    } elseif ($act === 'impersonate' && $is_programmer) {
        $target = $_POST['target_user'] ?? '';
        // Allow ID, Name, or Employee Code
        $sql = "SELECT u.*, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = :t1 OR u.name = :t2 OR u.employee_code = :t3 OR r.name = :t4 LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->execute([':t1' => $target, ':t2' => $target, ':t3' => $target, ':t4' => $target]);
        
        if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (function_exists('session_regenerate_id')) session_regenerate_id(true);
            $_SESSION['user'] = [
                'id'        => $user['id'],
                'name'      => $user['name'],
                'email'     => $user['email'],
                'role_id'   => $user['role_id'],
                'branch_id' => $user['branch_id'] ?? null,
                'company_id' => $user['company_id'] ?? null,
                'avatar_path' => $user['avatar_path'],
                'role_name' => $user['role_name'] ?? null,
                'is_admin'  => (bool)$user['is_admin'],
                'user_level' => $user['user_level']
            ];
            header("Location: " . $_SERVER['PHP_SELF']);
            exit;
        } else {
            $msg = "Target user not found.";
        }
    } elseif ($act === 'create_dummy' && $is_programmer) {
        $dummy_role_name = trim($_POST['dummy_role_name'] ?? 'Guest');
        if (empty($dummy_role_name)) {
            $msg = "Role name cannot be empty.";
        } else {
            if (function_exists('session_regenerate_id')) session_regenerate_id(true);
            $_SESSION['user'] = [
                'id' => -1,
                'name' => 'Dummy User (' . htmlspecialchars($dummy_role_name) . ')',
                'email' => 'dummy@example.com',
                'branch_id' => 0,
                'company_id' => 0,
                'role_id' => null,
                'avatar_path' => 'dummy_user.png',
                'role_name' => $dummy_role_name,
                'is_admin' => false,
                'user_level' => $dummy_role_name
            ];
            header("Location: " . $_SERVER['PHP_SELF']);
            exit;
        }
    } elseif ($act === 'verify_current_password') {
        $check_pass = $_POST['check_pass'] ?? '';
        if (password_verify($check_pass, $password)) {
            $msg = "✅ Password Correct!";
        } else {
            $msg = "❌ Password Incorrect.";
        }
    } elseif ($act === 'logout') {
        session_unset();
        session_destroy();
        header("Location: " . $_SERVER['PHP_SELF']);
        exit;
    }
}

// 3. Render HTML Interface
http_response_code(200);
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Debug / Programmer Access</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
            max-width: 500px;
            margin: 0 auto;
            background: #f9f9f9;
        }

        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        h2 {
            margin-top: 0;
            color: #333;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 10px;
            margin: 8px 0 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        button {
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }

        button:hover {
            background-color: #0056b3;
        }

        .btn-red {
            background-color: #dc3545;
        }

        .btn-red:hover {
            background-color: #c82333;
        }

        .alert {
            padding: 10px;
            background-color: #f8d7da;
            color: #721c24;
            border-radius: 4px;
            margin-bottom: 15px;
        }

        .info {
            margin-bottom: 15px;
            padding: 10px;
            background: #e2e3e5;
            border-radius: 4px;
        }

        label {
            font-weight: bold;
            font-size: 0.9em;
        }
    </style>
</head>

<body>
    <div class="container">
        <h2>API Access Control</h2>
        <?php if ($msg): ?>
            <div class="alert"><?php echo htmlspecialchars($msg); ?></div>
        <?php endif; ?>

        <?php if (!$current_user): ?>
            <?php if (!$show_impersonate_form): ?>
                <p>Please verify Programmer credentials to access debug tools.</p>
                <form method="POST">
                    <input type="hidden" name="debug_action" value="check_programmer">
                    <label>Programmer Code</label>
                    <input type="text" name="p_code" required placeholder="e.g. EMP001" value="<?php echo htmlspecialchars($p_code_val); ?>">
                    <label>Programmer Name / ID</label>
                    <input type="text" name="p_name" required placeholder="e.g. John Doe" value="<?php echo htmlspecialchars($p_name_val); ?>">
                    <label>Password</label>
                    <input type="password" name="p_password" required>
                    <button type="submit">Verify Access</button>
                </form>
            <?php else: ?>
                <div class="info" style="background-color: #d4edda; color: #155724;">
                    <strong>Access Granted:</strong> <?php echo htmlspecialchars($p_name_val); ?>
                </div>
                <p>Create a session for another user:</p>
                <form method="POST">
                    <input type="hidden" name="debug_action" value="impersonate_with_auth">
                    <input type="hidden" name="p_name" value="<?php echo htmlspecialchars($p_name_val); ?>">
                    <input type="hidden" name="p_code" value="<?php echo htmlspecialchars($p_code_val); ?>">
                    <input type="hidden" name="p_password" value="<?php echo htmlspecialchars($p_pass_val); ?>">

                    <label>Target User (Name / ID / Code / Role)</label>
                    <input type="text" name="target_user" required placeholder="Enter ID, Name, Code, or Role Name">
                    <button type="submit">Create Session</button>
                </form>
                <hr>
                <h3>Create Dummy User Session</h3>
                <p>Create a temporary session with a specific role name.</p>
                <form method="POST">
                    <input type="hidden" name="debug_action" value="create_dummy_with_auth">
                    <input type="hidden" name="p_name" value="<?php echo htmlspecialchars($p_name_val); ?>">
                    <input type="hidden" name="p_code" value="<?php echo htmlspecialchars($p_code_val); ?>">
                    <input type="hidden" name="p_password" value="<?php echo htmlspecialchars($p_pass_val); ?>">
                    <label>Role Name</label>
                    <input type="text" name="dummy_role_name" required placeholder="e.g., Manager, การเงิน">
                    <button type="submit">Create Dummy Session</button>
                </form>
            <?php endif; ?>
        <?php else: ?>
            <div class="info">
                <strong>Name:</strong> <?php echo htmlspecialchars($current_user['name']); ?><br>
                <strong>Role:</strong> <?php echo htmlspecialchars($role_name); ?><br>
                <!-- <strong>Password:</strong> <?php //echo htmlspecialchars($password); ?> -->
                <form method="POST" style="margin-top:10px; padding-top:10px; border-top:1px solid #ccc;">
                    <input type="hidden" name="debug_action" value="verify_current_password">
                    <div style="display:flex; gap:5px;">
                        <input type="text" name="check_pass" placeholder="Verify password..." style="margin:0; flex:1;">
                        <button type="submit" style="width:auto; padding:5px 10px;">Check</button>
                    </div>
                </form>
            </div>

            <?php if ($is_programmer): ?>
                <hr>
                <h3>Impersonate User</h3>
                <p>Create a session for another user.</p>
                <form method="POST">
                    <input type="hidden" name="debug_action" value="impersonate">
                    <label>Target User (Name / ID / Code / Role)</label>
                    <input type="text" name="target_user" required placeholder="Enter ID, Name, Code, or Role Name">
                    <button type="submit">Create Session</button>
                </form>
                <hr>
                <h3>Create Dummy User Session</h3>
                <p>Create a temporary session with a specific role name.</p>
                <form method="POST">
                    <input type="hidden" name="debug_action" value="create_dummy">
                    <label>Role Name</label>
                    <input type="text" name="dummy_role_name" required placeholder="e.g., Manager, การเงิน">
                    <button type="submit">Create Dummy Session</button>
                </form>
                <hr>
            <?php endif; ?>

            <form method="POST" style="margin-top: 20px;">
                <input type="hidden" name="debug_action" value="logout">
                <button type="submit" class="btn-red">Clear Session</button>
            </form>
        <?php endif; ?>
    </div>
</body>

</html>
