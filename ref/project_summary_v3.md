# สรุปโครงการพัฒนาระบบ SiamGroup V3 (Core & HR)

## 1. ภาพรวมโครงการ (Project Overview)

โครงการนี้มีวัตถุประสงค์เพื่อปรับปรุงโครงสร้างฐานข้อมูลจาก V2 (Legacy) มาเป็น V3 ที่มีความยืดหยุ่นสูง รองรับการขยายตัวในอนาคต โดยเน้นที่ 2 ส่วนหลักคือ **ระบบกลาง (Core)** และ **ระบบบริหารบุคคล (HRM)**

## 2. โครงสร้างระบบ (Architecture)

### 2.1 Core System (หัวใจสำคัญ)

ระบบถูกออกแบบโดยยึดหลัก **"Level Hierarchy"** (ระดับชั้น) แทนที่การผูกติดกับตำแหน่ง (Role) แบบตายตัว

- **Multi-Tenant Ready**: ทุกตารางเชื่อมโยงกับ `core_companies` และ `core_branches`
- **Level System (1-10)**:
  - **Level 1 (Highest)**: เจ้าของกิจการ/ผู้บริหารระดับสูง (เห็นข้อมูลทั้งหมด)
  - **Level 10 (Lowest)**: พนักงานทั่วไป (เห็นข้อมูลเฉพาะตนเอง)
- **Dynamic Permissions**: ควบคุมสิทธิ์ละเอียดระดับ "หน้าจอ" (Page) และ "การกระทำ" (Action: View/Edit/Approve) ผ่านตาราง `core_level_permissions`

### 2.2 HRM System (บริหารบุคคล)

ครอบคลุมงาน HR Operational ทั้งหมด:

- **Employee Data**: เก็บประวัติพนักงาน เงินเดือน และสถานะงาน
- **Attendance**: ลงเวลาเข้า-ออกงาน (GPS/Photo/Shift) รองรับกะกลางคืน
- **Leave Management**: ระบบลาออนไลน์พร้อมโควตารายปี
- **Request System**: ระบบคำร้องครบวงจร (OT, แก้เวลา, สลับวันหยุด)

## 3. รายละเอียดตารางและหน้าที่ (Table Dictionary)

### หมวดที่ 1: ระบบกลาง (Core System)

| ชื่อตาราง                | หน้าที่ (เก็บอะไร)                      | เพื่อทำอะไร                                         |
| :----------------------- | :-------------------------------------- | :-------------------------------------------------- |
| `core_companies`         | ข้อมูลบริษัทในเครือทั้งหมด              | ใช้ระบุสังกัดหลัก (Headquarter/Subsidiary)          |
| `core_branches`          | ข้อมูลสาขาของแต่ละบริษัท                | ใช้ระบุสถานที่ทำงานจริง และพิกัด GPS สำหรับเช็คอิน  |
| `core_departments`       | แผนกต่างๆ ในบริษัท                      | ใช้จัดกลุ่มพนักงานตามสายงาน                         |
| `core_roles`             | ชื่อตำแหน่งสมมติ (CEO, Manager, Driver) | ใช้บอกว่าเป็นใครในระบบ (Role Name)                  |
| `core_levels`            | ระดับขั้น (Level Score 1-10)            | **หัวใจสำคัญ** ใช้กำหนด Hierarchy ว่าใครใหญ่กว่าใคร |
| `core_app_structure`     | โครงสร้างเมนูและหน้าจอ (System/Page)    | ใช้สร้างเมนู Sidebar และเป็นตัวกลางในการ map สิทธิ์ |
| `core_level_permissions` | สิทธิ์การเข้าถึง (JSON Actions)         | จับคู่ Level กับหน้าจอ ว่าทำอะไรได้บ้าง (View/Edit) |
| `core_users`             | บัญชีผู้ใช้ (Username/Password/LineID)  | ใช้ Login เข้าสู่ระบบ และเก็บข้อมูลส่วนตัวพื้นฐาน   |

### หมวดที่ 2: ระบบบริหารบุคคล (HRM System)

| ชื่อตาราง                      | หน้าที่ (เก็บอะไร)                  | เพื่อทำอะไร                                                   |
| :----------------------------- | :---------------------------------- | :------------------------------------------------------------ |
| `hrm_employees`                | ประวัติการจ้างงาน, เงินเดือน, สถานะ | เชื่อม User เข้ากับ Company/Branch และกำหนด Level             |
| `hrm_work_schedules`           | ตารางกะการทำงาน (Revised)           | รองรับกะเช้า/กะดึก, เสาร์เว้นเสาร์, และข้ามวัน (Logical Date) |
| `hrm_time_logs`                | การบันทึกเวลาจริง (Event Sourcing)  | เก็บเวลาสแกนจริง, พิกัด, Device Info แยกรายการเข้า-ออก        |
| `hrm_personal_off_days`        | วันหยุดเฉพาะบุคคล                   | เก็บวันหยุดพิเศษรายคน (เช่น 3/2/26) แยกจากวันหยุดประจำปี      |
| `hrm_leave_requests`           | ใบลาต่างๆ                           | เก็บข้อมูลการขอลา วันที่ และสถานะอนุมัติ                      |
| `hrm_leave_types`              | ประเภทการลา (ป่วย, กิจ, พักร้อน)    | กำหนดเงื่อนไขการลา เช่น จำนวนวันต่อปี, จ่ายเงินหรือไม่        |
| `hrm_employee_leave_quotas`    | โควตาวันลาคงเหลือรายปี              | เก็บยอดวันลาที่เหลือของพนักงานแต่ละคนในปีนั้นๆ                |
| `hrm_holidays`                 | วันหยุดประจำปี/ประเพณี              | ใช้อ้างอิงวันหยุดบริษัท (ไม่นับเป็นวันลา/ได้ค่าจ้างพิเศษ)     |
| `hrm_ot_requests`              | คำร้องขอทำ OT                       | เก็บข้อมูลขอทำงานล่วงเวลา                                     |
| `hrm_time_correction_requests` | คำร้องขอแก้เวลา                     | กรณีลืมสแกนนิ้วหรือสแกนผิดพลาด                                |
| `hrm_shift_swap_requests`      | คำร้องขอสลับกะ                      | กรณีพนักงานตกลงแลกเปลี่ยนวันทำงานกันเอง                       |

## 4. สิ่งที่ส่งมอบ (Deliverables)

- `siamgroup_v3_revised.sql`: ไฟล์ SQL หลัก (Database Schema)
- `er_diagram_v3.html`: แผนผังความสัมพันธ์ (Interactive Diagram)
- `database_design_summary.md`: สรุปแนวคิดการออกแบบ

## 5. คู่มือการเพิ่มระบบย่อย (Subsystem Integration Guide)

หากต้องการเพิ่มระบบย่อยในอนาคต (เช่น บัญชี, ขนส่ง, หรือ CRM) ให้ปฏิบัติตาม 4 ขั้นตอนนี้เพื่อรักษามาตรฐาน:

### ขั้นตอนที่ 1: ออกแบบตารางใหม่ (Database Design)

สร้างตารางใหม่โดยใช้ **Prefix** ที่ชัดเจน และต้องมี Foreign Key พื้นฐานเสมอ

```sql
CREATE TABLE acc_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,  -- [บังคับ] รองรับ Multi-Company
    branch_id INT NULL,       -- [บังคับ] รองรับ Multi-Branch
    created_by BIGINT NULL,   -- [แนะนำ] คนสร้าง (Link to core_users)
    CONSTRAINT fk_acc_comp FOREIGN KEY (company_id) REFERENCES core_companies(id)
);
```

### ขั้นตอนที่ 2: ลงทะเบียนเมนู (Register Menu)

เพิ่มชื่อระบบและหน้าจอลงในตาราง `core_app_structure`

```sql
INSERT INTO core_app_structure (parent_id, code, name_th, type)
VALUES (NULL, 'ACC', 'ระบบบัญชี', 'SYSTEM');
```

### ขั้นตอนที่ 3: กำหนดสิทธิ์ (Configure Permissions)

กำหนดสิทธิ์เริ่มต้นให้กับ Level ต่างๆ ในตาราง `core_level_permissions`

```sql
INSERT INTO core_level_permissions (level_id, app_structure_id, actions)
VALUES (1, (SELECT id FROM core_app_structure WHERE code='ACC_INVOICE'), '["VIEW", "CREATE", "EDIT", "APPROVE", "DELETE"]');
```

### ขั้นตอนที่ 4: เชื่อมต่อ API (Backend Integration)

ตรวจสอบสิทธิ์ด้วย `actions` JSON และกรองข้อมูลตาม `level_score` และ `company_id`.

---

**สถานะปัจจุบัน**: Core และ HRM พร้อมใช้งาน (Production Ready) ✅
