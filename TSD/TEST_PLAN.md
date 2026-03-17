# 🧪 SiamGroup V3.1 — Test Plan & Test Cases

> **Version:** 1.0
> **Status:** 📝 Ready for Testing
> **Last Updated:** 2026-03-10
> **อ้างอิง:** TSD_01 (Verified), TSD_02 (v1.0), TSD_03 (v1.0)
> **Base URL:** `http://localhost/v3_1/backend`

---

## สารบัญ

1. [ภาพรวมและกลยุทธ์](#1-ภาพรวมและกลยุทธ์)
2. [ข้อมูลทดสอบ (Test Data)](#2-ข้อมูลทดสอบ)
3. [B1: Core Module Tests](#3-b1-core-module-tests)
4. [B2: HRM Module Tests](#4-b2-hrm-module-tests)
5. [B3: Payroll Module Tests](#5-b3-payroll-module-tests)
6. [B4: Regression Tests](#6-b4-regression-tests)
7. [B5: Cross-Module Integration Tests](#7-b5-cross-module-integration-tests)
8. [Test Execution Tracker](#8-test-execution-tracker)

---

## 1. ภาพรวมและกลยุทธ์

### 1.1 ขอบเขต

| Module      | ประเภท Test            | จำนวน Cases   |
| :---------- | :--------------------- | :------------ |
| Core        | API + UI + Security    | 28 cases      |
| HRM         | API + UI + Logic       | 32 cases      |
| Payroll     | API + UI + Calculation | 30 cases      |
| Regression  | Bug re-verify          | 14 cases      |
| Integration | Cross-module           | 8 cases       |
| **รวม**     |                        | **112 cases** |

### 1.2 Priority Legend

| Priority | ความหมาย                         | เมื่อไหร่ต้องทำ  |
| :------- | :------------------------------- | :--------------- |
| 🔴 P1    | Critical — ถ้าพังจะใช้ระบบไม่ได้ | ต้องทดสอบก่อน    |
| 🟡 P2    | Important — ฟีเจอร์หลัก          | ทดสอบหลัง P1     |
| 🟢 P3    | Normal — Nice to have            | ทดสอบเมื่อมีเวลา |

### 1.3 Status Legend

| สัญลักษณ์ | ความหมาย    |
| :-------- | :---------- |
| ⬜        | ยังไม่ทดสอบ |
| ✅        | ผ่าน        |
| ❌        | ไม่ผ่าน     |
| ⚠️        | ผ่านบางส่วน |
| 🚫        | Blocked     |

---

## 2. ข้อมูลทดสอบ (Test Data)

### 2.1 Users

| Username   | Password     | Role     | Company | Level  | is_admin |
| :--------- | :----------- | :------- | :------ | :----- | :------- |
| `admin`    | _(ตาม seed)_ | Admin IT | SDR     | 1 (MD) | ✅ Yes   |
| `user_sdr` | _(ตาม seed)_ | HR       | SDR     | 3      | No       |
| `user_sxd` | _(ตาม seed)_ | พนักงาน  | SXD     | 8      | No       |
| `user_spd` | _(ตาม seed)_ | พนักงาน  | SPD     | 6      | No       |

### 2.2 Companies

| Code | ชื่อ            | ประเภท     | HQ/Sub      |
| :--- | :-------------- | :--------- | :---------- |
| SDR  | SiamDotRent     | CAR_RENTAL | HEADQUARTER |
| SAR  | SiamAutoRent    | CAR_RENTAL | SUBSIDIARY  |
| SXD  | SiamExpress DHL | DHL        | SUBSIDIARY  |
| SPD  | SiamParcel DHL  | DHL        | SUBSIDIARY  |

### 2.3 สภาพแวดล้อม

```
Frontend: http://localhost/v3_1/
Backend:  http://localhost/v3_1/backend/api/
Database: siamgroup_v3 (localhost:3306)
```

---

## 3. B1: Core Module Tests

### 3.1 Authentication (AUTH)

| ID      | Priority | Test Case                      | Steps                                                          | Expected Result                                              | Status |
| :------ | :------- | :----------------------------- | :------------------------------------------------------------- | :----------------------------------------------------------- | :----- |
| AUTH-01 | 🔴 P1    | Login สำเร็จ                   | POST `/api/core/auth/login` Body: `{username, password}`       | 200 + user object + menu_tree + HttpOnly Cookie set          | ⬜     |
| AUTH-02 | 🔴 P1    | Login ล้มเหลว (wrong password) | POST `/api/core/auth/login` Body: `{username, wrong_password}` | 401 + `failed_login_count` + 1                               | ⬜     |
| AUTH-03 | 🔴 P1    | Login ล็อกหลังผิดหลายครั้ง     | ลอง Login ผิด >= `LOGIN_MAX_ATTEMPTS` ครั้ง                    | 403 + `locked_until` ถูก set, ข้อความ "บัญชีถูกล็อกชั่วคราว" | ⬜     |
| AUTH-04 | 🔴 P1    | Access Token Refresh           | POST `/api/core/auth/refresh` พร้อม refresh cookie             | 200 + Access Token ใหม่                                      | ⬜     |
| AUTH-05 | 🔴 P1    | Logout                         | POST `/api/core/auth/logout`                                   | 200 + Cookie ถูกลบ + Token revoked                           | ⬜     |
| AUTH-06 | 🔴 P1    | เข้า API โดยไม่มี Token        | GET `/api/core/dashboard` โดยไม่มี Cookie                      | 401 Unauthorized                                             | ⬜     |
| AUTH-07 | 🟡 P2    | Auth/me (re-auth on reload)    | GET `/api/core/auth/me` พร้อม valid Cookie                     | 200 + user + menu_tree + permissions                         | ⬜     |
| AUTH-08 | 🟡 P2    | Inactive user ล็อคอิน          | Login ด้วย user ที่ `is_active = 0`                            | 401 ไม่สามารถ Login ได้                                      | ⬜     |

### 3.2 Permission (PERM)

| ID      | Priority | Test Case                   | Steps                                                           | Expected Result              | Status |
| :------ | :------- | :-------------------------- | :-------------------------------------------------------------- | :--------------------------- | :----- |
| PERM-01 | 🔴 P1    | Level 1 (MD) เห็นทุกเมนู    | Login เป็น level_score=1 → ดู menu_tree                         | ปรากฏเมนูครบทุกหน้า          | ⬜     |
| PERM-02 | 🔴 P1    | Level 8 ไม่เห็น Settings    | Login เป็น level_score=8 → ดู menu_tree                         | ไม่มีเมนู Settings           | ⬜     |
| PERM-03 | 🔴 P1    | Non-admin เข้า Settings API | GET `/api/core/settings/companies` ด้วย non-admin user          | 403 Forbidden                | ⬜     |
| PERM-04 | 🟡 P2    | User Override — เพิ่มสิทธิ์ | เพิ่ม user_permission `is_granted=1` ให้ level 8 เข้าหน้า HR    | เมื่อ Login จะเห็นเมนู HR    | ⬜     |
| PERM-05 | 🟡 P2    | User Override — ถอนสิทธิ์   | เพิ่ม user_permission `is_granted=0` ให้ level 1 ไม่เห็นหน้า HR | เมื่อ Login จะไม่เห็นเมนู HR | ⬜     |

### 3.3 Dashboard (DASH)

| ID      | Priority | Test Case              | Steps                                                | Expected Result                   | Status |
| :------ | :------- | :--------------------- | :--------------------------------------------------- | :-------------------------------- | :----- |
| DASH-01 | 🔴 P1    | Calendar 21-20 ถูกต้อง | GET `/api/core/dashboard/calendar?month=3&year=2026` | แสดงข้อมูล 21 ก.พ. — 20 มี.ค.     | ⬜     |
| DASH-02 | 🟡 P2    | Summary Data           | GET `/api/core/dashboard`                            | มี summary (วันทำงาน, ลา, OT ฯลฯ) | ⬜     |
| DASH-03 | 🟡 P2    | เดือนข้ามปี (ม.ค.)     | GET `/api/core/dashboard/calendar?month=1&year=2026` | แสดง 21 ธ.ค. 2025 — 20 ม.ค. 2026  | ⬜     |

### 3.4 Check-in/Check-out (CHK)

| ID     | Priority | Test Case                  | Steps                                                         | Expected Result                             | Status |
| :----- | :------- | :------------------------- | :------------------------------------------------------------ | :------------------------------------------ | :----- |
| CHK-01 | 🔴 P1    | Check-in ONSITE (ในรัศมี)  | POST `/api/core/checkin` + GPS coords ภายในรัศมีสาขา          | 200 + บันทึก `hrm_time_logs` scan_type=IN   | ⬜     |
| CHK-02 | 🔴 P1    | Check-in ONSITE (นอกรัศมี) | POST `/api/core/checkin` + GPS coords ห่างเกิน `check_radius` | 403 "กรุณาอยู่ในพื้นที่สาขา"                | ⬜     |
| CHK-03 | 🔴 P1    | Check-out                  | POST `/api/core/checkin` scan_type=OUT หลัง Check-in แล้ว     | 200 + บันทึก OUT                            | ⬜     |
| CHK-04 | 🟡 P2    | Check-in OFFSITE           | POST พร้อม offsite_reason + offsite_attachment                | 200 + `check_in_type=OFFSITE`               | ⬜     |
| CHK-05 | 🟡 P2    | สถานะ Check-in วันนี้      | GET `/api/core/checkin/status`                                | คืนสถานะปัจจุบัน (IN, OUT, ยังไม่ check-in) | ⬜     |
| CHK-06 | 🟡 P2    | Check-in History           | GET `/api/core/checkin/history?month=3&year=2026`             | คืนประวัติ Check-in ของรอบ 21-20            | ⬜     |

### 3.5 Request Forms (REQ)

| ID     | Priority | Test Case                     | Steps                                                                                              | Expected Result                                 | Status |
| :----- | :------- | :---------------------------- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------- | :----- |
| REQ-01 | 🔴 P1    | ขอลา (Leave Request)          | POST `/api/core/requests/leave` Body: `{leave_type_id, start_date, end_date, total_days, reason}`  | 201 + สร้าง `hrm_leave_requests` status=PENDING | ⬜     |
| REQ-02 | 🔴 P1    | ขอ OT                         | POST `/api/core/requests/ot` Body: `{ot_date, ot_type, start_time, end_time, total_hours, reason}` | 201 + สร้าง `hrm_ot_requests` status=PENDING    | ⬜     |
| REQ-03 | 🟡 P2    | ขอแก้เวลา                     | POST `/api/core/requests/time-correction`                                                          | 201 + สร้าง `hrm_time_correction_requests`      | ⬜     |
| REQ-04 | 🟡 P2    | ยกเลิกคำร้อง                  | PUT `/api/core/requests/{id}/cancel` (PENDING เท่านั้น)                                            | 200 + status → CANCELLED                        | ⬜     |
| REQ-05 | 🟡 P2    | ยกเลิกคำร้องที่ Approved แล้ว | PUT `/api/core/requests/{id}/cancel` (APPROVED)                                                    | 400 — ไม่สามารถยกเลิกได้                        | ⬜     |

### 3.6 Profile (PROF)

| ID      | Priority | Test Case                        | Steps                                                                     | Expected Result                        | Status |
| :------ | :------- | :------------------------------- | :------------------------------------------------------------------------ | :------------------------------------- | :----- |
| PROF-01 | 🟡 P2    | ดู Profile                       | GET `/api/core/profile`                                                   | 200 + ข้อมูลพนักงาน + บริษัท + ตำแหน่ง | ⬜     |
| PROF-02 | 🟡 P2    | แก้ไข Profile (phone, email)     | PUT `/api/core/profile` Body: `{phone, email}`                            | 200 + ข้อมูลอัปเดต                     | ⬜     |
| PROF-03 | 🟡 P2    | เปลี่ยนรหัสผ่านสำเร็จ            | PUT `/api/core/profile/password` Body: `{current_password, new_password}` | 200 + รหัสผ่านเปลี่ยน                  | ⬜     |
| PROF-04 | 🟡 P2    | เปลี่ยนรหัสผ่าน (current ไม่ถูก) | PUT `/api/core/profile/password` Body: `{wrong_current, new}`             | 400 "รหัสผ่านเดิมไม่ถูกต้อง"           | ⬜     |

### 3.7 Settings (SET)

| ID     | Priority | Test Case          | Steps                                                      | Expected Result                   | Status |
| :----- | :------- | :----------------- | :--------------------------------------------------------- | :-------------------------------- | :----- |
| SET-01 | 🟡 P2    | ดูรายการ Companies | GET `/api/core/settings/companies` (Admin)                 | 200 + data.companies[] — 4 บริษัท | ⬜     |
| SET-02 | 🟡 P2    | แก้ไข Branch       | PUT `/api/core/settings/branches/{id}` Body: `{name_th}`   | 200 + ข้อมูลอัปเดต                | ⬜     |
| SET-03 | 🟡 P2    | CRUD Department    | POST → GET → PUT → DELETE `/api/core/settings/departments` | สร้าง/ดู/แก้/ลบ สำเร็จ            | ⬜     |
| SET-04 | 🟡 P2    | CRUD Roles         | POST → GET → PUT → DELETE `/api/core/settings/roles`       | สร้าง/ดู/แก้/ลบ สำเร็จ            | ⬜     |
| SET-05 | 🟡 P2    | Permission Matrix  | GET `/api/core/settings/permissions/matrix`                | คืน Level × Page matrix           | ⬜     |
| SET-06 | 🟡 P2    | System Config      | GET → PUT `/api/core/settings/system-config`               | ดูค่า config + แก้ไขได้           | ⬜     |

---

## 4. B2: HRM Module Tests

### 4.1 Employee Management (EMP)

| ID     | Priority | Test Case             | Steps                                                                                                                                 | Expected Result                                    | Status |
| :----- | :------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------- | :----- |
| EMP-01 | 🔴 P1    | ดูรายชื่อพนักงาน      | GET `/api/hrm/employees?company_id=1`                                                                                                 | 200 + employees[] พร้อม company/branch/level JOIN  | ⬜     |
| EMP-02 | 🔴 P1    | สร้างพนักงานใหม่      | POST `/api/hrm/employees` Body: `{username, first_name_th, last_name_th, employee_code, company_id, branch_id, level_id, start_date}` | 201 + สร้าง core_users + hrm_employees             | ⬜     |
| EMP-03 | 🔴 P1    | แก้ไขพนักงาน          | PUT `/api/hrm/employees/{id}` Body: `{base_salary: 50000}`                                                                            | 200 + salary อัปเดต                                | ⬜     |
| EMP-04 | 🟡 P2    | กรองพนักงานตาม status | GET `/api/hrm/employees?status=FULL_TIME`                                                                                             | เฉพาะพนักงานประจำ (ไม่มี RESIGNED/TERMINATED)      | ⬜     |
| EMP-05 | 🟡 P2    | ค้นหาพนักงาน          | GET `/api/hrm/employees?search=สมชาย`                                                                                                 | ค้นทั้ง first_name_th, last_name_th, employee_code | ⬜     |
| EMP-06 | 🟡 P2    | Username ซ้ำ          | POST `/api/hrm/employees` ด้วย username ที่มีอยู่แล้ว                                                                                 | 400 + error "username ซ้ำ"                         | ⬜     |
| EMP-07 | 🟡 P2    | อัปโหลดเอกสาร         | POST `/api/hrm/employees/{id}/documents` (multipart)                                                                                  | 201 + บันทึกไฟล์ + hrm_employee_documents          | ⬜     |
| EMP-08 | 🟢 P3    | ลบเอกสาร              | DELETE `/api/hrm/employees/{id}/documents/{docId}`                                                                                    | 200 + ลบ record + ลบไฟล์                           | ⬜     |

### 4.2 Time Report (TR)

| ID    | Priority | Test Case           | Steps                                                                            | Expected Result                                                                | Status |
| :---- | :------- | :------------------ | :------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- | :----- |
| TR-01 | 🔴 P1    | Calendar Grid 21-20 | GET `/api/hrm/time-report/calendar?month=3&year=2026&company_id=1`               | แสดงพนักงานทุกคน × วัน 21ก.พ.-20มี.ค. พร้อมสถานะ                               | ⬜     |
| TR-02 | 🔴 P1    | Daily Breakdown     | GET `/api/hrm/time-report/daily?employee_id=1&start=2026-02-21&end=2026-03-20`   | รายละเอียด Check-in/out ทุกวัน + status (ON_TIME/LATE/ABSENT/ON_LEAVE/DAY_OFF) | ⬜     |
| TR-03 | 🟡 P2    | Summary             | GET `/api/hrm/time-report/summary?employee_id=1&start=2026-02-21&end=2026-03-20` | สรุป: วันทำงาน, สาย, ขาด, ลา, OT ชม.                                           | ⬜     |
| TR-04 | 🟡 P2    | บันทึก Remark       | PUT `/api/hrm/time-report/remarks` Body: `{employee_id, date, remark}`           | 200 + UPSERT `hrm_user_daily_remarks`                                          | ⬜     |
| TR-05 | 🟡 P2    | สถานะ LATE          | Check-in หลัง `start_time + late_grace_minutes`                                  | สถานะ = LATE (ไม่ใช่ ON_TIME)                                                  | ⬜     |

### 4.3 Schedule & Holidays (SCH)

| ID     | Priority | Test Case              | Steps                                                                                                                  | Expected Result                   | Status |
| :----- | :------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------------------------- | :----- |
| SCH-01 | 🟡 P2    | สร้างกะทำงาน           | POST `/api/hrm/schedules/shifts` Body: `{company_id, code:"N", name_th:"กะดึก", start_time:"22:00", end_time:"06:00"}` | 201 + สร้าง hrm_shifts            | ⬜     |
| SCH-02 | 🟡 P2    | Assign กะ 1 คน         | POST `/api/hrm/schedules/assign` Body: `{employee_id, shift_id, effective_date}`                                       | 200 + สร้าง hrm_employee_shifts   | ⬜     |
| SCH-03 | 🟡 P2    | Bulk assign กะ         | POST `/api/hrm/schedules/bulk` Body: `{employee_ids:[1,2,3], shift_id, effective_date}`                                | 200 + สร้าง 3 records             | ⬜     |
| SCH-04 | 🟡 P2    | CRUD Holiday           | POST → GET → PUT → DELETE `/api/hrm/holidays`                                                                          | สร้าง/ดู/แก้/ลบ วันหยุด           | ⬜     |
| SCH-05 | 🟡 P2    | Duplicate holiday_date | POST สร้างวันหยุดซ้ำ (company_id + holiday_date เดียวกัน)                                                              | 400 + UNIQUE constraint error     | ⬜     |
| SCH-06 | 🟢 P3    | Personal Off Day       | POST `/api/hrm/personal-off-days`                                                                                      | 200 + สร้าง hrm_personal_off_days | ⬜     |

### 4.4 Leave Management (LV)

| ID    | Priority | Test Case       | Steps                                                                                       | Expected Result                          | Status |
| :---- | :------- | :-------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------- | :----- |
| LV-01 | 🟡 P2    | CRUD Leave Type | POST → GET → PUT → DELETE `/api/hrm/leave-types`                                            | สร้าง/ดู/แก้ไข/soft-delete (is_active=0) | ⬜     |
| LV-02 | 🟡 P2    | ตั้งโควตาลา     | POST `/api/hrm/leave-quotas` Body: `{employee_id, leave_type_id, year:2026, quota_days:10}` | 200 + UPSERT `hrm_employee_leave_quotas` | ⬜     |
| LV-03 | 🟡 P2    | Bulk ตั้งโควตา  | POST `/api/hrm/leave-quotas/bulk` items: 5 คน                                               | 200 + UPSERT 5 records                   | ⬜     |

### 4.5 Approvals (APR)

| ID     | Priority | Test Case                    | Steps                                                                          | Expected Result                                                     | Status |
| :----- | :------- | :--------------------------- | :----------------------------------------------------------------------------- | :------------------------------------------------------------------ | :----- |
| APR-01 | 🔴 P1    | อนุมัติลา + used_days อัปเดต | PUT `/api/hrm/approvals/{id}/approve` Body: `{type:"leave"}`                   | status=APPROVED + hrm_employee_leave_quotas.used_days += total_days | ⬜     |
| APR-02 | 🔴 P1    | ปฏิเสธลา                     | PUT `/api/hrm/approvals/{id}/reject` Body: `{type:"leave", reason:"ไม่สะดวก"}` | status=REJECTED + reject_reason บันทึก                              | ⬜     |
| APR-03 | 🟡 P2    | อนุมัติ OT                   | PUT approve OT request                                                         | status=APPROVED (ไม่มี side effect)                                 | ⬜     |
| APR-04 | 🟡 P2    | Force Leave                  | PUT `/api/hrm/approvals/{emp}/force-leave` Body: `{date, leave_type_id}`       | สร้าง leave_request (APPROVED) + อัปเดต used_days                   | ⬜     |
| APR-05 | 🟡 P2    | กรองตาม type                 | GET `/api/hrm/approvals?type=ot&status=PENDING`                                | เฉพาะ OT requests ที่ PENDING                                       | ⬜     |

### 4.6 Evaluation (EVAL)

| ID      | Priority | Test Case        | Steps                                             | Expected Result                    | Status |
| :------ | :------- | :--------------- | :------------------------------------------------ | :--------------------------------- | :----- |
| EVAL-01 | 🟡 P2    | สร้าง Evaluation | สร้าง evaluation + 5 scores (1 ต่อ criteria)      | 200 + คำนวณ weighted_score ถูกต้อง | ⬜     |
| EVAL-02 | 🟡 P2    | Duplicate month  | สร้าง evaluation ซ้ำเดือนเดียวกันสำหรับคนเดียวกัน | 400 + UNIQUE constraint error      | ⬜     |
| EVAL-03 | 🟡 P2    | Score range      | ให้คะแนน 0 หรือ 6 (นอกช่วง 1-5)                   | 400 + CHECK constraint error       | ⬜     |

### 4.7 Reports (RPT)

| ID     | Priority | Test Case         | Steps                                                     | Expected Result                 | Status |
| :----- | :------- | :---------------- | :-------------------------------------------------------- | :------------------------------ | :----- |
| RPT-01 | 🟡 P2    | Employee Summary  | GET `/api/hrm/reports/employees`                          | จำนวนพนักงานแยก status + บริษัท | ⬜     |
| RPT-02 | 🟡 P2    | OT Report         | GET `/api/hrm/reports/ot?start=2026-02-21&end=2026-03-20` | ชม. OT รวม แยกประเภท per person | ⬜     |
| RPT-03 | 🟡 P2    | Leave Report      | GET `/api/hrm/reports/leave?start=...&end=...`            | วันลาแยกประเภท per person       | ⬜     |
| RPT-04 | 🟢 P3    | Attendance Report | GET `/api/hrm/reports/attendance?start=...&end=...`       | วันทำงาน, สาย, ขาด per person   | ⬜     |

---

## 5. B3: Payroll Module Tests

### 5.1 Payroll Period (PP)

| ID    | Priority | Test Case           | Steps                                                                  | Expected Result                                                       | Status |
| :---- | :------- | :------------------ | :--------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----- |
| PP-01 | 🔴 P1    | สร้างรอบ            | POST `/api/pay/periods` Body: `{company_id:1, period_month:"2026-02"}` | 201 + start_date=2026-01-21, end_date=2026-02-20, pay_date=2026-03-01 | ⬜     |
| PP-02 | 🔴 P1    | Duplicate period    | POST สร้างรอบซ้ำ (company_id + period_month เดียวกัน)                  | 400 + UNIQUE error                                                    | ⬜     |
| PP-03 | 🟡 P2    | อัปเดตสถานะ         | PUT `/api/pay/periods/{id}/status` Body: `{status:"REVIEWING"}`        | 200 + status เปลี่ยน                                                  | ⬜     |
| PP-04 | 🟡 P2    | Status flow ถูกต้อง | เปลี่ยน DRAFT → REVIEWING → FINALIZED → PAID                           | ทุกขั้นตอนสำเร็จ                                                      | ⬜     |

### 5.2 Payroll Calculate (CALC)

| ID      | Priority | Test Case                    | Steps                                              | Expected Result                                                                      | Status |
| :------ | :------- | :--------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------- | :----- |
| CALC-01 | 🔴 P1    | คำนวณเงินเดือนทั้งรอบ        | POST `/api/pay/calculate` Body: `{period_id}`      | 200 + per-employee records พร้อม base_salary, total_income, total_deduction, net_pay | ⬜     |
| CALC-02 | 🔴 P1    | OT FORMULA ถูกต้อง           | พนักงาน salary=45000, OT 1.5x, 2 ชม.               | OT Pay = (45000÷30÷8) × 1.5 × 2 = **562.50**                                         | ⬜     |
| CALC-03 | 🔴 P1    | OT FIXED_RATE ถูกต้อง        | พนักงาน salary=25000 (SDR), OT 1.0x, 3 ชม.         | rate=90, OT Pay = 90 × 1.0 × 3 = **270.00**                                          | ⬜     |
| CALC-04 | 🟡 P2    | OT TIME_SLOT ถูกต้อง         | พนักงาน CNX shift, ทำงาน 20:00-22:00               | OT Pay = **200** (flat amount)                                                       | ⬜     |
| CALC-05 | 🔴 P1    | ประกันสังคมถูกต้อง           | พนักงาน salary=45000                               | SSF = min(45000, 15000) × 5% = **750.00**                                            | ⬜     |
| CALC-06 | 🟡 P2    | ประกันสังคม cap              | พนักงาน salary=10000                               | SSF = 10000 × 5% = **500.00** (ไม่ถึง cap)                                           | ⬜     |
| CALC-07 | 🟡 P2    | หักเบิกเงินล่วงหน้า          | พนักงานเบิก advance อนุมัติแล้ว                    | หัก SALARY_ADVANCE ตรง amount                                                        | ⬜     |
| CALC-08 | 🟡 P2    | หักผ่อนกู้ยืม                | พนักงานมี loan ACTIVE                              | หัก LOAN_PAYMENT ตาม monthly_payment                                                 | ⬜     |
| CALC-09 | 🔴 P1    | Net Pay = Income - Deduction | ตรวจสอบ: net_pay == total_income - total_deduction | ค่า net_pay ถูกต้อง (+/- 0.01)                                                       | ⬜     |

### 5.3 Payroll Items (ITM)

| ID     | Priority | Test Case           | Steps                                                                             | Expected Result                                        | Status |
| :----- | :------- | :------------------ | :-------------------------------------------------------------------------------- | :----------------------------------------------------- | :----- |
| ITM-01 | 🟡 P2    | เพิ่ม Manual Income | POST `/api/pay/items` Body: `{record_id, item_type_id:"MEETING_FEE", amount:500}` | 200 + เพิ่ม item + recalculateTotals()                 | ⬜     |
| ITM-02 | 🟡 P2    | ลบ item             | DELETE `/api/pay/items/{id}`                                                      | 200 + recalculateTotals() — total_income ลดลง          | ⬜     |
| ITM-03 | 🟡 P2    | ห้ามลบ system item  | DELETE item ที่ `is_system=1` (BASE_SALARY)                                       | 400 + error "ห้ามลบ"                                   | ⬜     |
| ITM-04 | 🟡 P2    | recalculateTotals   | หลังเพิ่ม/ลบ item → ดู record                                                     | total_income, total_deduction, net_pay ถูก recalculate | ⬜     |

### 5.4 Advances (ADV)

| ID     | Priority | Test Case          | Steps                                                                           | Expected Result                              | Status |
| :----- | :------- | :----------------- | :------------------------------------------------------------------------------ | :------------------------------------------- | :----- |
| ADV-01 | 🟡 P2    | เบิกเงินล่วงหน้า   | POST `/api/pay/advances` Body: `{employee_id, period_month, amount, reason}`    | 201 + overall_status=PENDING                 | ⬜     |
| ADV-02 | 🟡 P2    | เบิกเกินเพดาน      | POST เบิก amount > base_salary × 30%                                            | 400 + error "เกินเพดาน"                      | ⬜     |
| ADV-03 | 🟡 P2    | Manager Approve    | PUT `/api/pay/advances/{id}/approve` Body: `{role:"manager", action:"approve"}` | manager_status=APPROVED                      | ⬜     |
| ADV-04 | 🟡 P2    | HR Approve (Final) | Manager APPROVED → HR Approve                                                   | hr_status=APPROVED + overall_status=APPROVED | ⬜     |
| ADV-05 | 🟡 P2    | Manager Reject     | PUT Body: `{role:"manager", action:"reject"}`                                   | overall_status=REJECTED                      | ⬜     |

### 5.5 Loans (LOAN)

| ID      | Priority | Test Case         | Steps                                                            | Expected Result                                          | Status |
| :------ | :------- | :---------------- | :--------------------------------------------------------------- | :------------------------------------------------------- | :----- |
| LOAN-01 | 🟡 P2    | สร้างกู้ยืม       | POST `/api/pay/loans` Body: ดู TSD_03                            | 201 + คำนวณ total_amount, remaining_balance              | ⬜     |
| LOAN-02 | 🟡 P2    | กู้ยืม + ดอกเบี้ย | POST ด้วย `has_interest=1, interest_rate=3.0` loan=50000, 10 งวด | total_interest คำนวณถูก, total_amount = 50000 + interest | ⬜     |
| LOAN-03 | 🟡 P2    | ยกเลิกกู้ยืม      | PUT `/api/pay/loans/{id}` Body: `{status:"CANCELLED"}`           | status=CANCELLED                                         | ⬜     |

### 5.6 Certificates (CERT)

| ID      | Priority | Test Case               | Steps                                                                                 | Expected Result                                       | Status |
| :------ | :------- | :---------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------- | :----- |
| CERT-01 | 🟡 P2    | สร้างเอกสาร (CERT_WORK) | POST `/api/pay/certificates` Body: `{employee_id, doc_type:"CERT_WORK", issued_date}` | 201 + Auto doc number (CERT-YYMM-XXXXX)               | ⬜     |
| CERT-02 | 🟡 P2    | ลงนามเอกสาร             | PUT `/api/pay/certificates/{id}/sign` Body: `{sign_method:"APPROVE_ONLY"}`            | status=SIGNED                                         | ⬜     |
| CERT-03 | 🟡 P2    | ปฏิเสธเอกสาร            | PUT `/api/pay/certificates/{id}/reject` Body: `{reason:"ข้อมูลไม่ถูก"}`               | status=REJECTED                                       | ⬜     |
| CERT-04 | 🟢 P3    | Doc number format       | สร้าง 2 เอกสารเดือนเดียวกัน                                                           | เลขรันต่อเนื่อง เช่น CERT-2603-00001, CERT-2603-00002 | ⬜     |

### 5.7 Bonuses (BNS)

| ID     | Priority | Test Case           | Steps                                                               | Expected Result                                                       | Status |
| :----- | :------- | :------------------ | :------------------------------------------------------------------ | :-------------------------------------------------------------------- | :----- |
| BNS-01 | 🟡 P2    | คำนวณคะแนนโบนัส     | POST `/api/pay/bonuses/calculate` Body: `{year:2026, company_id:1}` | evaluation_score (เต็ม 70) + attendance_score (เต็ม 30) = total_score | ⬜     |
| BNS-02 | 🟡 P2    | ตรวจสูตร evaluation | พนักงาน weighted_score เฉลี่ย = 4.0 (เต็ม 5)                        | evaluation_score = (4.0 ÷ 5) × 70 = **56.00**                         | ⬜     |
| BNS-03 | 🟡 P2    | ตรวจสูตร attendance | พนักงานสาย 5 วัน                                                    | attendance_score = 30 - (5 × 0.5) = **27.50**                         | ⬜     |
| BNS-04 | 🟡 P2    | แก้จำนวนโบนัส       | PUT `/api/pay/bonuses/{id}` Body: `{bonus_amount:20000}`            | 200 + bonus_amount อัปเดต                                             | ⬜     |
| BNS-05 | 🟡 P2    | อนุมัติโบนัสทั้งรอบ | POST `/api/pay/bonuses/approve` Body: `{year:2026, company_id:1}`   | status → APPROVED ทุก record                                          | ⬜     |

---

## 6. B4: Regression Tests (Known Bugs)

> 14 bugs ที่แก้ไขแล้ว — ต้องตรวจซ้ำว่าไม่กลับมา

| ID     | Bug                                        | วิธีทดสอบ                        | Expected                                        | Status |
| :----- | :----------------------------------------- | :------------------------------- | :---------------------------------------------- | :----- |
| REG-01 | BUG-001: Settings duplicate tabs           | เปิด Settings → ไม่มี tab ซ้ำ    | Tab ไม่ซ้ำ                                      | ⬜     |
| REG-02 | BUG-002: `/settings/org` จอขาว             | เปิดหน้า Organization Structure  | หน้าโหลดได้ปกติ                                 | ⬜     |
| REG-03 | BUG-003: Permission SQL column mismatch    | เปิด Permission Matrix           | โหลดไม่มี SQL error                             | ⬜     |
| REG-04 | BUG-004: createAppStructure crash          | สร้าง App Structure ใหม่         | สร้างสำเร็จ ไม่ crash                           | ⬜     |
| REG-05 | BUG-005: deleteAppStructure FK column      | ลบ App Structure                 | ลบสำเร็จ                                        | ⬜     |
| REG-06 | BUG-006: Payroll `$_GET` undefined         | เปิดหน้า Payroll Periods         | โหลดได้ปกติ ไม่มี error                         | ⬜     |
| REG-07 | BUG-007: Payroll `department_id` JOIN      | คำนวณเงินเดือน                   | ไม่มี SQL error (unknown column)                | ⬜     |
| REG-08 | BUG-008: Payroll `status = ACTIVE`         | คำนวณเงินเดือน → ดู records      | แสดงพนักงาน FULL_TIME/PROBATION (ไม่ใช่ ACTIVE) | ⬜     |
| REG-09 | BUG-009: Payroll `ot_type_id` missing      | คำนวณ OT ใน Payroll → ดู OT Pay  | ไม่มี SQL error, คำนวณ OT ถูก                   | ⬜     |
| REG-10 | BUG-010: PayBonus `department_id` JOIN     | คำนวณ Bonus Score                | สำเร็จ ไม่มี SQL error                          | ⬜     |
| REG-11 | BUG-011: Companies ไม่โหลด (nested)        | เปิดหน้า Settings → Companies    | แสดงข้อมูลบริษัท 4 แถว                          | ⬜     |
| REG-12 | BUG-012: `window.confirm` browser block    | กดลบ/ปฏิเสธที่ต้อง confirm       | แสดง MUI Dialog (ไม่ใช่ browser confirm)        | ⬜     |
| REG-13 | BUG-013: PayBonus `evaluation_date`        | คำนวณ Bonus → ดูคะแนน evaluation | คำนวณจาก `evaluation_month` ถูกต้อง             | ⬜     |
| REG-14 | BUG-014: PayBonus `time_logs` missing cols | คำนวณ Bonus → ดูคะแนน attendance | คำนวณจาก raw `scan_time` vs `shift.start_time`  | ⬜     |

---

## 7. B5: Cross-Module Integration Tests

| ID     | Priority | Test Case                        | Steps                                                  | Expected Result                                              | Status |
| :----- | :------- | :------------------------------- | :----------------------------------------------------- | :----------------------------------------------------------- | :----- |
| INT-01 | 🔴 P1    | OT → Payroll                     | 1. สร้าง OT Request (APPROVED) 2. คำนวณ Payroll        | Payroll records มี OT_PAY item ตรง OT hours                  | ⬜     |
| INT-02 | 🔴 P1    | Leave (ไม่ได้เงิน) → Payroll หัก | 1. สร้าง Leave `is_paid=0` (APPROVED) 2. คำนวณ Payroll | หักเงินวันลา (DAILY type: base÷30 × จำนวนวัน)                | ⬜     |
| INT-03 | 🔴 P1    | Advance → Payroll หัก            | 1. สร้าง Advance (APPROVED) 2. คำนวณ Payroll           | SALARY_ADVANCE item ตรงจำนวนเงิน                             | ⬜     |
| INT-04 | 🔴 P1    | Loan → Payroll หัก               | 1. สร้าง Loan (ACTIVE) 2. คำนวณ Payroll                | LOAN_PAYMENT item ตาม monthly_payment + loan_payments record | ⬜     |
| INT-05 | 🟡 P2    | Evaluation → Bonus Score         | 1. สร้าง Evaluation 12 เดือน 2. คำนวณ Bonus            | evaluation_score = avg(weighted_score) ÷ 5 × 70              | ⬜     |
| INT-06 | 🟡 P2    | Time Logs → Bonus Attendance     | 1. พนักงานสายหลายวัน 2. คำนวณ Bonus                    | attendance_score = 30 - (late_count × 0.5)                   | ⬜     |
| INT-07 | 🟡 P2    | Leave Approve → Quota Used       | 1. ลาป่วย 2 วัน 2. อนุมัติ                             | leave_quotas.used_days += 2                                  | ⬜     |
| INT-08 | 🟡 P2    | Cross-company Visibility         | User SDR → เข้าถึง HRM employees                       | เห็นเฉพาะพนักงาน SDR (ไม่เห็น SXD/SPD)                       | ⬜     |

---

## 8. Test Execution Tracker

### สรุปภาพรวม

| Module          | Total   | ⬜ Not Started | ✅ Passed | ❌ Failed | ⚠️ Partial |
| :-------------- | :------ | :------------- | :-------- | :-------- | :--------- |
| B1: Core        | 28      | 28             | 0         | 0         | 0          |
| B2: HRM         | 32      | 32             | 0         | 0         | 0          |
| B3: Payroll     | 30      | 30             | 0         | 0         | 0          |
| B4: Regression  | 14      | 14             | 0         | 0         | 0          |
| B5: Integration | 8       | 8              | 0         | 0         | 0          |
| **รวม**         | **112** | **112**        | **0**     | **0**     | **0**      |

### วิธีใช้เอกสารนี้

1. **TESTER** ทำทีละ Module (B1 → B2 → B3 → B4 → B5)
2. ทดสอบ **P1 ก่อน** ภายในแต่ละ Module
3. อัปเดตช่อง **Status** เป็น ✅/❌/⚠️
4. ถ้า ❌ → จด Bug ID + รายละเอียด + screenshot ส่ง DEV
5. DEV แก้ → TESTER ทดสอบซ้ำ → ✅

### หมายเหตุ

- ⚠️ **Payroll Period Lock:** ยังไม่มี guard ป้องกันแก้ item หลัง FINALIZED (OQ #5 ใน TSD_03)
- ⚠️ **File size validation:** ยัง ไม่มี mime type / size validation สำหรับ document upload (OQ #4 ใน TSD_02)
- ⚠️ **Tax Calculation:** ยังไม่มี rules จริง (OQ #3 ใน TSD_03) — ทดสอบ field `tax_auto_amount` ว่ามีค่า
