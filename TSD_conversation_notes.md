# 📝 TSD Conversation Notes

> **วัตถุประสงค์:** บันทึกสิ่งสำคัญเพื่อให้กรณีขึ้นแชทใหม่สามารถอ่านและต่องานได้ทันที

---

## สถานะ TSD (เอกสาร)

| TSD       | ชื่อโมดูล           | สถานะ            | หมายเหตุ                                 |
| :-------- | :------------------ | :--------------- | :--------------------------------------- |
| TSD_RULES | กฎการทำงาน          | ✅ เสร็จ         | กลยุทธ์ Hybrid                           |
| TSD_01    | Core Infrastructure | 📝 Draft v1.0    | เสร็จครบทุก Section — รอ Review          |
| TSD_02    | HRM Module          | 🔨 Coding v1.0   | Backend เสร็จ, Frontend 8/8 หน้าเสร็จ ✅ |
| TSD_03    | Payroll Module      | 🏗️ Skeleton v0.1 | โครงหลักเสร็จ — 12 ตาราง, OT Engine      |
| TSD_04    | ACC Module          | 🏗️ Skeleton v0.1 | โครงหลักเสร็จ — iframe Embed             |

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

### 🔴 ยังไม่ได้เริ่ม

| โมดูล              | สถานะ          | หมายเหตุ                                             |
| :----------------- | :------------- | :--------------------------------------------------- |
| **Payroll Module** | ❌ ยังไม่เริ่ม | TSD_03 มี skeleton — OT Engine, Social Security, Tax |
| **ACC Module**     | ❌ ยังไม่เริ่ม | TSD_04 มี skeleton — iframe Embed จากระบบเดิม        |

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

---

## Open Questions ที่ค้างอยู่ (จาก TSD_01)

| #   | คำถาม                                                             | สถานะ         |
| :-- | :---------------------------------------------------------------- | :------------ |
| 1   | Theme / Color Palette สำหรับ V3.1 — ใช้สีอะไร?                    | ⏳ รอตัดสินใจ |
| 2   | Notification — ใช้ Telegram Bot ตัวเดียวกับระบบเดิมหรือสร้างใหม่? | ⏳ รอตัดสินใจ |
| 3   | File Upload Storage — local disk หรือ Cloud Storage?              | ⏳ รอตัดสินใจ |

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
