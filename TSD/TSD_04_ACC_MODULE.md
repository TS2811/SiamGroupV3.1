# TSD_04: ACC Module (โครงหลัก)

# Technical Specification Document — Skeleton

> **Version:** 0.1 Skeleton
> **Status:** 🏗️ โครงหลัก (Phase 2)
> **Last Updated:** 2026-03-05
> **PRD Reference:** PRD #05 (ACC System)
> **Dependencies:** TSD_01 (Core Infrastructure)

---

## 1. ขอบเขต (Scope)

ระบบบัญชี ACC (Accounting / Expense Management):

> **แนวทาง: Embed ผ่าน iframe** — ระบบ ACC เดิมทำงานอยู่แล้ว, ไม่แก้ไข Code ภายใน, เฉพาะ Integration กับ V3.1 Layout + Permission

### สิ่งที่ทำ

| สิ่งที่ทำ                            | สิ่งที่ไม่ทำ           |
| :----------------------------------- | :--------------------- |
| Embed iframe ใน V3.1 Layout          | แก้ไข Code ภายใน ACC   |
| ส่ง JWT Token ให้ ACC ตรวจสิทธิ์     | เปลี่ยนหน้า UI ของ ACC |
| ย้าย ACC Settings → PRD #04 Settings | แก้ DB Schema ของ ACC  |
| ใช้ Permission System ของ Core       | —                      |

### ผู้ใช้งาน

| กลุ่ม     | การเข้าถึง             |
| :-------- | :--------------------- |
| บัญชี     | เข้าถึงทุกฟังก์ชัน ACC |
| ผู้จัดการ | อนุมัติค่าใช้จ่าย      |
| ผู้บริหาร | ดู Dashboard + อนุมัติ |
| พนักงาน   | แจ้งเบิกค่าใช้จ่าย     |

---

## 2. Integration Architecture

### 2.1 Embed Pattern

```
V3.1 Frontend (React)
  ├── MainLayout (AppBar + Sidebar)
  └── ACC Page
      └── <iframe src="{ACC_URL}" />
            ↕
      ACC Backend (เดิม)
      └── Database: v3_acc_* tables (ใน siamgroup_v3)
```

### 2.2 iframe URL Logic

```javascript
// Frontend Service
const getAccUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000/acc/";
  }
  return `${window.location.origin}/acc/`;
};
```

### 2.3 Permission Integration

```
core_app_structure:
  slug = 'ACC_MAIN', type = 'PAGE', module = 'ACC'

core_level_permissions:
  level_id + app_structure_id (ACC_MAIN) → เห็นเมนู ACC

core_app_actions:
  ACC_VIEW, ACC_EDIT, ACC_SUBMIT, ACC_APPROVE
```

---

## 3. Database Schema

### 3.1 ตาราง ACC ที่มีอยู่ (ไม่เปลี่ยน)

| #   | ตาราง                       | คำอธิบาย                                              |
| :-- | :-------------------------- | :---------------------------------------------------- |
| 1   | `v3_acc_expense_docs`       | เอกสารค่าใช้จ่าย (GENERAL, PCASH, FCASH, AUTO, CLAIM) |
| 2   | `v3_acc_expense_line_items` | รายการย่อยในเอกสาร                                    |
| 3   | `v3_acc_payees`             | ผู้รับเงิน (INTERNAL/EXTERNAL)                        |
| 4   | `v3_acc_categories`         | หมวดค่าใช้จ่าย                                        |
| 5   | `v3_acc_company_accounts`   | บัญชีธนาคารบริษัท                                     |
| 6   | `v3_acc_payment_groups`     | กลุ่มรอบจ่าย                                          |
| 7   | `v3_acc_payment_runs`       | รอบจ่ายย่อย                                           |
| 8   | `v3_acc_approval_rules`     | กฎอนุมัติ (role + action + company)                   |

### 3.2 ตาราง ACC Settings ที่ย้ายมา Core

> จัดการผ่าน PRD #04 Settings Admin — ใช้ API `/api/core/settings/` แทน

| ตั้งค่า                  | จัดการผ่าน                              |
| :----------------------- | :-------------------------------------- |
| Payees (ผู้รับเงิน)      | `/api/core/settings/acc/payees`         |
| Categories (หมวด)        | `/api/core/settings/acc/categories`     |
| Company Accounts (บัญชี) | `/api/core/settings/acc/accounts`       |
| Approval Rules           | `/api/core/settings/acc/approval-rules` |
| User/Role Access         | ใช้ Core Permission System (PRD #00)    |

### 3.3 Cross-reference กับ Core

| ตาราง ACC                 | เชื่อมกับ Core   | ผ่าน Column  |
| :------------------------ | :--------------- | :----------- |
| `v3_acc_expense_docs`     | `core_users`     | `created_by` |
| `v3_acc_payees`           | `core_companies` | `company_id` |
| `v3_acc_company_accounts` | `core_companies` | `company_id` |
| `v3_acc_approval_rules`   | `core_roles`     | `role_id`    |
| `v3_acc_approval_rules`   | `core_companies` | `company_id` |

---

## 4. ACC Internal Pages (อ้างอิง)

> Pages เหล่านี้ทำงานอยู่แล้วใน ACC เดิม — ไม่ต้องสร้างใหม่

| Page             | คำอธิบาย                         |
| :--------------- | :------------------------------- |
| NewExpense       | สร้าง/แก้ไขค่าใช้จ่ายแบบเต็ม     |
| ExpenseDashboard | จัดการค่าใช้จ่าย (6 แท็บ)        |
| GroupDashboard   | จัดการกลุ่มรอบจ่าย + Export      |
| GroupDetail      | รายละเอียดกลุ่ม + Runs + แนบสลิป |

---

## 5. API Endpoints

> ACC Module ใช้ API น้อยมากจากฝั่ง V3.1 — ส่วนใหญ่ทำภายใน iframe

### 5.1 V3.1 Side (Core)

| Method | Path                                    | คำอธิบาย          |
| :----- | :-------------------------------------- | :---------------- |
| `GET`  | `/api/core/settings/acc/payees`         | รายชื่อผู้รับเงิน |
| `CRUD` | `/api/core/settings/acc/categories`     | หมวดค่าใช้จ่าย    |
| `CRUD` | `/api/core/settings/acc/accounts`       | บัญชีธนาคาร       |
| `CRUD` | `/api/core/settings/acc/approval-rules` | กฎอนุมัติ         |

### 5.2 ACC Side (ภายใน iframe — มีอยู่แล้ว)

> API ฝั่ง ACC ยังคงทำงานเหมือนเดิม ไม่ต้องเปลี่ยน

---

## 6. Business Logic สำคัญ

### 6.1 Permission Flow

```
User Login (V3.1)
  → Core ตรวจ core_level_permissions สำหรับ ACC_MAIN
  → ถ้ามีสิทธิ์ → แสดงเมนู ACC ใน Sidebar
  → Click → Load iframe → ACC เดิมทำงาน
```

### 6.2 Company Visibility

- ACC ใช้ `core_user_company_access` + `core_user_branch_access`
- กรองข้อมูลค่าใช้จ่ายตาม company_id ที่เห็น

### 6.3 Expense Types

```
GENERAL  = ค่าใช้จ่ายทั่วไป
PCASH    = เบิกเงินสดย่อย (Petty Cash)
FCASH    = จ่ายด่วน (Fast Cash)
AUTO     = ค่าใช้จ่ายอัตโนมัติ
CLAIM    = เบิกค่าเดินทาง/อื่นๆ
```

---

## 7. Dependencies กับ TSD อื่น

| ใช้จาก TSD_01        | สิ่งที่ใช้                                |
| :------------------- | :---------------------------------------- |
| AuthMiddleware       | JWT Token ส่งให้ ACC ตรวจ                 |
| PermissionMiddleware | เมนู ACC_MAIN                             |
| Company Visibility   | กรองข้อมูลตาม company_id                  |
| Settings Admin       | จัดการ ACC Master Data ผ่าน Core Settings |

---

## 8. สรุปสิ่งที่ต้องทำ

| #   | งาน                                   | สถานะ |
| :-- | :------------------------------------ | :---- |
| 1   | สร้างเมนู ACC ใน core_app_structure   | ⏳    |
| 2   | สร้าง iframe wrapper ใน React         | ⏳    |
| 3   | ย้ายหน้า Settings ACC มารวม PRD #04   | ⏳    |
| 4   | ทดสอบ Permission สำหรับ ACC           | ⏳    |
| 5   | ทดสอบ Company Visibility กับ ACC data | ⏳    |

---

## 9. TODO (Phase 3 — ต้องเพิ่มก่อน Code)

- [ ] iframe Communication Pattern (postMessage? Token passing?)
- [ ] ACC Authentication Integration (JWT or Session?)
- [ ] Settings Migration Plan (ACC → Core)
- [ ] ACC API Document (ถ้าต้อง integrate เพิ่ม)
