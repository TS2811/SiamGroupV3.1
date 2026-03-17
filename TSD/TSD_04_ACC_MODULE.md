# TSD_04: ACC Module (Accounting / Expense Management)

# Technical Specification Document

> **Version:** 1.0
> **Status:** ✅ เสร็จ (Migration Plan)
> **Last Updated:** 2026-03-10
> **PRD Reference:** PRD #05 (ACC System)
> **Dependencies:** TSD_01 (Core Infrastructure)

---

## 1. ขอบเขต (Scope)

### 1.1 แนวทาง: Copy & Integrate (ไม่ Dev ใหม่)

> ⚠️ **ระบบ ACC เดิมพัฒนาเสร็จเรียบร้อย 100%** — ไม่ต้อง Dev ใหม่
> เพียงแค่ก๊อปมาวางใน V3.1 project แล้วแก้ไขจุดเชื่อมต่อ (Integration Points)

| สิ่งที่ทำ                             | สิ่งที่ไม่ทำ             |
| :------------------------------------ | :----------------------- |
| ก๊อป ACC code มาวางใน V3.1            | เขียน Frontend ใหม่      |
| แก้ API_BASE + BASENAME ใน config.js  | เขียน Backend API ใหม่   |
| แก้ Auth — JWT Cookie แทน PHP Session | แก้ไข Business Logic ACC |
| เพิ่มเมนู ACC ใน core_app_structure   | แก้ DB Schema ของ ACC    |
| ใช้ Permission System ของ Core        | เปลี่ยน UI/UX ของ ACC    |

### 1.2 ขนาดระบบ ACC ที่มีอยู่

| ส่วน                    | จำนวน                 | รายละเอียด                                                                       |
| :---------------------- | :-------------------- | :------------------------------------------------------------------------------- |
| **Frontend Pages**      | 24 ไฟล์               | EasyFill, Dashboard, Expense, Approval, PaymentRun, Reconciliation, Settings ฯลฯ |
| **Frontend Components** | 10 ไฟล์               | Layout, Sidebar, AuthContext, ProtectedRoute, AdvancedTable, StatusBadge         |
| **Backend API**         | 1 ไฟล์ (4,042 บรรทัด) | `api.php` — 40+ actions ครบทุกฟีเจอร์                                            |
| **Database Tables**     | 8 ตาราง               | `v3_acc_*` ใน DB `siamgroup_v3` เดียวกับ Core/HRM/Pay                            |

---

## 2. สถาปัตยกรรม Integration

### 2.1 Before vs After

```
[BEFORE — ACC แยกเดี่ยว (V2)]
┌────────────────────────────────────────┐
│ ACC Frontend (Vite @ port 5000)        │
│  └── Layout + Sidebar + 24 pages      │
│       ↕ API_BASE = /v2/acc/back_end/   │
│ ACC Backend (api.php)                  │
│  └── Auth: PHP Session (current_user)  │
│  └── DB: helpers.php + db.php (V2)     │
└────────────────────────────────────────┘

[AFTER — ACC ฝังใน V3.1]
┌──────────────────────────────────────────────────┐
│ V3.1 Frontend (React + MUI)                      │
│  └── MainLayout → AccPage.jsx                    │
│       └── <iframe src="/v3_1/acc/" />             │
│            ↕                                      │
│  ACC Frontend (dist/ served as static)            │
│   └── ลบ Layout/Sidebar → ใช้ content only       │
│   └── config.js → API_BASE = /v3_1/backend/acc/  │
│        ↕                                          │
│ V3.1 Backend → /api/acc/* → acc/api.php           │
│  └── Auth: JWT Cookie (verifyAccessToken)         │
│  └── DB: config.php + helpers.php (V3.1)          │
└──────────────────────────────────────────────────┘
```

### 2.2 สอง Pattern ที่ทำได้

| Pattern                   | วิธี                                                 | ข้อดี                     | ข้อเสีย                                       |
| :------------------------ | :--------------------------------------------------- | :------------------------ | :-------------------------------------------- |
| **A: iframe Embed**       | วาง ACC dist/ เป็น static → embed ใน iframe          | ง่ายที่สุด, แก้น้อย       | iframe styling issues, ต้องจัดการ postMessage |
| **B: Direct Integration** | ก๊อป ACC pages → import เป็น React component ใน V3.1 | UX ดีกว่า, ไม่ต้อง iframe | ต้องแก้ imports, Tailwind → MUI conflict      |

> **เลือก Pattern A (iframe)** — ง่าย เร็ว ไม่เสี่ยง

---

## 3. Database Schema (ไม่เปลี่ยน)

### 3.1 ตาราง ACC ที่มีอยู่แล้ว

| #   | ตาราง                     | คำอธิบาย                                                  | Rows (ประมาณ) |
| :-- | :------------------------ | :-------------------------------------------------------- | :------------ |
| 1   | `v3_acc_expense_docs`     | เอกสารค่าใช้จ่ายหลัก (GENERAL, PCASH, FCASH, AUTO, CLAIM) | หลายพัน       |
| 2   | `v3_acc_expense_items`    | รายการย่อยในเอกสาร (line items)                           | หลายหมื่น     |
| 3   | `v3_acc_payees`           | ผู้รับเงิน (INTERNAL staff / EXTERNAL vendor)             | ~500          |
| 4   | `v3_acc_categories`       | หมวดค่าใช้จ่าย                                            | ~50           |
| 5   | `v3_acc_company_accounts` | บัญชีธนาคารบริษัท                                         | ~20           |
| 6   | `v3_acc_payment_groups`   | กลุ่มรอบจ่ายเงิน                                          | ~100          |
| 7   | `v3_acc_payment_runs`     | รอบจ่ายเงินแต่ละรอบ                                       | ~200          |
| 8   | `v3_acc_approval_rules`   | กฎอนุมัติ (role + action + company)                       | ~30           |

### 3.2 Cross-reference กับ Core

| ตาราง ACC                 | เชื่อมกับ Core                | ผ่าน Column  |
| :------------------------ | :---------------------------- | :----------- |
| `v3_acc_expense_docs`     | `core_users`                  | `created_by` |
| `v3_acc_expense_docs`     | `core_companies`              | `company_id` |
| `v3_acc_expense_docs`     | `core_branches`               | `branch_id`  |
| `v3_acc_payees`           | `core_companies`              | `company_id` |
| `v3_acc_company_accounts` | `core_companies`              | `company_id` |
| `v3_acc_approval_rules`   | `core_roles` (V2 roles table) | `role_id`    |

### 3.3 ตารางเสริม (Permission)

```sql
-- ACC ใช้ตาราง V2 สำหรับ permission ภายใน:
v3_user_company_access  — ใช้ร่วมกับ core_user_company_access
v3_user_branch_access   — ใช้ร่วมกับ core_user_branch_access
v3_system_modules       — รายการ module slugs สำหรับวัด permission
v3_role_module_access   — role × module access mapping
```

---

## 4. ACC Frontend — หน้าที่ใช้งานจริง

> ⚠️ **มี 24 ไฟล์ใน `src/views/`** แต่หน้าที่ใช้จริง (จาก Sidebar + หน้าย่อยที่ navigate ไป) มีดังนี้:

### 4.1 หน้าหลัก (จาก Sidebar — 7 เมนู)

| #   | Sidebar Label     | Route                   | File                     | Permission Slug              | ขนาด      |
| :-- | :---------------- | :---------------------- | :----------------------- | :--------------------------- | :-------- |
| 1   | Easy Fill         | `/`                     | `EasyFill.jsx`           | `acc_view_easy_fill`         | 46KB      |
| 2   | สร้างรายการ       | `/new-expense`          | `NewExpense.jsx`         | `acc_expense_create`         | **143KB** |
| 3   | Expense Report    | `/expense-report`       | `ExpenseReport.jsx`      | `acc_view_expense_report`    | 22KB      |
| 4   | Expense Dashboard | `/expense-dashboard`    | `ExpenseDashboard.jsx`   | `acc_view_expense_dashboard` | 60KB      |
| 5   | Group Dashboard   | `/group-dashboard`      | `GroupDashboard.jsx`     | `acc_view_group_dashboard`   | **104KB** |
| 6   | อนุมัติรอบจ่าย    | `/payment-run-approval` | `PaymentRunApproval.jsx` | `acc_payment_run_approval`   | 48KB      |
| 7   | ตั้งค่า           | `/settings`             | `Settings.jsx`           | `acc_settings`               | **120KB** |

### 4.2 หน้าย่อย (navigate จากหน้าหลัก)

| #   | Route               | File                     | เข้าจาก                              | ขนาด     |
| :-- | :------------------ | :----------------------- | :----------------------------------- | :------- |
| 8   | `/expense/:id`      | `ExpenseDetail.jsx`      | ExpenseDashboard, PaymentRunApproval | 47KB     |
| 9   | `/edit-expense/:id` | `NewExpense.jsx` (reuse) | ExpenseDetail                        | —        |
| 10  | `/group-detail/:id` | `GroupDetail.jsx`        | GroupDashboard                       | **85KB** |
| 11  | `/payment-run/:id`  | `PaymentRunDetail.jsx`   | PaymentRunApproval                   | 22KB     |
| 12  | `/image-viewer`     | `ImageViewer.jsx`        | (standalone popup)                   | 6KB      |

### 4.3 Navigation Map

```
Sidebar เมนู                  → หน้าย่อย (navigate)
─────────────────────────────────────────────────────
EasyFill                      → (ย้อนกลับ navigate(-1))
NewExpense / edit-expense/:id  → (form สร้าง/แก้ไข)
ExpenseReport                 → (standalone)
ExpenseDashboard              → /new-expense
                              → /expense/:id (ExpenseDetail)
GroupDashboard                → /group-detail/:id (GroupDetail)
                              → /expense-dashboard
PaymentRunApproval            → /expense/:id (ดู popup)
                              → /payment-run/:id (PaymentRunDetail)
Settings                      → (standalone)
ImageViewer                   → (standalone popup window)
```

### 4.4 หน้าที่ Comment Out (ไม่ใช้ปัจจุบัน)

> Sidebar มี comment out เมนูเหล่านี้ — อาจเปิดใช้ในอนาคต:

| Route                     | File                        | Purpose                                      |
| :------------------------ | :-------------------------- | :------------------------------------------- |
| `/fcash-information`      | `FCashInformation.jsx`      | ข้อมูล Fast Cash                             |
| `/fcash-refund`           | `FCashRefund.jsx`           | คืนเงิน FCASH                                |
| `/fcash-approval`         | `FCashApproval.jsx`         | อนุมัติ FCASH                                |
| `/clearing`               | `Clearing.jsx`              | เคลียร์ใบกำกับ                               |
| `/reconciliation`         | `BankReconciliation.jsx`    | กระทบยอดธนาคาร                               |
| `/reconciliation-history` | `ReconciliationHistory.jsx` | ประวัติกระทบยอด                              |
| `/paid-history`           | `PaidHistory.jsx`           | ประวัติจ่ายเงิน                              |
| `/dashboard`              | `Dashboard.jsx`             | Dashboard เดิม (แทนที่ด้วย EasyFill)         |
| `/approval`               | `ApprovalUnified.jsx`       | อนุมัติรวม (เปลี่ยนไปใช้ PaymentRunApproval) |

### 4.5 Components

| Component            | คำอธิบาย                                  | ต้องแก้?                                           |
| :------------------- | :---------------------------------------- | :------------------------------------------------- |
| `Layout.jsx`         | Sidebar + Outlet                          | ✅ **ต้องแก้:** ซ่อน Sidebar เมื่อ embed ใน iframe |
| `Sidebar.jsx`        | เมนู 7 items + dividers                   | ✅ **ต้องซ่อน** เมื่อ embed                        |
| `AuthContext.jsx`    | Auth state (user, authLoading)            | ✅ **ต้องแก้:** JWT แทน Session                    |
| `ProtectedRoute.jsx` | Permission guard (check user.permissions) | ❌ ใช้ได้เลย                                       |
| `AdvancedTable.jsx`  | ตาราง sort/filter/pagination              | ❌ ไม่ต้องแก้                                      |
| `StatusBadge.jsx`    | Badge สถานะ                               | ❌ ไม่ต้องแก้                                      |
| `StatCard.jsx`       | Card ตัวเลข                               | ❌ ไม่ต้องแก้                                      |
| `ActionsBottom.jsx`  | Bottom actions bar                        | ❌ ไม่ต้องแก้                                      |
| `Modal.jsx`          | Dialog                                    | ❌ ไม่ต้องแก้                                      |

---

## 5. ACC Backend API — 40+ Actions (มีอยู่แล้ว)

### 5.1 API Actions ทั้งหมด

> API Base: `{host}/acc/back_end/api.php?action=`

| Group          | Action                          | Method | คำอธิบาย                                         |
| :------------- | :------------------------------ | :----- | :----------------------------------------------- |
| **Auth**       | `get_current_user`              | GET    | ข้อมูล user + permissions + action_permissions   |
| **Expense**    | `get_expenses`                  | GET    | รายการค่าใช้จ่าย (filter: status, company, type) |
|                | `create_expense`                | POST   | สร้างค่าใช้จ่ายใหม่                              |
|                | `update_expense`                | POST   | แก้ไขค่าใช้จ่าย                                  |
|                | `get_expense_detail`            | GET    | รายละเอียด 1 เอกสาร                              |
|                | `get_expenses_by_ref`           | GET    | ค้นจาก reference number                          |
|                | `check_duplicate_item`          | GET    | ตรวจ item ซ้ำ                                    |
| **Dashboard**  | `get_dashboard_data`            | GET    | สรุปสถานะทั้งหมด (expenses, runs, clearing)      |
|                | `get_dashboard_summary`         | GET    | สรุปเฉพาะ SUBMITTED/CORRECT/PAID                 |
| **Approval**   | `process_approval`              | POST   | อนุมัติ/ปฏิเสธค่าใช้จ่าย                         |
|                | `get_approval_rules`            | GET    | กฎอนุมัติ                                        |
|                | `update_approval_rule`          | POST   | แก้ไขกฎอนุมัติ                                   |
| **Payment**    | `get_confirmed_expenses`        | GET    | ค่าใช้จ่ายที่ confirmed แล้ว (พร้อมจ่าย)         |
|                | `create_payment_run`            | POST   | สร้างรอบจ่าย                                     |
|                | `get_payment_runs`              | GET    | รายการรอบจ่าย                                    |
|                | `get_payment_run_detail`        | GET    | รายละเอียดรอบจ่าย                                |
|                | `get_payment_run_for_export`    | GET    | ข้อมูล Export (Excel/Bank)                       |
|                | `process_payment_run_approval`  | POST   | อนุมัติรอบจ่าย                                   |
|                | `get_paid_runs`                 | GET    | รอบจ่ายที่จ่ายแล้ว                               |
|                | `update_items_for_export`       | POST   | อัปเดต mark items สำหรับ export                  |
|                | `mark_run_to_peak`              | POST   | ส่ง Peak (บัญชี)                                 |
| **Petty Cash** | `create_pcash_request`          | POST   | ขอเบิกเงินสดย่อย                                 |
| **Fast Cash**  | `get_fcash_items_for_refund`    | GET    | รายการ FCash รอคืน                               |
|                | `create_fcash_refund`           | POST   | สร้างรายการคืนเงิน FCash                         |
| **Settings**   | `get_setup_data`                | GET    | ข้อมูลตั้งค่าทั้งหมด                             |
|                | `update_company_account`        | POST   | แก้ไขบัญชีธนาคาร                                 |
|                | `update_payee`                  | POST   | แก้ไขผู้รับเงิน                                  |
|                | `search_payees`                 | GET    | ค้นหาผู้รับเงิน                                  |
|                | `get_payee_banks`               | GET    | บัญชีธนาคารผู้รับ                                |
|                | `update_payee_bank`             | POST   | แก้ไขบัญชีธนาคารผู้รับ                           |
|                | `delete_payee_bank`             | POST   | ลบบัญชีธนาคารผู้รับ                              |
|                | `set_default_payee_bank`        | POST   | ตั้งค่า default บัญชี                            |
|                | `update_expense_mapping`        | POST   | แก้ Expense mapping (Peak)                       |
|                | `update_expense_mapping_name`   | POST   | แก้ชื่อ mapping                                  |
|                | `update_expense_category`       | POST   | แก้หมวดค่าใช้จ่าย                                |
|                | `delete_setting`                | POST   | ลบ setting                                       |
|                | `import_payees_from_peak`       | POST   | Import payees จาก Peak                           |
| **Workflow**   | `update_workflow_sequence`      | POST   | แก้ลำดับ workflow                                |
|                | `update_workflow_step`          | POST   | แก้ขั้นตอน workflow                              |
| **Access**     | `get_user_access_settings`      | GET    | ตั้งค่า access                                   |
|                | `update_user_access`            | POST   | แก้ไข user access                                |
|                | `get_module_access_data`        | GET    | ข้อมูล module access                             |
|                | `update_module_access`          | POST   | แก้ไข module access                              |
| **Clearing**   | `get_uncleared_expenses`        | GET    | ค่าใช้จ่ายที่ยังไม่ clear                        |
|                | `clear_invoice`                 | POST   | เคลียร์ invoice                                  |
| **Bank Recon** | `import_bank_statement`         | POST   | Import bank statement (CSV)                      |
|                | `get_bank_statements`           | GET    | ดู bank statements                               |
|                | `get_unreconciled_payment_runs` | GET    | รอบจ่ายที่ยังไม่กระทบยอด                         |
|                | `reconcile_runs`                | POST   | กระทบยอด                                         |
|                | `unreconcile_run`               | POST   | ยกเลิกกระทบยอด                                   |
|                | `update_statement_note`         | POST   | แก้ note                                         |
|                | `get_reconciliation_history`    | GET    | ประวัติกระทบยอด                                  |

---

## 6. Integration Plan (ขั้นตอนก๊อปมาแก้)

### 6.1 File Structure เป้าหมาย

```
c:\xampp\htdocs\v3_1\
├── backend/
│   ├── acc/                        ← 🆕 ก๊อป acc_old/api.php มาแก้
│   │   ├── index.php               ← ACC Router (wrap api.php)
│   │   └── api.php                 ← ก๊อปจาก ref/acc/acc_old/api.php
│   │
│   └── .htaccess                   ← เพิ่ม rule: /api/acc/* → acc/index.php
│
├── acc/                            ← 🆕 ก๊อป dist/ ของ ACC
│   ├── index.html
│   └── assets/
│       ├── index-xxxxx.js
│       └── index-xxxxx.css
│
└── frontend/
    └── src/
        └── views/
            └── AccPage.jsx         ← 🆕 iframe wrapper page
```

### 6.2 Step-by-Step Migration

#### Step 1: ก๊อป ACC Backend

```
Action: ก๊อป ref/acc/acc_old/api.php → backend/acc/api.php
แก้ไข:
  - บรรทัด 29: require_once __DIR__ . '/../../helpers.php'
    → require_once __DIR__ . '/../config/helpers.php'
  - บรรทัด 33: require_once __DIR__ . '/../../db.php'
    → require_once __DIR__ . '/../config/config.php'
    → $conn = $pdo; (ใช้ $pdo จาก config.php)
  - บรรทัด 36: $current_user = current_user()
    → $current_user = getAccUserFromJWT()
    → (ฟังก์ชันใหม่ที่ decode JWT จาก Cookie แล้วคืน user data)
```

#### Step 2: สร้าง ACC Router

```php
// backend/acc/index.php
<?php
// Load V3.1 Config
require_once __DIR__ . '/../config/config.php';

// Convert JWT User to ACC-compatible format
function getAccUserFromJWT() {
    $decoded = verifyAccessToken(); // จาก helpers.php
    if (!$decoded) return null;

    global $pdo;
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.first_name_th, u.last_name_th,
               u.is_admin, u.avatar_path,
               e.company_id, e.branch_id, e.level_id,
               r.name as role_name, r.id as role_id
        FROM core_users u
        LEFT JOIN hrm_employees e ON u.id = e.user_id
        LEFT JOIN core_levels l ON e.level_id = l.id
        LEFT JOIN core_roles r ON l.role_id = r.id
        WHERE u.id = ?
    ");
    $stmt->execute([$decoded->sub]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Override current_user() for ACC compatibility
function current_user() {
    return getAccUserFromJWT();
}

// Include ACC API
require __DIR__ . '/api.php';
```

#### Step 3: ก๊อป ACC Frontend (dist/)

```
Action: ก๊อป ref/acc/dist/ → v3_1/acc/
แก้ไข index.html:
  - base href → /v3_1/acc/
```

#### Step 4: แก้ ACC config.js (before build)

```javascript
// ถ้าต้อง rebuild:
API_BASE = "/v3_1/backend/api/acc/api.php?action=";
BASENAME = "/v3_1/acc";
```

#### Step 5: สร้าง AccPage.jsx ใน V3.1

```jsx
// frontend/src/views/AccPage.jsx
import React from "react";
import { Box } from "@mui/material";

export default function AccPage() {
  const getAccUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "/v3_1/acc/";
    }
    return `${window.location.origin}/v3_1/acc/`;
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)", // ลบ AppBar height
        overflow: "hidden",
      }}
    >
      <iframe
        src={getAccUrl()}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="ACC Module"
      />
    </Box>
  );
}
```

#### Step 6: เพิ่มเมนู ACC + Permission

```sql
-- core_app_structure
INSERT INTO core_app_structure (name, slug, icon, type, module, parent_id, sort_order, is_active)
VALUES ('บัญชี', 'ACC_MAIN', 'AccountBalance', 'MODULE', 'ACC', NULL, 40, 1);

INSERT INTO core_app_structure (name, slug, icon, type, module, parent_id, sort_order, is_active)
VALUES ('ระบบบัญชี', 'ACC_PAGE', 'Receipt', 'PAGE', 'ACC',
  (SELECT id FROM core_app_structure WHERE slug = 'ACC_MAIN'), 1, 1);

-- core_level_permissions (ให้ Level 1-4 เห็นเมนู ACC)
INSERT INTO core_level_permissions (level_id, app_structure_id)
SELECT l.id, a.id
FROM core_levels l
CROSS JOIN core_app_structure a
WHERE l.score <= 4
AND a.slug IN ('ACC_MAIN', 'ACC_PAGE');
```

#### Step 7: เพิ่ม Route ใน App.jsx

```jsx
// ใน App.jsx — เพิ่ม route
import AccPage from './views/AccPage';

// ใน routes:
{ path: '/acc', element: <AccPage /> }
```

#### Step 8: เพิ่ม .htaccess rule

```apache
# เพิ่มใน backend/.htaccess
RewriteRule ^api/acc/(.*)$ acc/$1 [L,QSA]
```

---

## 7. Auth Integration Detail

### 7.1 ปัญหา: ACC ใช้ Session, V3.1 ใช้ JWT

```
ACC เดิม:
  session_start()
  current_user() → $_SESSION['user'] → user data

V3.1:
  JWT in HttpOnly Cookie
  verifyAccessToken() → decoded JWT → user_id
```

### 7.2 วิธีแก้: Bridge Function

```php
// backend/acc/index.php จะ define current_user()
// ที่ decode JWT แล้วคืนข้อมูล user ในรูปแบบเดียวกับ ACC เดิม

function current_user() {
    // 1. ลอง JWT ก่อน (V3.1)
    $decoded = verifyAccessToken();
    if ($decoded) {
        // Query user data + return ในรูปแบบ ACC
        return getAccUserFromJWT();
    }

    // 2. Fallback: Session (สำหรับ standalone testing)
    if (isset($_SESSION['user'])) {
        return $_SESSION['user'];
    }

    return null;
}
```

### 7.3 User Data Format (ACC expects)

```json
{
  "id": 1,
  "username": "admin",
  "first_name_th": "สมชาย",
  "last_name_th": "ใจดี",
  "company_id": 1,
  "branch_id": 1,
  "role_id": 1,
  "role_name": "Admin",
  "is_admin": 1,
  "avatar_path": "admin.jpg",
  "permissions": ["acc_approval_unified", "acc_settings", ...],
  "action_permissions": ["approve_expense", ...]
}
```

---

## 8. ACC Internal Permission System

### 8.1 Module Permissions (page-level)

| Permission Slug              | หน้าที่ควบคุม            |
| :--------------------------- | :----------------------- |
| `acc_view_easy_fill`         | EasyFill (หน้าแรก)       |
| `acc_expense_create`         | สร้างค่าใช้จ่าย          |
| `acc_approval_unified`       | อนุมัติค่าใช้จ่าย        |
| `acc_approval_tab_draft`     | แท็บ Draft (ใน Approval) |
| `acc_payment_run_create`     | สร้างรอบจ่าย             |
| `acc_payment_run_approval`   | อนุมัติรอบจ่าย           |
| `acc_paid_history`           | ประวัติจ่ายเงิน          |
| `acc_fcash_refund`           | คืนเงิน Fast Cash        |
| `acc_fcash_approval`         | อนุมัติ Fast Cash        |
| `acc_clearing`               | เคลียร์ Invoice          |
| `acc_reconciliation`         | กระทบยอดธนาคาร           |
| `acc_reconciliation_history` | ประวัติกระทบยอด          |
| `acc_settings`               | ตั้งค่า ACC              |

### 8.2 Action Permissions (button-level)

> กำหนดผ่าน `v3_acc_approval_rules` table

### 8.3 Company/Branch Visibility

```php
// ACC ใช้ฟังก์ชัน get_user_access_ids()
// อ่านจาก: v3_user_company_access + v3_user_branch_access
// Logic เดียวกับ Core (getVisibleCompanies/Branches)
// Admin/Programmer → เห็นทุกบริษัท
// company_id = 0 → เห็นทุกบริษัท
// ไม่มี rules → fallback ใช้ company_id จาก user profile
```

---

## 9. Business Logic สำคัญ (มีอยู่แล้ว)

### 9.1 Expense Types

```
GENERAL  = ค่าใช้จ่ายทั่วไป
PCASH    = เงินสดย่อย (Petty Cash)
FCASH    = จ่ายด่วน (Fast Cash)
AUTO     = ค่าใช้จ่ายอัตโนมัติ (ค่าเช่ารายเดือน etc.)
CLAIM    = เบิกค่าเดินทาง/อื่นๆ
```

### 9.2 Expense Status Flow

```
DRAFT → SUBMITTED → CHECKED → CONFIRMED → PAID
                  ↗                ↘
              CORRECT            AWAITING_INVOICE → CLEARED
                  ↘
               REJECTED
```

### 9.3 Payment Run Flow

```
สร้างรอบจ่าย (select confirmed expenses)
→ รอ Approval
→ APPROVED → Export Bank File / Peak
→ PAID
→ RECONCILED (กระทบยอด Bank Statement)
```

---

## 10. Execution Checklist

| #       | งาน                                        | เวลา         | สถานะ |
| :------ | :----------------------------------------- | :----------- | :---- |
| 1       | ก๊อป `api.php` → `backend/acc/api.php`     | 10 นาที      | ⬜    |
| 2       | สร้าง `backend/acc/index.php` (JWT Bridge) | 30 นาที      | ⬜    |
| 3       | แก้ `api.php` — เปลี่ยน require paths      | 10 นาที      | ⬜    |
| 4       | ก๊อป `dist/` → `v3_1/acc/`                 | 5 นาที       | ⬜    |
| 5       | แก้ `acc/index.html` — base href           | 5 นาที       | ⬜    |
| 6       | สร้าง `AccPage.jsx` (iframe)               | 15 นาที      | ⬜    |
| 7       | เพิ่ม route ใน `App.jsx`                   | 5 นาที       | ⬜    |
| 8       | เพิ่ม `.htaccess` rule                     | 5 นาที       | ⬜    |
| 9       | INSERT เมนู + permission SQL               | 10 นาที      | ⬜    |
| 10      | ทดสอบ Login → เห็นเมนู ACC                 | 15 นาที      | ⬜    |
| 11      | ทดสอบ iframe load + API call               | 15 นาที      | ⬜    |
| 12      | ทดสอบ Company Visibility                   | 15 นาที      | ⬜    |
| **รวม** |                                            | **~2.5 ชม.** |       |

---

## 11. Open Questions (Resolved)

| #    | คำถาม                           | คำตอบ                                                                         |
| :--- | :------------------------------ | :---------------------------------------------------------------------------- |
| OQ-1 | iframe หรือ Direct Integration? | ✅ iframe — ง่ายกว่า                                                          |
| OQ-2 | ACC Auth — JWT หรือ Session?    | ✅ JWT Bridge — `current_user()` ที่ decode JWT แล้วคืนข้อมูลเดียวกับ Session |
| OQ-3 | ACC Settings ย้ายไหม?           | ❌ ยังไม่ย้าย — ใช้ Settings ใน ACC เดิมก่อน                                  |
| OQ-4 | ACC Config.js แก้อะไร?          | ✅ API_BASE + BASENAME ชี้มาที่ V3.1 backend                                  |
| OQ-5 | ACC Sidebar ซ่อนไหม?            | ⏳ ขึ้นกับ UX — ถ้า embed ใน iframe อาจต้องซ่อน                               |

---

## 12. Dependencies

| ใช้จาก TSD_01              | สิ่งที่ใช้          |
| :------------------------- | :------------------ |
| `verifyAccessToken()`      | Decode JWT Cookie   |
| `$pdo` (config.php)        | Database connection |
| `core_app_structure`       | เมนู ACC            |
| `core_level_permissions`   | ใครเห็นเมนู ACC     |
| `core_user_company_access` | Company filtering   |
| `core_user_branch_access`  | Branch filtering    |
