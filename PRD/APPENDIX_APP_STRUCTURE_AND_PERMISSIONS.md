# สรุป core_app_structure + core_level_permissions (ข้อมูลตัวอย่าง)

**อ้างอิง:** PRD #00 Section 7, PRD #01–#05
**วันที่:** 2026-03-05

> เอกสารนี้รวมเมนู/หน้า/Actions ทั้งหมดจากทุก PRD + กำหนดสิทธิ์แต่ละ Level

---

## 1. core_app_structure (โครงสร้างเมนู)

> **หลักการ:** `parent_id = NULL` = System Group, มีค่า = Page ภายใต้ System นั้น
> **type:** SYSTEM = กลุ่มระบบ, PAGE = หน้า, SECTION = หน้าย่อย

### 1.1 ข้อมูลตัวอย่าง

| id     | parent_id | code                | name_th                    | type   | sort_order | PRD      |
| :----- | :-------- | :------------------ | :------------------------- | :----- | :--------- | :------- |
| **1**  | NULL      | `CORE`              | ระบบหลัก                   | SYSTEM | 1          | #01      |
| 2      | 1         | `CORE_DASHBOARD`    | Dashboard                  | PAGE   | 1          | #01 §5   |
| 3      | 1         | `CORE_REQUEST`      | แบบฟอร์มคำขอ               | PAGE   | 2          | #01 §7   |
| 4      | 1         | `CORE_PROFILE`      | ข้อมูลส่วนตัว              | PAGE   | 3          | #01 §8   |
|        |           |                     |                            |        |            |          |
| **10** | NULL      | `HRM`               | ระบบ HR                    | SYSTEM | 2          | #02      |
| 11     | 10        | `HRM_EMPLOYEE`      | จัดการพนักงาน              | PAGE   | 1          | #02 §2   |
| 12     | 10        | `HRM_TIME_REPORT`   | รายงานเวลา                 | PAGE   | 2          | #02 §3   |
| 13     | 10        | `HRM_SCHEDULE`      | ตารางกะ / วันหยุด          | PAGE   | 3          | #02 §4-5 |
| 14     | 10        | `HRM_LEAVE`         | การลา / สิทธิ์ลา           | PAGE   | 4          | #02 §6-7 |
| 15     | 10        | `HRM_APPROVAL`      | อนุมัติคำร้อง              | PAGE   | 5          | #02 §8   |
| 16     | 10        | `HRM_EVALUATION`    | ประเมินผลงาน               | PAGE   | 6          | #02 §12  |
| 17     | 10        | `HRM_REPORT`        | รายงานสรุป HR              | PAGE   | 7          | #02      |
|        |           |                     |                            |        |            |          |
| **20** | NULL      | `PAY`               | ระบบเงินเดือน              | SYSTEM | 3          | #03      |
| 21     | 20        | `PAY_CALCULATION`   | คำนวณเงินเดือน             | PAGE   | 1          | #03 §3-7 |
| 22     | 20        | `PAY_PAYSLIP`       | สลิปเงินเดือน              | PAGE   | 2          | #03 §10  |
| 23     | 20        | `PAY_ADVANCE`       | เบิกเงินเดือนล่วงหน้า      | PAGE   | 3          | #03 §8   |
| 24     | 20        | `PAY_LOAN`          | กู้ยืม                     | PAGE   | 4          | #03 §9   |
| 25     | 20        | `PAY_DOCUMENT`      | เอกสาร (หนังสือรับรอง ฯลฯ) | PAGE   | 5          | #03 §11  |
| 26     | 20        | `PAY_BONUS`         | โบนัส                      | PAGE   | 6          | #03 §12  |
| 27     | 20        | `PAY_REPORT`        | รายงานสรุปเงินเดือน        | PAGE   | 7          | #03      |
|        |           |                     |                            |        |            |          |
| **30** | NULL      | `ACC`               | ระบบบัญชี                  | SYSTEM | 4          | #05      |
| 31     | 30        | `ACC_MAIN`          | ระบบบัญชี (ACC)            | PAGE   | 1          | #05 §5   |
|        |           |                     |                            |        |            |          |
| **40** | NULL      | `SETTINGS`          | ตั้งค่า                    | SYSTEM | 5          | #04      |
| 41     | 40        | `SET_COMPANY`       | ข้อมูลบริษัท               | PAGE   | 1          | #04 §3   |
| 42     | 40        | `SET_BRANCH`        | ข้อมูลสาขา                 | PAGE   | 2          | #04 §4   |
| 43     | 40        | `SET_ORG`           | โครงสร้างองค์กร            | PAGE   | 3          | #04 §5   |
| 44     | 40        | `SET_PERMISSION`    | สิทธิ์การเข้าถึง           | PAGE   | 4          | #04 §6   |
| 45     | 40        | `SET_APP_STRUCTURE` | โครงสร้างเมนู & Actions    | PAGE   | 5          | #04 §7   |
| 46     | 40        | `SET_MASTER_HR`     | Master Data — HR           | PAGE   | 6          | #04 §8   |
| 47     | 40        | `SET_MASTER_PAY`    | Master Data — Payroll      | PAGE   | 7          | #04 §9   |
| 48     | 40        | `SET_MASTER_ACC`    | Master Data — ACC          | PAGE   | 8          | #04 §12  |
| 49     | 40        | `SET_CONFIG`        | ค่าคงที่ระบบ               | PAGE   | 9          | #04 §10  |
| 50     | 40        | `SET_ADMIN`         | ผู้ดูแลระบบ                | PAGE   | 10         | #04 §11  |

### 1.2 โครงสร้าง Tree

```
├── CORE (ระบบหลัก) ──────────────── ทุกคนเห็น
│   ├── CORE_DASHBOARD               Dashboard
│   ├── CORE_REQUEST                  แบบฟอร์มคำขอ
│   └── CORE_PROFILE                  ข้อมูลส่วนตัว
│
├── HRM (ระบบ HR) ────────────────── HR / IT / หัวหน้า / ผู้บริหาร
│   ├── HRM_EMPLOYEE                  จัดการพนักงาน
│   ├── HRM_TIME_REPORT               รายงานเวลา
│   ├── HRM_SCHEDULE                  ตารางกะ / วันหยุด
│   ├── HRM_LEAVE                     การลา / สิทธิ์ลา
│   ├── HRM_APPROVAL                  อนุมัติคำร้อง
│   ├── HRM_EVALUATION                ประเมินผลงาน
│   └── HRM_REPORT                    รายงานสรุป HR
│
├── PAY (ระบบเงินเดือน) ──────────── HR / ผู้บริหาร (พนง.บางหน้า)
│   ├── PAY_CALCULATION               คำนวณเงินเดือน
│   ├── PAY_PAYSLIP                   สลิปเงินเดือน
│   ├── PAY_ADVANCE                   เบิกเงินเดือนล่วงหน้า
│   ├── PAY_LOAN                      กู้ยืม
│   ├── PAY_DOCUMENT                  เอกสาร
│   ├── PAY_BONUS                     โบนัส
│   └── PAY_REPORT                    รายงานสรุปเงินเดือน
│
├── ACC (ระบบบัญชี) ──────────────── ฝ่ายบัญชี / ผู้บริหาร
│   └── ACC_MAIN                      ระบบบัญชี (iframe)
│
└── SETTINGS (ตั้งค่า) ──────────── is_admin=1 (+ SET_APP_STRUCTURE ผ่านสิทธิ์)
    ├── SET_COMPANY                   ข้อมูลบริษัท
    ├── SET_BRANCH                    ข้อมูลสาขา
    ├── SET_ORG                       โครงสร้างองค์กร
    ├── SET_PERMISSION                สิทธิ์การเข้าถึง
    ├── SET_APP_STRUCTURE             โครงสร้างเมนู & Actions
    ├── SET_MASTER_HR                 Master Data — HR
    ├── SET_MASTER_PAY                Master Data — Payroll
    ├── SET_MASTER_ACC                Master Data — ACC
    ├── SET_CONFIG                    ค่าคงที่ระบบ
    └── SET_ADMIN                     ผู้ดูแลระบบ
```

---

## 2. core_app_actions (ปุ่ม/Actions ตัวอย่าง)

> ตัวอย่างเฉพาะ Actions สำคัญ — ข้อมูลเต็มอยู่ใน PRD แต่ละตัว

| id  | page_id              | code                      | name_th                       | PRD     |
| :-- | :------------------- | :------------------------ | :---------------------------- | :------ |
| 1   | 25 (PAY_DOCUMENT)    | `doc_cert_work_request`   | ร้องขอ หนังสือรับรองการทำงาน  | #03 §11 |
| 2   | 25 (PAY_DOCUMENT)    | `doc_cert_salary_request` | ร้องขอ หนังสือรับรองเงินเดือน | #03 §11 |
| 3   | 25 (PAY_DOCUMENT)    | `doc_cert_confirm`        | ยืนยัน หนังสือรับรอง          | #03 §11 |
| 4   | 25 (PAY_DOCUMENT)    | `doc_contract_request`    | ร้องขอ สัญญาจ้าง              | #03 §11 |
| 5   | 25 (PAY_DOCUMENT)    | `doc_contract_confirm`    | ยืนยัน สัญญาจ้าง              | #03 §11 |
| 6   | 25 (PAY_DOCUMENT)    | `doc_resign_request`      | ร้องขอ ใบลาออก                | #03 §11 |
| 7   | 25 (PAY_DOCUMENT)    | `doc_resign_confirm`      | ยืนยัน ใบลาออก                | #03 §11 |
| 8   | 25 (PAY_DOCUMENT)    | `doc_penalty_request`     | ร้องขอ หนังสือแจ้งโทษ         | #03 §11 |
| 9   | 25 (PAY_DOCUMENT)    | `doc_penalty_confirm`     | ยืนยัน หนังสือแจ้งโทษ         | #03 §11 |
| 10  | 25 (PAY_DOCUMENT)    | `doc_download`            | ดาวน์โหลดเอกสาร               | #03 §11 |
| 11  | 21 (PAY_CALCULATION) | `pay_calc_run`            | รันคำนวณเงินเดือน             | #03 §7  |
| 12  | 21 (PAY_CALCULATION) | `pay_calc_close`          | ปิดรอบเงินเดือน               | #03 §7  |
| 13  | 21 (PAY_CALCULATION) | `pay_calc_reopen`         | เปิดรอบเงินเดือนใหม่          | #03 §7  |

---

## 3. core_level_permissions (สิทธิ์ Level ต่อ Page)

> **หลักการ:** มี record = เห็นหน้า / ไม่มี = ไม่เห็น
> **Level Score:** 1=สูงสุด(MD) → 8=ต่ำสุด(Jr.)

### 3.1 ตาราง Level (อ้างอิง PRD #00 Section 2.3)

| level_id | level_score | Role          | name            |
| :------- | :---------- | :------------ | :-------------- |
| 1        | 1           | ผู้บริหาร     | MD              |
| 2        | 1           | ผู้บริหาร     | CFO             |
| 3        | 2           | รองผู้บริหาร  | Asst MD         |
| 4        | 2           | รองผู้บริหาร  | GM              |
| 5        | 3           | ผู้จัดการ     | Sale Director   |
| 6        | 3           | ผู้จัดการ     | Head of IT      |
| 7        | 4           | ผู้จัดการ     | HR Manager      |
| 8        | 4           | ผู้จัดการ     | Acc Manager     |
| 9        | 4           | ผู้จัดการ     | Area Manager    |
| 10       | 5           | หัวหน้างาน    | Branch Manager  |
| 11       | 5           | หัวหน้างาน    | Sale Manager    |
| 12       | 7           | พนักงาน       | Programmer      |
| 13       | 7           | พนักงาน       | Sales Executive |
| 14       | 7           | พนักงาน       | HR Officer      |
| 15       | 7           | พนักงาน       | Courier         |
| 16       | 7           | พนักงาน       | พนักงานบัญชี    |
| 17       | 8           | พนักงานทั่วไป | Jr. Staff       |

### 3.2 Matrix: Level × Page (สิทธิ์ Default)

> ✅ = มี record ใน `core_level_permissions` (เห็นหน้า)
> ❌ = ไม่มี record (ไม่เห็น)
> 🔵 = เห็นแต่ข้อมูลจำกัด (เฉพาะตัวเอง)
> **SETTINGS** ทั้งหมดควบคุมโดย `is_admin` ไม่ใช่ level_permissions

#### ระบบหลัก (CORE) — PRD #01

| Page             | L1 MD | L2 GM | L3 Director | L4 Manager | L5 Supervisor | L7 Staff | L8 Jr. |
| :--------------- | :---: | :---: | :---------: | :--------: | :-----------: | :------: | :----: |
| `CORE_DASHBOARD` |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ✅    |   ✅   |
| `CORE_REQUEST`   |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ✅    |   ✅   |
| `CORE_PROFILE`   |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ✅    |   ✅   |

> **ทุกคนเห็นระบบหลัก** — แต่ข้อมูลที่แสดงต่างกันตาม Level (PRD #01 §5)

#### ระบบ HR (HRM) — PRD #02

| Page              | L1 MD | L2 GM | L3 Director | L4 Manager | L5 Supervisor | L7 Staff | L8 Jr. |
| :---------------- | :---: | :---: | :---------: | :--------: | :-----------: | :------: | :----: |
| `HRM_EMPLOYEE`    |  ✅   |  ✅   |     ✅      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `HRM_TIME_REPORT` |  ✅   |  ✅   |     ✅      |  ✅ (HR)   |      ✅       |    ❌    |   ❌   |
| `HRM_SCHEDULE`    |  ✅   |  ✅   |     ❌      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `HRM_LEAVE`       |  ✅   |  ✅   |     ✅      |  ✅ (HR)   |      ✅       |    ❌    |   ❌   |
| `HRM_APPROVAL`    |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ❌    |   ❌   |
| `HRM_EVALUATION`  |  ✅   |  ✅   |     ✅      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `HRM_REPORT`      |  ✅   |  ✅   |     ✅      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |

> **หมายเหตุ:**
>
> - **(HR)** = Level 4 ที่เห็นคือเฉพาะตำแหน่ง HR Manager — Acc Manager ไม่เห็น
> - ในทางปฏิบัติ อาจกำหนดสิทธิ์ผ่าน **User Override** แทนที่จะเปิดทุก Level 4
> - หัวหน้างาน (L5) เห็นข้อมูลเฉพาะลูกน้องในสาขาตัวเอง

#### ระบบเงินเดือน (PAY) — PRD #03

| Page              | L1 MD | L2 GM | L3 Director | L4 Manager | L5 Supervisor | L7 Staff | L8 Jr. |
| :---------------- | :---: | :---: | :---------: | :--------: | :-----------: | :------: | :----: |
| `PAY_CALCULATION` |  ✅   |  ❌   |     ❌      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `PAY_PAYSLIP`     |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    🔵    |   🔵   |
| `PAY_ADVANCE`     |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ✅    |   ✅   |
| `PAY_LOAN`        |  ✅   |  ❌   |     ❌      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `PAY_DOCUMENT`    |  ✅   |  ✅   |     ✅      |     ✅     |      ✅       |    ✅    |   ✅   |
| `PAY_BONUS`       |  ✅   |  ❌   |     ❌      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |
| `PAY_REPORT`      |  ✅   |  ✅   |     ❌      |  ✅ (HR)   |      ❌       |    ❌    |   ❌   |

> **หมายเหตุ:**
>
> - 🔵 **PAY_PAYSLIP** สำหรับ Staff/Jr. = ดูได้เฉพาะสลิปตัวเอง (Backend กรอง)
> - **PAY_ADVANCE** = ทุกคนเห็น เพราะพนักงานส่งคำขอเบิกล่วงหน้าได้
> - **PAY_DOCUMENT** = ทุกคนเห็น เพราะพนักงานขอหนังสือรับรองได้ (ปุ่มภายในควบคุมโดย Action-Based Permission)
> - **PAY_CALCULATION, PAY_LOAN, PAY_BONUS** = เฉพาะผู้บริหารและ HR

#### ระบบบัญชี (ACC) — PRD #05

| Page       | L1 MD | L2 GM | L3 Director | L4 Manager | L5 Supervisor |  L7 Staff  | L8 Jr. |
| :--------- | :---: | :---: | :---------: | :--------: | :-----------: | :--------: | :----: |
| `ACC_MAIN` |  ✅   |  ❌   |     ❌      |  ✅ (Acc)  |      ❌       | ✅ (บัญชี) |   ❌   |

> **หมายเหตุ:**
>
> - ✅ (Acc) = Level 4 เฉพาะ Acc Manager
> - ✅ (บัญชี) = Level 7 เฉพาะพนักงานบัญชี
> - สิทธิ์ภายใน ACC จัดการโดยระบบ ACC เอง (ไม่ใช่ core_level_permissions)

#### ตั้งค่า (SETTINGS) — PRD #04

| Page                                                      | ควบคุมโดย                                                                      |
| :-------------------------------------------------------- | :----------------------------------------------------------------------------- |
| `SET_COMPANY` — `SET_ADMIN` (ทุกหน้ายกเว้น APP_STRUCTURE) | `core_users.is_admin = 1` เท่านั้น                                             |
| `SET_APP_STRUCTURE`                                       | `is_admin = 1` **หรือ** Admin ตั้งค่าสิทธิ์ให้ผ่าน core_level/user_permissions |

> **Settings ไม่ใช้ core_level_permissions เป็นหลัก** — ใช้ `is_admin` flag โดยตรง (ยกเว้น SET_APP_STRUCTURE)

### 3.3 ข้อมูลตัวอย่าง `core_level_permissions`

> แสดงเฉพาะบางแถว — ข้อมูลจริงจะมีทุก Level × ทุก Page ที่เห็น

| id  | level_id        | app_structure_id     | หมายถึง                       |
| :-- | :-------------- | :------------------- | :---------------------------- |
| 1   | 1 (MD)          | 2 (CORE_DASHBOARD)   | MD เห็น Dashboard             |
| 2   | 1 (MD)          | 3 (CORE_REQUEST)     | MD เห็น แบบฟอร์มคำขอ          |
| 3   | 1 (MD)          | 4 (CORE_PROFILE)     | MD เห็น ข้อมูลส่วนตัว         |
| 4   | 1 (MD)          | 11 (HRM_EMPLOYEE)    | MD เห็น จัดการพนักงาน         |
| 5   | 1 (MD)          | 12 (HRM_TIME_REPORT) | MD เห็น รายงานเวลา            |
| 6   | 1 (MD)          | 21 (PAY_CALCULATION) | MD เห็น คำนวณเงินเดือน        |
| 7   | 1 (MD)          | 31 (ACC_MAIN)        | MD เห็น ระบบบัญชี             |
| ... | ...             | ...                  | ...                           |
| 50  | 12 (Programmer) | 2 (CORE_DASHBOARD)   | Programmer เห็น Dashboard     |
| 51  | 12 (Programmer) | 3 (CORE_REQUEST)     | Programmer เห็น แบบฟอร์ม      |
| 52  | 12 (Programmer) | 4 (CORE_PROFILE)     | Programmer เห็น Profile       |
| 53  | 12 (Programmer) | 22 (PAY_PAYSLIP)     | Programmer เห็น สลิปตัวเอง    |
| 54  | 12 (Programmer) | 23 (PAY_ADVANCE)     | Programmer เห็น เบิกล่วงหน้า  |
| 55  | 12 (Programmer) | 25 (PAY_DOCUMENT)    | Programmer เห็น เอกสาร        |
| ... | ...             | ...                  | ...                           |
| 80  | 14 (HR Officer) | 2 (CORE_DASHBOARD)   | HR Officer เห็น Dashboard     |
| 81  | 14 (HR Officer) | 11 (HRM_EMPLOYEE)    | HR Officer เห็น จัดการพนักงาน |
| 82  | 14 (HR Officer) | 12 (HRM_TIME_REPORT) | HR Officer เห็น รายงานเวลา    |
| 83  | 14 (HR Officer) | 22 (PAY_PAYSLIP)     | HR Officer เห็น สลิปเงินเดือน |

> **หมายเหตุ:** HR Officer (Level 7) ต้อง **User Override** เพิ่มเติมเพื่อเห็นหน้า HR บางหน้า เพราะ Level 7 Default ไม่เห็น HR — แต่ถ้า Admin กำหนดให้ HR Officer ทุกคนเห็น สามารถเพิ่ม record ที่ `core_level_permissions` ให้ level_id = 14 (HR Officer) ได้โดยตรง

---

## 4. core_level_action_permissions (สิทธิ์ Level ต่อ Action ตัวอย่าง)

> ตัวอย่างจาก PRD #03 Section 11 (เอกสาร)

| level_id        | action_id | action_code               | Level      | เห็นปุ่ม                         |
| :-------------- | :-------- | :------------------------ | :--------- | :------------------------------- |
| 7 (HR Manager)  | 1         | `doc_cert_work_request`   | HR Manager | ✅ ร้องขอ หนังสือรับรองการทำงาน  |
| 7 (HR Manager)  | 3         | `doc_cert_confirm`        | HR Manager | ✅ ยืนยัน หนังสือรับรอง          |
| 7 (HR Manager)  | 4         | `doc_contract_request`    | HR Manager | ✅ ร้องขอ สัญญาจ้าง              |
| 7 (HR Manager)  | 7         | `doc_resign_confirm`      | HR Manager | ✅ ยืนยัน ใบลาออก                |
| 7 (HR Manager)  | 8         | `doc_penalty_request`     | HR Manager | ✅ ร้องขอ หนังสือแจ้งโทษ         |
| 12 (Programmer) | 1         | `doc_cert_work_request`   | Staff      | ✅ ร้องขอ หนังสือรับรองการทำงาน  |
| 12 (Programmer) | 2         | `doc_cert_salary_request` | Staff      | ✅ ร้องขอ หนังสือรับรองเงินเดือน |
| 12 (Programmer) | 6         | `doc_resign_request`      | Staff      | ✅ ร้องขอ ใบลาออก                |
| 12 (Programmer) | 10        | `doc_download`            | Staff      | ✅ ดาวน์โหลดเอกสาร (ตัวเอง)      |
| 1 (MD)          | 5         | `doc_contract_confirm`    | ผู้บริหาร  | ✅ ยืนยัน สัญญาจ้าง              |
| 1 (MD)          | 9         | `doc_penalty_confirm`     | ผู้บริหาร  | ✅ ยืนยัน หนังสือแจ้งโทษ         |

---

## 5. สรุป

### จำนวนข้อมูล

| ตาราง                           | จำนวน (ตัวอย่าง)                                     |
| :------------------------------ | :--------------------------------------------------- |
| `core_app_structure`            | ~26 records (5 System + 21 Pages)                    |
| `core_app_actions`              | ~13+ records (ตัวอย่างเอกสาร) + เพิ่มเติมจากทุก Page |
| `core_level_permissions`        | ~100+ records (17 Levels × ~6 Pages เฉลี่ย)          |
| `core_level_action_permissions` | ~50+ records                                         |

### การดูแลรักษา

- **เพิ่มหน้าใหม่:** Insert ใน `core_app_structure` → กำหนดสิทธิ์ใน `core_level_permissions`
- **เพิ่ม Action ใหม่:** Insert ใน `core_app_actions` → กำหนดสิทธิ์ใน `core_level_action_permissions`
- **จัดการทั้งหมดผ่าน:** หน้าตั้งค่า PRD #04 Section 6 (Permission Management — 3 มุมมอง)

---

## 6. เอกสารอ้างอิง

| เอกสาร                                  | ใช้ในส่วน                             |
| :-------------------------------------- | :------------------------------------ |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md` | Level, Roles, Permission Architecture |
| `PRD/PRD_01_MAIN_SYSTEM.md`             | CORE pages                            |
| `PRD/PRD_02_HR_SYSTEM.md`               | HRM pages                             |
| `PRD/PRD_03_PAYROLL_SYSTEM.md`          | PAY pages + Actions                   |
| `PRD/PRD_04_SETTINGS_SYSTEM.md`         | SETTINGS pages                        |
| `PRD/PRD_05_ACC_SYSTEM.md`              | ACC pages                             |
