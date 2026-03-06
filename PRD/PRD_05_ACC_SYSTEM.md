# PRD #05: ระบบบัญชี — ACC (Accounting / Expense Management)

**Project:** SiamGroup V3.1
**Version:** 1.0
**วันที่:** 2026-03-05
**ผู้เขียน:** Product Manager (AI)
**สถานะ:** ✅ สมบูรณ์

> **ระบบ ACC เป็นระบบเดิมที่ใช้งาน Production อยู่แล้ว** — ใน V3.1 จะ Embed ผ่าน iframe โดยไม่แก้ไข code ภายใน + ย้ายส่วนตั้งค่ามารวมที่ระบบตั้งค่าหลัก (PRD #04)

---

## 1. ภาพรวม (Overview)

ระบบ ACC เป็น **ระบบบริหารจัดการค่าใช้จ่าย** (Expense Management System) ที่ใช้งานจริงอยู่แล้ว (Active Production) รองรับหลายบริษัท (Multi-Company) และหลายสาขา (Multi-Branch) โดยมี Workflow การอนุมัติยืดหยุ่น

### 1.1 แนวทาง Integration กับ V3.1

| หัวข้อ             | รายละเอียด                                                      |
| :----------------- | :-------------------------------------------------------------- |
| **แนวทาง**         | Embed ระบบ ACC เดิมผ่าน **iframe** ภายใน V3.1 Layout            |
| **Code ภายใน ACC** | ❌ ไม่แก้ไข — ทำงานเหมือนเดิมทุกอย่าง                           |
| **สิ่งที่ย้าย**    | ส่วนตั้งค่า (Settings) ของ ACC → ย้ายมา PRD #04 ระบบตั้งค่าหลัก |
| **Authentication** | ใช้ authorize middleware ของ V3.1 ตรวจสอบสิทธิ์ก่อนแสดง iframe  |
| **Layout**         | ใช้ V3.1 header/sidebar → iframe แสดง ACC React SPA เต็มพื้นที่ |

---

## 2. วิธี Embed ระบบ ACC (จาก `acc_v3.php`)

### 2.1 Flow การเข้าถึง

```
User Login V3.1 (JWT)
    ↓
กดเมนู "ระบบบัญชี" ใน Sidebar
    ↓
V3.1 Backend: authorize.php → ตรวจสิทธิ์ slug 'accounting'
    ↓
[มีสิทธิ์] → โหลด header.php (Navbar/Sidebar V3.1)
           → แสดง iframe ชี้ไปที่ ACC React SPA
    ↓
[ไม่มีสิทธิ์] → Redirect / แสดง Access Denied
```

### 2.2 โครงสร้างไฟล์

```php
// acc_v3.php — อ้างอิง: ref/acc_v3.php

require_once APP_ROOT . '/helpers.php';
$required_slug = 'accounting';                    // ← slug สำหรับตรวจสิทธิ์
require_once APP_ROOT . '/middleware/authorize.php';
require_once APP_ROOT . '/templates/header.php';  // ← Layout V3.1

// กำหนด iframe URL
if (localhost) → "http://localhost:5000/acc/"
else           → "{protocol}://{host}/acc/"

// แสดง iframe เต็มพื้นที่
<iframe src="{iframe_src}" style="width:100%; height:92vh; border:none;">
```

### 2.3 สิทธิ์เข้าถึง

| เงื่อนไข                                                       | การเข้าถึง                    |
| :------------------------------------------------------------- | :---------------------------- |
| มี record ใน `core_level_permissions` สำหรับ slug `accounting` | ✅ เห็นเมนู + เข้า iframe ได้ |
| Admin Override ผ่าน `core_user_permissions`                    | ✅ เห็นเมนู + เข้า iframe ได้ |
| ไม่มีสิทธิ์                                                    | ❌ ไม่เห็นเมนู                |

> **หมายเหตุ:** สิทธิ์ภายใน ACC (Action-Based, Module Access, User Access) ยังคง **จัดการภายในระบบ ACC เอง** ไม่ย้ายออกมา

---

## 3. ส่วนตั้งค่าที่ย้ายมา PRD #04

> **เฉพาะหน้า Settings ของ ACC** (Route: `/settings`) ที่มี 7 แท็บ — ย้ายการจัดการมารวมที่ระบบตั้งค่าหลัก

### 3.1 ตารางที่เพิ่มใน PRD #04

| แท็บ ACC Settings                 | ตาราง                                                                | Actions ใน PRD #04 |
| :-------------------------------- | :------------------------------------------------------------------- | :----------------- |
| **Financial** (บัญชีธนาคารบริษัท) | `v3_acc_company_accounts`                                            | CRUD               |
| **Payees** (ทะเบียนคู่ค้า)        | `v3_acc_payees` + `v3_acc_payee_banks`                               | CRUD + Import Peak |
| **Expenses** (หมวดหมู่ค่าใช้จ่าย) | `v3_acc_expense_categories` + mapping                                | CRUD               |
| **Approval Rules** (กฎอนุมัติ)    | `v3_acc_approval_rules`                                              | CRUD               |
| **User Access** (สิทธิ์ดูข้อมูล)  | ใช้ `core_user_company_access` + `core_user_branch_access` (PRD #00) | — (มีอยู่แล้ว)     |
| **Role Access** (สิทธิ์ Module)   | ใช้ `core_level_permissions` + `core_app_actions` (PRD #00)          | — (มีอยู่แล้ว)     |
| **Workflow** (ลำดับขั้นตอน)       | `v3_acc_workflow_status`                                             | Read-only          |

### 3.2 รายละเอียดตารางที่ย้ายมา

#### 💳 บัญชีธนาคารบริษัท (`v3_acc_company_accounts`)

| ฟิลด์      | คำอธิบาย                           | บังคับ |
| :--------- | :--------------------------------- | :----- |
| บริษัท     | `company_id` → FK `core_companies` | ✅     |
| ชื่อธนาคาร | `bank_name`                        | ✅     |
| เลขบัญชี   | `account_number`                   | ✅     |
| ชื่อบัญชี  | `account_name`                     | ✅     |
| ชื่อเล่น   | `nickname`                         | ❌     |
| สถานะ      | `is_active`                        | ✅     |

#### 👥 ทะเบียนคู่ค้า (`v3_acc_payees` + `v3_acc_payee_banks`)

| ฟิลด์                   | คำอธิบาย                     | บังคับ |
| :---------------------- | :--------------------------- | :----- |
| ชื่อ                    | `name`                       | ✅     |
| ประเภท                  | `type` (INTERNAL / EXTERNAL) | ✅     |
| เลขผู้เสียภาษี          | `tax_id`                     | ❌     |
| บริษัท                  | `company_id`                 | ✅     |
| บัญชีธนาคาร (sub-table) | `v3_acc_payee_banks`         | ❌     |

**ฟีเจอร์พิเศษ:**

- **Import จาก Peak** — อัปโหลด Excel รูปแบบ Peak → Preview → Confirm
- **Export NO Peak** — ส่งออกคู่ค้าที่ไม่มี Peak ID

#### 📂 หมวดหมู่ค่าใช้จ่าย (`v3_acc_expense_categories`)

| ฟิลด์             | คำอธิบาย                                    | บังคับ      |
| :---------------- | :------------------------------------------ | :---------- |
| GL Code           | `gl_code`                                   | ✅ (Unique) |
| ชื่อ              | `name`                                      | ✅          |
| Mapping ต่อบริษัท | Matrix: GL Code × Company → ชื่อเฉพาะบริษัท | ❌          |

#### ⚖️ กฎอนุมัติ (`v3_acc_approval_rules`)

| ฟิลด์         | คำอธิบาย                                         | บังคับ |
| :------------ | :----------------------------------------------- | :----- |
| Role          | `role_id` → FK `core_roles`                      | ✅     |
| Action        | `action_name` (VIEW, EDIT, SUBMIT, APPROVE, ...) | ✅     |
| บริษัท        | `company_id` (NULL = ทุกบริษัท)                  | ❌     |
| สาขา          | `branch_id` (NULL = ทุกสาขา)                     | ❌     |
| วงเงินขั้นต่ำ | `min_amount`                                     | ❌     |
| วงเงินสูงสุด  | `max_amount`                                     | ❌     |

> **หมายเหตุ:** กฎอนุมัติของ ACC มีความเฉพาะ (วงเงิน, บริษัท, สาขา, Action) จึงยังคงใช้ตาราง `v3_acc_approval_rules` แยกจาก Core Permission

---

## 4. ฟีเจอร์ของระบบ ACC (สรุปจาก `acc_system_summary.md`)

> **ส่วนนี้เป็นการบันทึกฟีเจอร์ที่มีอยู่แล้ว — ไม่มีการเปลี่ยนแปลง**

### 4.1 ประเภทค่าใช้จ่าย

| Type       | คำอธิบาย                    |
| :--------- | :-------------------------- |
| `GENERAL`  | ค่าใช้จ่ายทั่วไป            |
| `PCASH`    | เบิกเงินสดย่อย (Petty Cash) |
| `FCASH`    | จ่ายด่วน (Fast Cash)        |
| `AUTO`     | ค่าใช้จ่ายอัตโนมัติ         |
| `CLAIM`    | เบิกค่าเดินทาง/อื่นๆ        |
| `TRANSFER` | โอนเงินระหว่างบัญชี         |
| `FREFUND`  | คืนเงิน FCASH               |

### 4.2 Workflow ค่าใช้จ่าย

```
DRAFT → SUBMITTED → IN_RUN → CHECKING → APPROVED → PAID
                  ↘ REJECTED
                  ↘ RETURNED → (แก้ไข) → SUBMITTED
       ↘ CANCELLED
```

### 4.3 Workflow รอบจ่าย (Payment Run)

```
สร้าง Group → สร้าง Run → เพิ่ม Expenses →
ENTER → CHECK → CONFIRM → APPROVE → PAID → แนบสลิป → Reconcile
```

### 4.4 หน้าจอหลัก

| หน้า               | หน้าที่                                      |
| :----------------- | :------------------------------------------- |
| EasyFill           | กรอกค่าใช้จ่ายอย่างง่าย (สำหรับ User ทั่วไป) |
| NewExpense         | สร้าง/แก้ไขค่าใช้จ่ายแบบเต็ม (สำหรับบัญชี)   |
| ExpenseDashboard   | จัดการค่าใช้จ่าย (6 แท็บ)                    |
| GroupDashboard     | จัดการกลุ่มรอบจ่าย + Export Excel/PDF/Peak   |
| GroupDetail        | รายละเอียดกลุ่ม + Runs + แนบสลิป             |
| ExpenseDetail      | รายละเอียดเอกสาร + อนุมัติ                   |
| PaymentRunDetail   | รายละเอียดรอบจ่าย                            |
| ExpenseReport      | รายงาน + Export Excel                        |
| BankReconciliation | จับคู่ Bank Statement                        |
| Settings           | ตั้งค่า (ย้ายมา PRD #04)                     |

---

## 5. เมนูใน Sidebar V3.1

```
📊 ระบบบัญชี (ACC)     ← slug: 'accounting'
```

> **เมนูเดียว** — กดแล้วเข้า iframe ที่มี Navigation ภายในของ ACC เอง (Sidebar ของ ACC)

### 5.1 การลงทะเบียนใน `core_app_structure`

| code       | name_th         | type   | parent_id |
| :--------- | :-------------- | :----- | :-------- |
| `ACC`      | ระบบบัญชี       | SYSTEM | NULL      |
| `ACC_MAIN` | ระบบบัญชี (ACC) | PAGE   | → ACC     |

> **สิทธิ์:** ต้องมี record ใน `core_level_permissions` สำหรับ `ACC_MAIN` จึงจะเห็นเมนู

---

## 6. DB Schema

### 6.1 ตาราง ACC ที่มีอยู่แล้ว (ไม่เปลี่ยน)

| ตาราง                       | หน้าที่                   |
| :-------------------------- | :------------------------ |
| `v3_acc_groups`             | กลุ่มรอบจ่าย              |
| `v3_acc_payment_runs`       | รอบจ่ายเงิน               |
| `v3_acc_expense_docs`       | เอกสารค่าใช้จ่าย (Header) |
| `v3_acc_expense_items`      | รายการย่อย (Lines)        |
| `v3_acc_payees`             | ทะเบียนคู่ค้า             |
| `v3_acc_payee_banks`        | บัญชีธนาคารคู่ค้า         |
| `v3_acc_workflow_status`    | สถานะ Master Data         |
| `v3_acc_approval_rules`     | กฎการอนุมัติ              |
| `v3_acc_company_accounts`   | บัญชีธนาคารบริษัท         |
| `v3_acc_expense_categories` | หมวดหมู่ค่าใช้จ่าย        |

### 6.2 ตารางที่เชื่อมกับ Core V3.1

| ตาราง ACC                 | เชื่อมกับ Core   | ผ่าน Column  |
| :------------------------ | :--------------- | :----------- |
| `v3_acc_expense_docs`     | `core_users`     | `created_by` |
| `v3_acc_payees`           | `core_companies` | `company_id` |
| `v3_acc_company_accounts` | `core_companies` | `company_id` |
| `v3_acc_approval_rules`   | `core_roles`     | `role_id`    |
| `v3_acc_approval_rules`   | `core_companies` | `company_id` |
| `v3_acc_approval_rules`   | `core_branches`  | `branch_id`  |

> **หมายเหตุ:** ตาราง ACC จะอ้างอิง Core tables ของ V3.1 โดยตรง

---

## 7. ข้อกำหนดทางเทคนิค

| หัวข้อ              | รายละเอียด                                             |
| :------------------ | :----------------------------------------------------- |
| **Integration**     | iframe embed ภายใน V3.1 Layout                         |
| **Frontend ACC**    | React + Vite + TailwindCSS (ไม่เปลี่ยน)                |
| **Backend ACC**     | PHP Single API file (ไม่เปลี่ยน)                       |
| **Authentication**  | V3.1 authorize middleware ตรวจสอบก่อนแสดง iframe       |
| **Iframe Security** | `allow="clipboard-read; clipboard-write; geolocation"` |
| **Responsive**      | `width: 100%; height: 92vh; border: none;`             |
| **Database**        | ตาราง `v3_acc_*` ใน database เดียวกับ Core V3.1        |

---

## 8. สรุปสิ่งที่ต้องทำ

| #   | งาน                                                                                   | สถานะ |
| :-- | :------------------------------------------------------------------------------------ | :---- |
| 1   | สร้างไฟล์ `acc_v3.php` ใน V3.1                                                        | 🔜    |
| 2   | ลงทะเบียนเมนู ACC ใน `core_app_structure`                                             | 🔜    |
| 3   | กำหนดสิทธิ์ Level ใน `core_level_permissions` สำหรับ slug `accounting`                | 🔜    |
| 4   | ย้ายหน้า Settings ของ ACC มาที่ PRD #04 (ตั้งค่าหลัก)                                 | 🔜    |
| 5   | เชื่อม FK ตาราง ACC กับ Core tables (`core_companies`, `core_roles`, `core_branches`) | 🔜    |

---

## 9. เอกสารอ้างอิง

| เอกสาร                                  | ใช้อ้างอิงในส่วน                    |
| :-------------------------------------- | :---------------------------------- |
| `ref/acc_system_summary.md`             | ฟีเจอร์ระบบ ACC ทั้งหมด (Section 4) |
| `ref/acc_v3.php`                        | วิธี Embed iframe (Section 2)       |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md` | สิทธิ์การเข้าถึง (Section 2.3)      |
| `PRD/PRD_04_SETTINGS_SYSTEM.md`         | ตั้งค่าที่ย้ายมา (Section 3)        |

---

## 10. Open Questions

> ✅ **ไม่มีคำถามค้าง** — PRD ฉบับนี้สมบูรณ์แล้ว
