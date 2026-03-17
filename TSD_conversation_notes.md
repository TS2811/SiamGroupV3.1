# 📝 TSD Conversation Notes

> **วัตถุประสงค์:** บันทึกสิ่งสำคัญเพื่อให้กรณีขึ้นแชทใหม่สามารถอ่านและต่องานได้ทันที

---

## สถานะ TSD (เอกสาร)

| TSD       | ชื่อโมดูล           | สถานะ            | หมายเหตุ                                                                      |
| :-------- | :------------------ | :--------------- | :---------------------------------------------------------------------------- |
| TSD_RULES | กฎการทำงาน          | ✅ เสร็จ         | กลยุทธ์ Hybrid                                                                |
| TSD_01    | Core Infrastructure | ✅ Verified v1.0 | ตรวจเทียบ SQL + Code จริงแล้ว (2026-03-10) — 19 tables ✅, 6 API groups ✅    |
| TSD_02    | HRM Module          | ✅ เสร็จ v1.0    | อัปเกรดจาก Skeleton → Full v1.0 (2026-03-10) — Table defs, API, Mismatches ✅ |
| TSD_03    | Payroll Module      | ✅ เสร็จ v1.0    | อัปเกรดจาก Skeleton → Full v1.0 (2026-03-10) — OT Examples, Bonus Formula ✅  |
| TSD_04    | ACC Module          | ✅ เสร็จ v1.0    | Migration Plan — Copy & Integrate (2026-03-10) — 24 pages, 40+ APIs mapped ✅ |
| TEST_PLAN | Test Cases          | ✅ เสร็จ v1.0    | 112 test cases — B1-B5 พร้อม TESTER ใช้งาน (2026-03-10)                       |

---

## สถานะ Implementation (Code จริง)

### 🟢 Backend — เสร็จแล้ว (Core Module)

| ไฟล์ / โมดูล                  | สถานะ    | รายละเอียด                                                                                |
| :---------------------------- | :------- | :---------------------------------------------------------------------------------------- |
| **config/config.php**         | ✅ เสร็จ | DB connection, JWT keys, CORS config                                                      |
| **config/helpers.php**        | ✅ เสร็จ | jsonSuccess/jsonError, validateRequired, JWT functions                                    |
| **middleware/**               | ✅ เสร็จ | CORS, API Key, Auth (requireAuth, requireAdmin)                                           |
| **core/models/User.php**      | ✅ เสร็จ | Login, Refresh Token, getMenuTree, getPermissions, getProfile                             |
| **core/models/CheckIn.php**   | ✅ เสร็จ | Clock In/Out, GPS validation, payroll cycle history                                       |
| **core/models/Dashboard.php** | ✅ เสร็จ | Calendar, Summary (สาย/ขาด/OT), Employee shift                                            |
| **core/models/Requests.php**  | ✅ เสร็จ | Leave, OT, Time Correction, Shift Swap — CRUD                                             |
| **core/models/Profile.php**   | ✅ เสร็จ | Full profile, contact update, password change, leave/OT history                           |
| **core/models/Settings.php**  | ✅ เสร็จ | Companies, Branches, Departments, Roles, Levels, Permissions, Config, Admin, AppStructure |
| **core/index.php**            | ✅ เสร็จ | Router — auth/_, dashboard/_, checkin/_, requests/_, profile/_, settings/_                |
| **scripts/001_schema.sql**    | ✅ เสร็จ | 19 ตาราง — core\_\*, hrm_employees                                                        |
| **scripts/002_seed.sql**      | ✅ เสร็จ | ข้อมูลเริ่มต้น — 4 บริษัท, 5 สาขา, 7 แผนก, 8 levels, app_structure                        |

### 🟢 Frontend — เสร็จแล้ว (Core Module)

| ไฟล์ / หน้า           | สถานะ    | รายละเอียด                                                                                                                      |
| :-------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **App.jsx**           | ✅ เสร็จ | React Router — Protected routes + Login route                                                                                   |
| **AuthContext.jsx**   | ✅ เสร็จ | Login, Logout, Refresh, Cookie-based auth, menuTree, permissions                                                                |
| **MainLayout.jsx**    | ✅ เสร็จ | Top Navbar (5 systems) + Sidebar (sub-pages) + Responsive mobile bottom bar                                                     |
| **api.js**            | ✅ เสร็จ | Axios instance — authService, checkinService, dashboardService, requestService, profileService, settingsService, **hrmService** |
| **theme.js**          | ✅ เสร็จ | MUI Theme — สี SiamGroup branding                                                                                               |
| **LoginPage.jsx**     | ✅ เสร็จ | Login form + auto redirect                                                                                                      |
| **DashboardPage.jsx** | ✅ เสร็จ | Calendar (21-20 cycle), Summary cards, Shift info                                                                               |
| **CheckInPage.jsx**   | ✅ เสร็จ | GPS-based Clock In/Out, Google Maps, radius validation                                                                          |
| **RequestsPage.jsx**  | ✅ เสร็จ | Leave/OT/Time Correction/Shift Swap forms + history list                                                                        |
| **ProfilePage.jsx**   | ✅ เสร็จ | 5-tab profile (ข้อมูลส่วนตัว, ติดต่อ, รหัสผ่าน, ประวัติลา, ประวัติ OT)                                                          |
| **SettingsPage.jsx**  | ✅ เสร็จ | 7 sub-pages via sidebar routing:                                                                                                |
|                       |          | — บริษัท (CompanyTab) — แก้ไขข้อมูลบริษัท                                                                                       |
|                       |          | — สาขา (BranchTab) — แก้ไขข้อมูลสาขา + GPS                                                                                      |
|                       |          | — โครงสร้างองค์กร (OrgTab) — แผนก/ตำแหน่ง/ระดับ CRUD                                                                            |
|                       |          | — สิทธิ์การเข้าถึง (PermissionTab) — Level × Page matrix                                                                        |
|                       |          | — โครงสร้างเมนู (MenuStructureTab) — App structure CRUD                                                                         |
|                       |          | — ค่าระบบ (ConfigTab) — System config (HR/PAYROLL/SECURITY/SYSTEM)                                                              |
|                       |          | — ผู้ดูแลระบบ (AdminTab) — Admin toggle                                                                                         |

### 🟢 HRM Module — เสร็จแล้ว

| ไฟล์ / โมดูล                         | สถานะ    | รายละเอียด                                                               |
| :----------------------------------- | :------- | :----------------------------------------------------------------------- |
| **scripts/003_hrm_schema.sql**       | ✅ เสร็จ | 10 ตาราง HRM หลัก (shifts, time_logs, holidays, leave, OT, etc.)         |
| **scripts/004_hrm_extra_tables.sql** | ✅ เสร็จ | 6 ตารางเพิ่ม (personal_off_days, remarks, documents, evaluation 3 ตาราง) |
| **hrm/models/HrmEmployee.php**       | ✅ เสร็จ | Employee CRUD + Documents + Subordinates                                 |
| **hrm/models/HrmTimeReport.php**     | ✅ เสร็จ | Calendar Grid (21-20), Daily Breakdown, Summary, Remarks                 |
| **hrm/models/HrmSchedule.php**       | ✅ เสร็จ | Shifts CRUD, Employee Shift assign/bulk, Holidays, Personal Off Days     |
| **hrm/models/HrmApproval.php**       | ✅ เสร็จ | Unified Approval — Leave/OT/TimeCorrection/ShiftSwap + side effects      |
| **hrm/index.php**                    | ✅ เสร็จ | Router — 8 resources, 30+ endpoints                                      |
| **HrmEmployeesPage.jsx**             | ✅ เสร็จ | Employee list + filter + Add/Edit/View dialogs                           |
| **HrmTimeReportPage.jsx**            | ✅ เสร็จ | 2-panel layout, Summary card, Daily breakdown table, Remark editing      |
| **HrmApprovalsPage.jsx**             | ✅ เสร็จ | Unified approvals — filter by type/status, approve/reject actions        |
| **HrmSchedulesPage.jsx**             | ✅ เสร็จ | 2-tab: Shift list CRUD + Employee shift assign (single/bulk)             |
| **HrmHolidaysPage.jsx**              | ✅ เสร็จ | Grouped by month, Stats cards, CRUD (National/Company/Special)           |
| **HrmLeaveMgmtPage.jsx**             | ✅ เสร็จ | 2-tab: Leave Types CRUD + Leave Quotas per employee/year                 |
| **HrmEvaluationPage.jsx**            | ✅ เสร็จ | Star Rating per criteria (5 categories), Grade system, Comments          |
| **HrmReportsPage.jsx**               | ✅ เสร็จ | 4-tab: Employee Status, Attendance, OT, Leave reports                    |

### � Payroll Module — เสร็จแล้ว v1.0

#### Backend

| ไฟล์ / โมดูล                      | สถานะ    | รายละเอียด                                                                                                   |
| :-------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------- |
| **pay/models/PayPayroll.php**     | ✅ เสร็จ | Periods CRUD, Calculate (OT+SSF+Tax+Advance+Loan), Records, Items                                            |
| **pay/models/PayLoan.php**        | ✅ เสร็จ | Loans CRUD, Advances CRUD, 2-level approval, ceiling check                                                   |
| **pay/models/PayCertificate.php** | ✅ เสร็จ | Certificates CRUD, 6 doc types, sign/approve/reject, auto doc number                                         |
| **pay/models/PayBonus.php**       | ✅ เสร็จ | Bonus score calc (eval 70% + attend 30%), set amount, approve                                                |
| **pay/index.php**                 | ✅ เสร็จ | Router — 8 resources: periods, records, calculate, items, item-types, advances, loans, certificates, bonuses |

#### Frontend

| ไฟล์ / หน้า                 | สถานะ    | รายละเอียด                                                          |
| :-------------------------- | :------- | :------------------------------------------------------------------ |
| **PayPayrollPage.jsx**      | ✅ เสร็จ | 3-tab: รอบเงินเดือน + รายละเอียดรอบ + สลิปเงินเดือน                 |
|                             |          | — สร้างรอบ, คำนวณ, เปลี่ยนสถานะ (Draft→Reviewing→Finalized→Paid)    |
|                             |          | — ปรับรายการ, ดูสลิปรายคน                                           |
| **PayLoansPage.jsx**        | ✅ เสร็จ | 2-tab: เงินกู้ยืม + เบิกเงินล่วงหน้า                                |
|                             |          | — สร้าง, ดูรายละเอียด, อนุมัติ 2 ระดับ (HR+ผจก.)                    |
| **PayCertificatesPage.jsx** | ✅ เสร็จ | ขอเอกสาร 6 ประเภท, อนุมัติ/ปฏิเสธ, ดูรายละเอียด, เลขเอกสารอัตโนมัติ |
| **PayBonusesPage.jsx**      | ✅ เสร็จ | Dashboard + คำนวณคะแนน + แก้ไขจำนวนโบนัส + อนุมัติทั้งหมด           |

### 🟢 ACC Module — เสร็จแล้ว (iframe mode ✅)

| ไฟล์ / โมดูล                         | สถานะ    | รายละเอียด                                                                     |
| :----------------------------------- | :------- | :----------------------------------------------------------------------------- |
| **acc/index.php**                    | ✅ เสร็จ | JWT Bridge (243 lines) — แปลง V3.1 JWT → ACC user format                       |
| **acc/api.php**                      | ✅ เสร็จ | ACC API เดิม (4,299 lines, 55+ actions) — Dual Mode V2/V3.1                    |
| **acc/gdrive_helper.php**            | ✅ เสร็จ | Google Drive upload/download/delete (ก๊อปจาก V2, 2026-03-17)                  |
| **acc/debug_tool.php**               | ✅ เสร็จ | Debug tool สำหรับ api.php default case (ก๊อปจาก V2, 2026-03-17)               |
| **acc/config/**                      | ✅ เสร็จ | Google Drive credentials + OAuth tokens (6 files, ก๊อปจาก V2)                 |
| **acc/uploads/**                     | ✅ เสร็จ | Local file upload folder (สร้างเปล่า, 2026-03-17)                              |
| **acc_tables_v3.sql**                | ✅ เสร็จ | ACC table definitions + views + data import (4.6MB)                             |
| **v3_user_company_access**           | ✅ เสร็จ | สร้าง table + seed 812 rows (2026-03-17)                                       |
| **v3_acc_employee_banks**            | ✅ เสร็จ | Migrate 17 rows จาก V2 Production DB (2026-03-17)                              |
| **AccIframePage.jsx**                | ✅ เสร็จ | iframe wrapper — route /acc/* → ACC standalone app                              |
| **ACC Frontend dist/ rebuild**       | ✅ เสร็จ | Rebuild ด้วย latest config.js + source code (2026-03-17)                       |
| **acc_menu_items.sql**               | ✅ เสร็จ | เมนู ACC ใน core_app_structure                                                  |
| **ACC standalone ↔ V3.1 JWT Auth**   | ✅ เสร็จ | ACC detect iframe mode → ใช้ V3.1 backend API + JWT cookie (verified 2026-03-17) |
| **ACC Employee Bank Dropdown**       | ✅ เสร็จ | Autocomplete ค้นหาพนักงาน+บัญชีธนาคาร ทำงานได้ (verified 2026-03-17)           |
| **ACC Native React pages**           | 📋 แผนอนาคต | ปัจจุบันใช้ iframe — อาจ migrate เป็น Native React ในอนาคตเพื่อ UX ที่ดีขึ้น |

### 🟢 Google Drive Integration — เสร็จแล้ว ✅

| ไฟล์ / โมดูล                         | สถานะ    | รายละเอียด                                                           |
| :----------------------------------- | :------- | :------------------------------------------------------------------- |
| **gdrive_helper.php**                | ✅ เสร็จ | Shared helper — upload, delete, stream, folder management + module URL|
| **auth_gdrive.php**                  | ✅ เสร็จ | OAuth Web Flow + auto-refresh token                                  |
| **config/gdrive/**                   | ✅ เสร็จ | oauth_web.json + gdrive_token.json                                   |
| **ACC file upload → GDrive**         | ✅ เสร็จ | acc/api.php รองรับ gdrive:// file paths                              |
| **HRM Document Upload → GDrive**     | ✅ เสร็จ | hrm/index.php → GDrive first, local fallback + stream + delete (2026-03-17) |
| **Profile Avatar → GDrive**          | ✅ เสร็จ | core/index.php + Profile.php + ProfilePage.jsx upload UI (2026-03-17) |

---

## การตัดสินใจสำคัญ

### 1. กลยุทธ์ Hybrid (2026-03-05)

- Phase 1: TSD_01 ทำเต็ม → Phase 2: TSD_02-04 ทำโครง → Phase 3: Code + เก็บรายละเอียด

### 2. API Routing — เลือก Option B (2026-03-05)

- แยก Router per Module: `/api/core/`, `/api/hrm/`, `/api/pay/`, `/api/acc/`
- ใช้ .htaccess URL Rewriting → Clean URLs
- เหตุผล: maintainability ดีกว่า Single Entry Point

### 3. ภาษา TSD (2026-03-05)

- ภาษาไทยเป็นหลัก, Terms ทางเทคนิคใช้ภาษาอังกฤษได้

### 4. Frontend Reference (2026-03-05)

- ใช้ patterns จาก FRONTEND_STANDARDS.md (Thailand Post project)
- แต่ปรับ Colors/Branding ให้ตรงกับ SiamGroup V3.1

### 5. การจัดกลุ่ม TSD (2026-03-05)

- รวม PRD #00 + #01 + #04 → TSD_01 (Core Infrastructure)
- PRD #02 → TSD_02 (HRM), PRD #03 → TSD_03 (Payroll), PRD #05 → TSD_04 (ACC)

### 6. Settings Page — ลบ Duplicate Tabs (2026-03-06)

- เอา Tab bar ภายใน SettingsPage ออก ให้ใช้ Sidebar ของ MainLayout navigate แทน
- SettingsPage อ่าน `useLocation()` เพื่อ render component ตาม route path
- แก้ SQL bug: `core_app_structure` ใช้ column `slug` ไม่ใช่ `code`
- สร้าง MenuStructureTab ใหม่ (จัดการ app_structure CRUD)

### 7. ที่อยู่ระบบ ACC เก่า (V2) — สำหรับอ้างอิง

- **ACC Frontend (V2):** `C:\xampp\htdocs\acc` — Vite+React+TailwindCSS, base `/acc`
  - 20 pages, 9 components (Layout, Sidebar, AuthContext, ProtectedRoute, etc.)
  - config.js → API_BASE ชี้ไป `http://localhost/v2/acc/backend/api.php?action=`
- **ACC Backend (V2):** `C:\xampp\htdocs\v2\acc\back_end` — PHP backend เดิม
  - api.php (ตัวเดียวกับที่ก๊อปมาใส่ `v3_1/backend/acc/api.php`)
- **ACC Frontend (V3.2 fork):** `C:\xampp\htdocs\accv3.2` — copy ของ ACC ที่ config ชี้ไป V2 backend

---

## Open Questions ที่ค้างอยู่ (จาก TSD_01)

| #   | คำถาม                                                             | สถานะ         |
| :-- | :---------------------------------------------------------------- | :------------ |
| 1   | Theme / Color Palette สำหรับ V3.1 — ใช้สีอะไร?                    | ⏳ รอตัดสินใจ |
| 2   | Notification — ใช้ Telegram Bot ตัวเดียวกับระบบเดิมหรือสร้างใหม่? | ⏳ รอตัดสินใจ |
| 3   | ~~File Upload Storage — local disk หรือ Cloud Storage?~~          | ✅ **ตัดสินใจ: Google Drive** (OAuth Web Flow, gdrive_helper.php) |

---

## Bugs ที่แก้ไปแล้ว (2026-03-06)

| Bug                          | รายละเอียด                                              | แก้ไข                                  |
| :--------------------------- | :------------------------------------------------------ | :------------------------------------- |
| Settings Duplicate Tabs      | SettingsPage มี Tabs bar ซ้ำกับ sidebar                 | ลบ Tabs bar, ใช้ route-based rendering |
| `/settings/org` จอขาว        | ลบ `Tabs`/`Tab` import ทิ้งแต่ OrgTab ยังใช้อยู่        | เพิ่ม import กลับ                      |
| `/settings/permission` error | SQL ใช้ column `code` แต่ตารางใช้ `slug`                | `slug as code`                         |
| `createAppStructure` crash   | SQL ใช้ column `code`/`path` แต่ตารางใช้ `slug`/`route` | แก้ column names                       |
| `deleteAppStructure` crash   | ใช้ `page_id` แต่ FK column คือ `app_structure_id`      | แก้ column name                        |

---

## Conversation IDs

| ID                                     | หัวข้อ                                         | วันที่     |
| :------------------------------------- | :--------------------------------------------- | :--------- |
| `04665f4c-635d-48dc-955d-c9d704ac138a` | สร้าง TSD Rules + TSD_01 + Settings Page       | 2026-03-05 |
| `6afc0464-e538-4698-aef7-80c6930ac7ae` | แก้ Settings + HRM Backend & Frontend skeleton | 2026-03-06 |
| `6afc0464-e538-4698-aef7-80c6930ac7ae` | แก้ Dialog Layout + MUI slotProps Migration    | 2026-03-09 |
| `6afc0464-e538-4698-aef7-80c6930ac7ae` | Payroll Module Implementation + Debug          | 2026-03-09 |
| `6afc0464-e538-4698-aef7-80c6930ac7ae` | Payroll Certificates + Bonuses + Bug Fixes     | 2026-03-10 |

---

## Session Log: 2026-03-09

### งานที่ทำวันนี้

#### 1. แก้ TimeReport Calendar/Daily View ให้เต็มพื้นที่

- `HrmTimeReportPage.jsx` — ปรับ Calendar+Daily table ให้กว้างเต็มจอ

#### 2. แก้ Dialog Layout ทุกหน้า HRM (Grid → Box/Flexbox)

- **ปัญหา:** MUI Grid v2 ทำให้ form fields ภายใน Dialog ถูกบีบ/จัดเรียงผิด
- **แก้ไข:** เปลี่ยนจาก `<Grid container>/<Grid item>` เป็น `<Box>` + CSS Flexbox
- **ไฟล์ที่แก้:**

| ไฟล์                 | Dialog ที่แก้                                     |
| -------------------- | ------------------------------------------------- |
| HrmSchedulesPage.jsx | Shift, Assign, Bulk Assign dialogs + Tab 1 layout |
| HrmEmployeesPage.jsx | Add/Edit Employee + View Employee dialogs         |
| HrmHolidaysPage.jsx  | Add/Edit Holiday dialog + Stats cards             |
| HrmLeaveMgmtPage.jsx | Leave Type + Quota + Edit Quota dialogs           |
| HrmReportsPage.jsx   | Stats cards                                       |

#### 3. ลบ Grid import ที่ไม่ใช้แล้ว

- ลบ `Grid` ออกจาก MUI imports ทั้ง 8 ไฟล์ HRM

#### 4. Deprecated MUI Props → slotProps Migration

- **ปัญหา:** `InputProps`, `InputLabelProps`, `PaperProps` ถูก deprecated ใน MUI v6 (แสดงขีดค่า)
- **แก้ไข:**
  - `InputProps={{ ... }}` → `slotProps={{ input: { ... } }}`
  - `InputLabelProps={{ shrink: true }}` → `slotProps={{ inputLabel: { shrink: true } }}`
  - `PaperProps={{ sx: { ... } }}` → `slotProps={{ paper: { sx: { ... } } }}`
  - `InputProps={{ inputProps: { min: 0 } }}` → `slotProps={{ htmlInput: { min: 0 } }}`
- **ไฟล์ที่แก้:** 10 ไฟล์ (ทุก HRM + LoginPage + SettingsPage)
- **ผลลัพธ์:** ไม่เหลือ deprecation warnings

---

## Session Log: 2026-03-09 (ช่วงบ่าย — Payroll Module)

### งานที่ทำ

#### 1. Payroll Module — Backend Fixes

| ไฟล์             | ปัญหา                            | แก้ไข                                                  |
| ---------------- | -------------------------------- | ------------------------------------------------------ |
| `pay/index.php`  | `$_GET` undefined index errors   | ใช้ `!empty()` guard ทุกจุด                            |
| `PayPayroll.php` | `e.department_id` column ไม่มี   | ลบ department JOIN ออกจาก getRecords + getRecordDetail |
| `PayPayroll.php` | `status = 'ACTIVE'` ไม่ตรงกับ DB | เปลี่ยนเป็น `NOT IN ('RESIGNED','TERMINATED')`         |
| `PayPayroll.php` | `o.ot_type_id` column ไม่มี      | เขียน OT calc ใหม่ใช้ `ot_type` enum ตรงๆ              |
| `PayBonus.php`   | `e.department_id` column ไม่มี   | ลบ department JOIN + filter ออก                        |

#### 2. Payroll Module — Frontend Fixes

| ไฟล์                 | ปัญหา                                                    | แก้ไข                         |
| -------------------- | -------------------------------------------------------- | ----------------------------- |
| `PayPayrollPage.jsx` | companies ไม่โหลด (API response `{data:{companies:[]}}`) | รองรับ nested response format |
| `PayPayrollPage.jsx` | ปุ่มคำนวณหายตอน status=REVIEWING                         | แสดงทั้ง DRAFT + REVIEWING    |
| `PayLoansPage.jsx`   | companies ไม่โหลด (same issue)                           | รองรับ nested response format |

#### 3. Database Fixes

- `pay_item_types` — Fix corrupted Thai names via `SET NAMES utf8mb4`
- `core_app_structure` — Fix PAY_PAYROLL, PAY_LOANS Thai names
- `core_level_permissions` — Insert permissions for payroll pages

#### 4. Schema Mismatches ที่พบ (สำคัญมาก!)

> **บทเรียนรู้:** TSD/PRD ออกแบบให้มี `department_id`, `ot_type_id` แต่ DB จริงไม่มี

| สิ่งที่คาดใน TSD/Code                               | DB จริง                                  | ตาราง             |
| --------------------------------------------------- | ---------------------------------------- | ----------------- |
| `hrm_employees.department_id`                       | ไม่มี column นี้                         | `hrm_employees`   |
| `hrm_ot_requests.ot_type_id` (FK ไป `pay_ot_types`) | ใช้ `ot_type` enum แทน                   | `hrm_ot_requests` |
| Employee `status = 'ACTIVE'`                        | ใช้ `FULL_TIME`, `PROBATION`, `CONTRACT` | `hrm_employees`   |

### ผลลัพธ์การคำนวณเงินเดือน (period_id=2, company_id=1)

| พนักงาน                     | เงินเดือนฐาน | เงินสุทธิ  |
| --------------------------- | ------------ | ---------- |
| แอดมิน ระบบ (ADM001)        | ฿0           | ฿0         |
| สมชาย วงศ์ศรี (SDR001)      | ฿45,000      | ฿43,322.82 |
| พลอย สุขใจ (SDR002)         | ฿28,000      | ฿26,945    |
| ณัฐพงศ์ เกียรติกุล (SDR003) | ฿18,000      | ฿17,250    |
| สุดา ประเสริฐ (SDR004)      | ฿20,000      | ฿19,250    |

---

## Session Log: 2026-03-10

### งานที่ทำวันนี้

#### 1. Payroll Module — Certificates + Bonuses Frontend

| ไฟล์                    | สิ่งที่ทำ                                                   |
| ----------------------- | ----------------------------------------------------------- |
| PayCertificatesPage.jsx | สร้างหน้าหนังสือรับรอง/เอกสาร — 6 ประเภท, ขอ/อนุมัติ/ปฏิเสธ |
| PayBonusesPage.jsx      | สร้างหน้าโบนัสประจำปี — Dashboard + คำนวณคะแนน + อนุมัติ    |
| App.jsx                 | เพิ่ม routes: `/pay/certificates`, `/pay/bonuses`           |
| add_pay_pages.sql       | เพิ่มเมนู + permissions ใน DB                               |

#### 2. Backend Bug Fixes

| ไฟล์           | ปัญหา                                     | แก้ไข                                                |
| -------------- | ----------------------------------------- | ---------------------------------------------------- |
| `PayBonus.php` | `e.status = 'ACTIVE'` ไม่ตรงกับ DB        | เปลี่ยนเป็น `NOT IN ('RESIGNED','TERMINATED')`       |
| `PayBonus.php` | `evaluation_date` ไม่มีใน DB              | เปลี่ยนเป็น `evaluation_month`                       |
| `PayBonus.php` | `status`/`late_minutes` ไม่มีใน time_logs | เขียน attendance score ใหม่ใช้ raw scan data + leave |

#### 3. Frontend Bug Fixes

| ไฟล์                    | ปัญหา                                            | แก้ไข                           |
| ----------------------- | ------------------------------------------------ | ------------------------------- |
| PayCertificatesPage.jsx | Employee dropdown ไม่แสดง (ผิด response parsing) | ใช้ `res.data?.data?.employees` |
| PayCertificatesPage.jsx | ปุ่มอนุมัติโดน browser block (`window.confirm`)  | เปลี่ยนเป็น MUI Dialog          |
| PayPayrollPage.jsx      | `window.confirm` ทั้งคำนวณ/อนุมัติ/จ่ายแล้ว      | เปลี่ยนเป็น MUI confirm dialog  |

#### 4. Schema Mismatches ใหม่ที่พบเพิ่ม

| สิ่งที่คาดใน Code                 | DB จริง                          | ตาราง              |
| --------------------------------- | -------------------------------- | ------------------ |
| `hrm_evaluations.evaluation_date` | ใช้ `evaluation_month` (date)    | `hrm_evaluations`  |
| `hrm_time_logs.status`            | ไม่มี column นี้ (เป็น raw scan) | `hrm_time_logs`    |
| `hrm_time_logs.late_minutes`      | ไม่มี column นี้                 | `hrm_time_logs`    |
| `core_level_permissions.can_view` | ไม่มี (มีแค่ level_id + app_id)  | `core_level_perms` |

### ผลลัพธ์การคำนวณโบนัส (year=2026, company_id=1)

| พนักงาน                     | ประเมิน (70) | ขยัน (30) | รวม (100) |
| --------------------------- | ------------ | --------- | --------- |
| แอดมิน ระบบ (ADM001)        | 0.0          | 30.0      | 30.0      |
| สมชาย วงศ์ศรี (SDR001)      | 0.0          | 29.5      | 29.5      |
| พลอย สุขใจ (SDR002)         | 0.0          | 29.5      | 29.5      |
| ณัฐพงศ์ เกียรติกุล (SDR003) | 0.0          | 30.0      | 30.0      |
| สุดา ประเสริฐ (SDR004)      | 0.0          | 29.5      | 29.5      |

---

## Session Log: 2026-03-10 (ช่วงบ่าย — Master Plan + TSD Upgrade)

### งานที่ทำ

#### 1. สร้าง Project Master Plan (Handoff Document)

- วิเคราะห์สถานะทั้งหมดจาก TSD_conversation_notes + Code จริง
- สร้างเอกสารแผนงาน 4 Phases (A: TSD Update, B: Testing, C: ACC, D: Launch)
- สร้าง Test Matrix 12 scenarios + Regression Test Checklist 14 bugs
- สร้าง Project Structure Map + Design Principles Reference
- บันทึกไว้ที่ Artifact: `project_master_plan.md`

#### 2. อัปเกรด TSD_02 HRM Module (Skeleton v0.1 → Full v1.0)

| สิ่งที่เพิ่ม                         | รายละเอียด                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| Table Definitions (16 ตาราง)         | อ่านจาก 003 + 004 SQL scripts จริง — มี column, type, FK ครบ |
| API Endpoints (35+ routes)           | อ่านจาก hrm/index.php จริง — มี request/response ตัวอย่าง    |
| Schema Mismatches (6 จุด)            | บันทึกสิ่งที่ TSD เดิมออกแบบ vs DB จริง                      |
| Validation Rules                     | required fields ทุก endpoint                                 |
| ER Diagram (Mermaid)                 | ครบทุก relationship                                          |
| Business Logic (Status, 21-20, etc.) | อ้างอิง Code จริง                                            |

#### 3. อัปเกรด TSD_03 Payroll Module (Skeleton v0.1 → Full v1.0)

| สิ่งที่เพิ่ม                        | รายละเอียด                                           |
| ----------------------------------- | ---------------------------------------------------- |
| Table Definitions (12 ตาราง)        | อ่านจาก 005_pay_schema.sql จริง                      |
| API Endpoints (35+ routes)          | อ่านจาก pay/index.php จริง                           |
| OT Calculation Examples (3 วิธี)    | FORMULA, FIXED_RATE, TIME_SLOT — พร้อมตัวอย่างคำนวณ  |
| Bonus Score Formula                 | eval 70% + attend 30% — พร้อมอธิบาย late count logic |
| Schema Mismatches (8 จุด)           | บันทึกครบ                                            |
| Certificate Auto Doc Number Pattern | [PREFIX]-[YYMM]-[SEQUENCE]                           |
| Advance Dual Approval Flow          | Manager → HR → APPROVED                              |

### สรุป Phase A (TSD Update) — ✅ เสร็จทั้งหมด

| งาน                       | สถานะ    |
| :------------------------ | :------- |
| TSD_02 HRM Full v1.0      | ✅ เสร็จ |
| TSD_03 PAY Full v1.0      | ✅ เสร็จ |
| TSD_01 Core Verified v1.0 | ✅ เสร็จ |

**สิ่งที่ทำใน TSD_01 Core Review:**

- ตรวจ 19/19 ตาราง — ✅ ทุกตารางตรงกับ `001_core_schema.sql`
- ตรวจ 6 API groups (auth, dashboard, checkin, requests, profile, settings) — ✅ ตรง
- พบ 6 routes ที่ Code มีเพิ่มจาก TSD เดิม (auth/me, checkin/history, etc.) — ไม่กระทบ
- แก้ React 19.x → 18.x, MUI 7.x → 6.x ให้ตรง Code จริง
- แก้ TSD_02 ลบ `CONTRACT` status ออกให้ตรง DB จริง
- เพิ่ม Schema Verification Log (Section 9 ใน TSD_01)

#### 4. สร้าง TEST_PLAN.md (Phase B: Testing & QA)

- สร้างไฟล์ `TSD/TEST_PLAN.md` — Test Cases ฉบับสมบูรณ์
- **112 test cases** แบ่ง 5 กลุ่ม:

| กลุ่ม                    | จำนวน    | Priority P1 |
| :----------------------- | :------- | :---------- |
| B1: Core Module          | 28 cases | 13 P1       |
| B2: HRM Module           | 32 cases | 5 P1        |
| B3: Payroll Module       | 30 cases | 8 P1        |
| B4: Regression (14 bugs) | 14 cases | ทั้งหมด     |
| B5: Integration          | 8 cases  | 4 P1        |

- มี Test Data (Users, Companies), Status Tracker, วิธีใช้สำหรับ TESTER

### สรุป Phase B (Testing)

| งาน                    | สถานะ            |
| :--------------------- | :--------------- |
| TEST_PLAN.md สร้างแล้ว | ✅ เสร็จ         |
| ทดสอบจริง              | ⏳ ส่งต่อ TESTER |

#### 5. อัปเกรด TSD_04 ACC Module → Full v1.0 (Migration Plan)

- **แนวทาง:** Copy & Integrate — ไม่ Dev ใหม่
- ก๊อประบบ ACC เดิม (24 Frontend pages + 40+ API actions) มาวางใน V3.1
- เขียน **JWT Bridge** (`current_user()` decode JWT แทน PHP Session)
- เพิ่ม **Execution Checklist** 12 ขั้นตอน (~2.5 ชม.)
- Resolved 5 Open Questions (iframe vs direct, JWT vs Session, etc.)

### สรุป Phase C (ACC Integration)

| งาน                        | สถานะ    |
| :------------------------- | :------- |
| TSD_04 Migration Plan v1.0 | ✅ เสร็จ |
| JWT Bridge (acc/index.php)  | ✅ เสร็จ |
| ACC API Dual Mode           | ✅ เสร็จ |
| iframe Wrapper              | ✅ เสร็จ |
| ACC DB Tables + Data Import | ✅ เสร็จ |
| GDrive Helper (shared)      | ✅ เสร็จ |
| ACC standalone ↔ JWT Auth   | ✅ เสร็จ (2026-03-17) |
| ACC Backend Files ครบ       | ✅ เสร็จ (gdrive_helper, debug_tool, config/, uploads/) |
| ACC Employee Banks Data     | ✅ เสร็จ (17 rows migrated from V2 Production) |
| ACC Frontend Rebuild        | ✅ เสร็จ (dist/ rebuild with latest config) |
| ACC Native React pages      | 📋 แผนอนาคต (optional) |

---

## Session Log: 2026-03-17

### งานที่ทำวันนี้

#### 1. สแกนโค้ดทั้งหมด + อัปเดตแผนงาน

- สแกน Backend (32 files: 7 core models, 4 HRM models, 4 Pay models, ACC bridge + API)
- สแกน Frontend (19 pages: 7 core, 8 HRM, 4 Pay, 1 ACC iframe)
- สแกน Google Drive integration (gdrive_helper, auth_gdrive, config)
- สแกน SQL scripts (24 files: schemas, seeds, migrations, tests)
- อัปเดต conversation notes ให้สะท้อนสถานะจริง
- สร้าง Project Status Report artifact

#### 2. สรุปสถานะรวม

| โมดูล | สถานะ |
| :---- | :---- |
| Core  | ✅ 100% |
| HRM   | ✅ 100% |
| Payroll | ✅ 100% |
| ACC   | ✅ 100% (iframe mode เสร็จ, Native React = แผนอนาคต) |
| GDrive | ✅ 100% (ACC + HRM + Profile เสร็จทุกโมดูล) |
| Testing | ⏳ TEST_PLAN สร้างแล้ว, ยังไม่ได้ทดสอบจริง |
| **รวมทั้งโครงการ** | **~95%** (เหลือแค่ Testing) |

### Conversation IDs (เพิ่มเติม)

| ID                                     | หัวข้อ                                         | วันที่     |
| :------------------------------------- | :--------------------------------------------- | :--------- |
| `29615bad-0efc-48c1-9497-83adfe961cb0` | V3 Google Drive Integration                    | 2026-03-16 |
| `6b7d233e-ea11-40eb-9ada-11824811a1df` | Profile Picture Upload Fix                     | 2026-03-17 |
| `fd6983cc-c41b-432d-a59b-a4812de0a63a` | Google Drive Auth Fix                          | 2026-03-13 |
| `90bca7bf-6f31-4373-a877-1ffacce280d7` | สแกนโค้ด + ACC Integration สมบูรณ์                | 2026-03-17 |

---

## Session Log: 2026-03-17 (ช่วงที่ 2 — ACC Integration สมบูรณ์)

### งานที่ทำ

#### 1. แก้ JWT Authentication สำหรับ ACC

| ปัญหา | แก้ไข |
| :---- | :---- |
| `JWTExceptionWithPayloadInterface not found` Fatal Error | แก้ลำดับ `require_once` ใน AuthMiddleware.php |
| 401 Unauthorized ผ่าน Vite proxy | เพิ่ม `cookieDomainRewrite: 'localhost'` + `secure: false` ใน vite.config.js |
| AccIframePage.jsx URL ผิด port | แก้ให้ detect dev mode แล้วชี้ไป port 80 |

#### 2. แก้ DB Tables ที่ขาด

| ปัญหา | แก้ไข |
| :---- | :---- |
| `v3_user_company_access` ไม่มี table | สร้าง table + seed 812 rows (ผู้ใช้ active ทุกคน → ทุก company) |
| `v3_acc_employee_banks` ว่าง (0 rows) | Migrate 17 rows จาก V2 Production DB (`longter1_v2` @ `147.50.254.111`) |

#### 3. ก๊อปไฟล์ Backend ที่ขาดจาก V2

| ไฟล์ | ขนาด | หน้าที่ |
| :---- | :---- | :---- |
| `gdrive_helper.php` | 10KB | Google Drive upload/download/delete |
| `debug_tool.php` | 18KB | Debug tool (api.php default case) |
| `config/` (6 files) | — | Google Drive credentials + OAuth tokens |
| `uploads/` | — | Local file upload folder (สร้างเปล่า) |

#### 4. Rebuild ACC Frontend

- Rebuild `dist/` 2 ครั้งด้วย `npm run build` ใน `C:\xampp\htdocs\acc`
- config.js Dual Mode: iframe → V3.1 API, standalone → V2 API

#### 5. Verification ผ่าน API + Browser

| ข้อมูล | จำนวน |
| :----- | :---- |
| employees | 203 |
| employees with bank | 16 |
| banks | 12 |
| payees | 17,960 |
| companies | 4 |
| branches | 43 |
| workflows | 7 |

- ✅ Employee bank autocomplete dropdown ทำงานได้ (พิมพ์ค้นหาแล้วขึ้นรายชื่อพนักงาน+บัญชี)
- ✅ PCASH/FCASH expense type switch ทำงานได้
- ✅ Transfer To section แสดงครบ

### ข้อมูล V2 Production สำหรับอ้างอิง

| รายการ | ค่า |
| :----- | :-- |
| V2 DB Host | `147.50.254.111` |
| V2 DB Name | `longter1_v2` |
| V2 DB User | `longter1_v2` |
| V2 ACC Backend | `C:\xampp\htdocs\v2\acc\back_end` |
| V2 ACC Frontend | `C:\xampp\htdocs\acc` |

---

## Session Log: 2026-03-17 (ช่วงที่ 3 — Google Drive Integration ทุกระบบ)

### งานที่ทำ

#### 1. HRM Document Upload → Google Drive

| ไฟล์ | สิ่งที่แก้ |
| :---- | :---- |
| `hrm/index.php` | Upload: GDrive first, local fallback |
| `hrm/index.php` | Download: เพิ่ม stream route `GET /employees/{id}/documents/{docId}/download` |
| `hrm/index.php` | Delete: ลบไฟล์จาก GDrive/local ก่อนลบ DB |
| `HrmEmployee.php` | เพิ่ม `getDocument()` method |

#### 2. HRM File Stream Route

| Route | หน้าที่ |
| :---- | :---- |
| `GET /api/hrm/files/stream?file=gdrive://xxx` | Stream ไฟล์จาก GDrive หรือ local |

#### 3. Profile Avatar Upload → Google Drive

| ไฟล์ | สิ่งที่แก้ |
| :---- | :---- |
| `core/index.php` | เพิ่ม `POST /api/core/profile/avatar` (upload) |
| `core/index.php` | เพิ่ม `GET /api/core/profile/avatar/view` (stream) |
| `Profile.php` | เพิ่ม `getAvatarUrl()` + `updateAvatarUrl()` |
| `ProfilePage.jsx` | เพิ่ม avatar upload UI (กดที่ Avatar → เลือกรูป → upload) |

#### 4. gdrive_helper.php อัปเกรด

| สิ่งที่แก้ |
| :---- |
| `gdrive_getViewUrl()` รองรับ `$module` parameter (acc/hrm/core) |

### Design Pattern: GDrive First, Local Fallback

```
Upload Flow:
1. เช็ค gdrive_helper.php มีหรือไม่
2. ถ้ามี → gdrive_uploadFile() → เก็บ gdrive:// URI
3. ถ้าไม่มี/พัง → move_uploaded_file() → เก็บ local path
```

### Google Drive Folder Structure

```
📁 V3.1 Root (GDrive)
├── 📁 ACC/          ← Expense attachments
├── 📁 HRM/
│   └── 📁 documents/
│       └── 📁 emp_{id}/  ← Employee documents
└── 📁 PROFILE/
    └── 📁 avatars/   ← Profile pictures
```
