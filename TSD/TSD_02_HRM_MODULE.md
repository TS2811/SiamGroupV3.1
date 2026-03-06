# TSD_02: HRM Module (โครงหลัก)

# Technical Specification Document — Skeleton

> **Version:** 0.1 Skeleton
> **Status:** 🏗️ โครงหลัก (Phase 2)
> **Last Updated:** 2026-03-05
> **PRD Reference:** PRD #02 (HR System)
> **Dependencies:** TSD_01 (Core Infrastructure)

---

## 1. ขอบเขต (Scope)

ระบบ HR Management สำหรับฝ่าย HR, หัวหน้างาน และผู้บริหาร:

- จัดการข้อมูลพนักงาน (CRUD + เอกสาร)
- รายงานเวลาทำงาน (Time Report — Calendar Grid 21-20 + Daily Breakdown)
- จัดการตารางกะ (Work Schedule — FIXED/FLEXIBLE, เสาร์เว้นเสาร์)
- จัดการวันหยุด (Holiday + Personal Off Days)
- จัดการสิทธิ์ลา (Leave Quota per Year)
- อนุมัติคำร้อง (Leave, OT, Time Correction, Shift Swap)
- รายงานสรุป (Summary Reports)
- Dashboard ฝั่งบริหาร
- ระบบประเมินผลงาน (Performance Evaluation — 5 หมวด, คะแนน 1-5)

### ผู้ใช้งาน

| กลุ่ม         | การเข้าถึง                          |
| :------------ | :---------------------------------- |
| HR            | เข้าถึงทุกเมนู HR                   |
| IT            | เข้าถึงทุกเมนู (`is_cross_company`) |
| หัวหน้า       | ตาม `core_level_permissions`        |
| พนักงานทั่วไป | ❌ ไม่มีสิทธิ์เข้าเมนู HR           |

---

## 2. Database Schema (ตารางหลัก)

### 2.1 ตาราง HRM ที่มีอยู่

| #   | ตาราง                          | คำอธิบาย                                                    |
| :-- | :----------------------------- | :---------------------------------------------------------- |
| 1   | `hrm_employees`                | ข้อมูลพนักงาน (FK → core_users, core_levels, core_branches) |
| 2   | `hrm_time_logs`                | บันทึกเวลา IN/OUT (มี fields ONSITE/OFFSITE จาก TSD_01)     |
| 3   | `hrm_work_schedules`           | ตารางกะรายคน (7 วัน × week_pattern)                         |
| 4   | `hrm_holidays`                 | วันหยุดประจำปี/บริษัท                                       |
| 5   | `hrm_personal_off_days`        | วันหยุดส่วนตัว (HR/หัวหน้าสาขาตั้ง)                         |
| 6   | `hrm_leave_types`              | ประเภทลา (ลาป่วย, ลากิจ, ลาพักร้อน, ลาคลอด, etc.)           |
| 7   | `hrm_employee_leave_quotas`    | โควตาลารายปี (quota_days, used_days)                        |
| 8   | `hrm_leave_requests`           | คำร้องลา — เพิ่ม `is_paid` field                            |
| 9   | `hrm_ot_requests`              | คำร้อง OT — เปลี่ยน ENUM → FK `ot_type_id`                  |
| 10  | `hrm_time_correction_requests` | คำร้องแก้เวลา                                               |
| 11  | `hrm_shift_swap_requests`      | คำร้องสลับกะ                                                |
| 12  | `hrm_user_daily_remarks`       | Remark รายวัน (HR กรอก)                                     |
| 13  | `hrm_employee_documents`       | เอกสารพนักงาน (สัญญาจ้าง, บัตร ปชช., ใบขับขี่, etc.)        |

### 2.2 ตารางใหม่ (จาก PRD #02)

| #   | ตาราง                        | คำอธิบาย                                     |
| :-- | :--------------------------- | :------------------------------------------- |
| 14  | `hrm_evaluation_criteria` 🆕 | หมวดการประเมิน (5 หมวด + น้ำหนัก)            |
| 15  | `hrm_evaluations` 🆕         | ผลประเมินรายเดือน (UNIQUE: employee + month) |
| 16  | `hrm_evaluation_scores` 🆕   | คะแนนแต่ละหมวด (1-5)                         |

### 2.3 Schema Changes

```sql
-- เพิ่ม is_paid ใน hrm_leave_requests
ALTER TABLE hrm_leave_requests
  ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 1
  COMMENT '1=ได้รับค่าจ้าง, 0=ไม่ได้รับค่าจ้าง'
  AFTER is_urgent;

-- ลบ is_paid จาก hrm_leave_types
ALTER TABLE hrm_leave_types DROP COLUMN is_paid;

-- เปลี่ยน ot_type จาก ENUM → FK
ALTER TABLE hrm_ot_requests
  DROP COLUMN ot_type,
  ADD COLUMN ot_type_id INT NOT NULL COMMENT 'FK → pay_ot_types.id';
```

---

## 3. API Endpoints (หลัก)

> ทุก API ใช้ prefix `/api/hrm/`

### 3.1 Employee Management

| Method   | Path                                        | คำอธิบาย                                                 |
| :------- | :------------------------------------------ | :------------------------------------------------------- |
| `GET`    | `/api/hrm/employees`                        | รายชื่อพนักงาน (+ Filter: company, branch, dept, status) |
| `GET`    | `/api/hrm/employees/{id}`                   | รายละเอียดพนักงาน                                        |
| `POST`   | `/api/hrm/employees`                        | เพิ่มพนักงานใหม่ (สร้าง core_users + hrm_employees)      |
| `PUT`    | `/api/hrm/employees/{id}`                   | แก้ไขพนักงาน                                             |
| `POST`   | `/api/hrm/employees/{id}/documents`         | อัปโหลดเอกสาร                                            |
| `DELETE` | `/api/hrm/employees/{id}/documents/{docId}` | ลบเอกสาร                                                 |

### 3.2 Time Report

| Method | Path                                   | คำอธิบาย                        |
| :----- | :------------------------------------- | :------------------------------ |
| `GET`  | `/api/hrm/time-report/calendar`        | Calendar Grid (21-20)           |
| `GET`  | `/api/hrm/time-report/daily/{empId}`   | Daily Breakdown รายบุคคล        |
| `GET`  | `/api/hrm/time-report/summary/{empId}` | สรุปรายบุคคล (สาย, ขาด, ลา, OT) |
| `PUT`  | `/api/hrm/time-report/remarks`         | บันทึก/แก้ Remark รายวัน        |

### 3.3 Schedule & Holiday

| Method         | Path                         | คำอธิบาย                     |
| :------------- | :--------------------------- | :--------------------------- |
| `GET/POST/PUT` | `/api/hrm/schedules`         | จัดการตารางกะ                |
| `POST`         | `/api/hrm/schedules/bulk`    | ตั้งกะ Bulk (หลายคนพร้อมกัน) |
| `CRUD`         | `/api/hrm/holidays`          | จัดการวันหยุด                |
| `POST`         | `/api/hrm/holidays/import`   | Import จาก Excel             |
| `CRUD`         | `/api/hrm/personal-off-days` | วันหยุดส่วนตัว               |

### 3.4 Leave Management

| Method         | Path                         | คำอธิบาย                   |
| :------------- | :--------------------------- | :------------------------- |
| `CRUD`         | `/api/hrm/leave-types`       | จัดการประเภทลา             |
| `GET/POST/PUT` | `/api/hrm/leave-quotas`      | จัดการโควตาลารายปี         |
| `POST`         | `/api/hrm/leave-quotas/bulk` | ตั้ง Bulk ตาม แผนก/ตำแหน่ง |

### 3.5 Request Approval (HR Side)

| Method | Path                                  | คำอธิบาย                                         |
| :----- | :------------------------------------ | :----------------------------------------------- |
| `GET`  | `/api/hrm/approvals`                  | รายการคำร้องทั้งหมด (Filter: type, status, date) |
| `PUT`  | `/api/hrm/approvals/{id}/approve`     | อนุมัติ                                          |
| `PUT`  | `/api/hrm/approvals/{id}/reject`      | ปฏิเสธ                                           |
| `PUT`  | `/api/hrm/approvals/{id}/force-leave` | บังคับเปลี่ยน Absent → ลา                        |

### 3.6 Performance Evaluation

| Method | Path                           | คำอธิบาย                  |
| :----- | :----------------------------- | :------------------------ |
| `CRUD` | `/api/hrm/evaluation-criteria` | จัดการหมวดประเมิน         |
| `GET`  | `/api/hrm/evaluations`         | รายการผลประเมิน           |
| `POST` | `/api/hrm/evaluations`         | บันทึกผลประเมิน (หัวหน้า) |
| `GET`  | `/api/hrm/evaluations/summary` | สรุปผลประเมิน (HR)        |
| `GET`  | `/api/hrm/evaluations/export`  | Export Excel/PDF          |

### 3.7 Summary Reports

| Method | Path                          | คำอธิบาย                                 |
| :----- | :---------------------------- | :--------------------------------------- |
| `GET`  | `/api/hrm/reports/employees`  | สรุปพนักงาน (จำนวน, แยกสถานะ)            |
| `GET`  | `/api/hrm/reports/ot`         | สรุป OT (ชั่วโมงรวม, แยกประเภท)          |
| `GET`  | `/api/hrm/reports/leave`      | สรุปการลา (แยกประเภท, คงเหลือ)           |
| `GET`  | `/api/hrm/reports/attendance` | สรุปการเข้าออก (สาย, ขาด, อัตรามาทำงาน%) |

---

## 4. Business Logic สำคัญ

### 4.1 กะเสาร์เว้นเสาร์

- `week_pattern` = `ODD` / `EVEN` สำหรับ `day_of_week = 6`
- คำนวณว่าเป็นสัปดาห์คี่/คู่ ของเดือน

### 4.2 สถานะวันทำงาน (Time Report)

```
ON_TIME  = Check-in ≤ schedule.start_time
LATE     = Check-in > schedule.start_time
ABSENT   = วันทำงาน + ไม่มี time_log + ไม่มีใบลา
ON_LEAVE = มี leave_request ที่ APPROVED
DAY_OFF  = วันหยุดประจำ / นักขัตฤกษ์ / personal off day
```

### 4.3 กฎมาสาย/ขาดงาน

- สายเกิน 15 นาที/ครั้ง → แจ้งเตือน HR
- สายรวมเกิน 30 นาที/เดือน → แจ้งเตือน HR
- ขาดงาน = บังคับหักเป็นลา (HR ตั้งค่า)

### 4.4 Leave is_paid Logic

- `is_paid` ย้ายจาก leave_types → leave_requests
- ทุกประเภทลาเลือกได้: ลาโดยรับค่าจ้าง/ไม่รับค่าจ้าง

### 4.5 Performance Evaluation

- 5 หมวด × น้ำหนัก → คะแนนถ่วงน้ำหนัก
- UNIQUE: 1 ครั้ง/คน/เดือน
- แจ้งเตือน: วันที่ 1 (เปิดให้ประเมิน) + วันที่ 15 (เตือนซ้ำ)

---

## 5. Dependencies กับ TSD อื่น

| ใช้จาก TSD_01             | สิ่งที่ใช้                                   |
| :------------------------ | :------------------------------------------- |
| AuthMiddleware            | ตรวจ JWT ทุก API                             |
| PermissionMiddleware      | ตรวจสิทธิ์เข้าหน้า HR                        |
| Company/Branch Visibility | กรองข้อมูลตามสิทธิ์การเห็น                   |
| Approval Flow             | โครงสร้างอนุมัติ (manager_id chain)          |
| System Config             | ค่า LATE_THRESHOLD, LOGIN_MAX_ATTEMPTS, etc. |

| ส่งให้ TSD_03                | สิ่งที่ส่ง                              |
| :--------------------------- | :-------------------------------------- |
| hrm_ot_requests (APPROVED)   | ชั่วโมง OT สำหรับคำนวณเงิน              |
| hrm_leave_requests (is_paid) | ข้อมูลลาสำหรับหักเงินเดือน              |
| hrm_time_logs                | ข้อมูลเข้าออกสำหรับคำนวณเงินเดือนรายวัน |
| hrm_evaluations              | คะแนนประเมินสำหรับโบนัส                 |

---

## 6. TODO (Phase 3 — ต้องเพิ่มก่อน Code)

- [ ] SQL CREATE TABLE สำหรับ 3 ตารางประเมิน (hrm*evaluation*\*)
- [ ] Detailed API Request/Response Schema ทุก Endpoint
- [ ] Validation Rules per Field
- [ ] Excel Import Format Specification (Holiday)
- [ ] UI Wireframes สำหรับ Time Report (2-panel layout)
- [ ] Export Report Format (Excel/PDF)
- [ ] Notification Template (Email/Telegram)
