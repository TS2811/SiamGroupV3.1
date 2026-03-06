# PRD #04: ระบบตั้งค่า (Settings System)

**Project:** SiamGroup V3.1
**Version:** 1.0 Draft
**วันที่:** 2026-03-05
**ผู้เขียน:** Product Manager (AI)
**สถานะ:** 📝 Draft

> **เอกสารนี้ครอบคลุมหน้าตั้งค่าทั้งหมดของระบบ** — เข้าถึงได้ 2 ทาง: (1) `core_users.is_admin = 1` เข้าได้ทั้งหมด หรือ (2) Admin ตั้งค่าสิทธิ์ให้เห็นเฉพาะบางหน้าได้

---

## 1. ภาพรวม (Overview)

ระบบตั้งค่าเป็นศูนย์กลางการบริหารจัดการข้อมูลหลัก (Master Data) ทั้งหมดของระบบ SiamGroup V3.1 ประกอบด้วย:

- จัดการข้อมูลบริษัท / สาขา
- จัดการแผนก / ตำแหน่ง / ระดับ
- จัดการสิทธิ์การเข้าถึง (Permissions)
- จัดการโครงสร้างเมนูและ Actions
- จัดการ Master Data ของ HR (ประเภทลา, หมวดประเมิน)
- จัดการ Master Data ของ Payroll (หัวข้อรายได้/เงินหัก, ประเภท OT)
- จัดการค่าคงที่ระบบ (System Config)
- จัดการ Admin Users

### 1.1 สิทธิ์การเข้าถึง

| เงื่อนไข                                          | สิทธิ์                                   |
| :------------------------------------------------ | :--------------------------------------- |
| `core_users.is_admin = 1`                         | ✅ เข้าถึงเมนูตั้งค่า **ทั้งหมด** ได้    |
| `core_users.is_admin = 0` + **มีสิทธิ์จาก Admin** | ✅ เข้าถึงได้เฉพาะหน้าที่ Admin กำหนดให้ |
| `core_users.is_admin = 0` + **ไม่มีสิทธิ์**       | ❌ ไม่เห็นเมนูตั้งค่าเลย                 |

**หน้าที่ Admin สามารถเปิดให้ User ที่ไม่ใช่ Admin เห็นได้:**

| หน้า                                       | ตั้งค่าสิทธิ์ให้คนอื่นได้    | หมายเหตุ                                                |
| :----------------------------------------- | :--------------------------- | :------------------------------------------------------ |
| 📋 โครงสร้างเมนู (App Structure & Actions) | ✅                           | Admin กำหนดผ่าน Action-Based Permission (PRD #00 Sec.7) |
| หน้าอื่นๆ ทั้งหมด                          | ❌ เฉพาะ `is_admin` เท่านั้น | บริษัท, สาขา, สิทธิ์, Master Data, Config, Admin Users  |

> **อ้างอิง:** PRD #01 Section 4.5 — `is_admin` ใช้เปิดเมนูตั้งค่า
> **กลไก:** ใช้ `core_level_permissions` / `core_user_permissions` ควบคุมการเห็นหน้า App Structure

### 1.2 เอกสารอ้างอิง

| เอกสาร                                  | ใช้ในส่วน                       |
| :-------------------------------------- | :------------------------------ |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md` | โครงสร้างสิทธิ์, DB Schema      |
| `PRD/PRD_02_HR_SYSTEM.md`               | ประเภทลา, หมวดประเมิน           |
| `PRD/PRD_03_PAYROLL_SYSTEM.md`          | หัวข้อรายได้/เงินหัก, ประเภท OT |
| `ref/siamgroup_v3_final.sql`            | DB Schema เดิม                  |

---

## 2. โครงสร้างเมนูตั้งค่า (Settings Menu)

```
⚙️ ตั้งค่า (เฉพาะ is_admin = 1)
├── 🏢 ข้อมูลบริษัท
├── 🏬 ข้อมูลสาขา
├── 🏗️ โครงสร้างองค์กร
│   ├── แผนก (Departments)
│   ├── ตำแหน่ง (Roles)
│   └── ระดับ (Levels)
├── 🔐 สิทธิ์การเข้าถึง
│   ├── สิทธิ์ตาม Level (Matrix)
│   ├── สิทธิ์รายบุคคล (User Override)
│   └── การมองเห็นบริษัท/สาขา (Visibility)
├── 📋 โครงสร้างเมนู (App Structure & Actions)
├── 📂 Master Data — HR
│   ├── ประเภทลา (Leave Types)
│   └── หมวดประเมิน (Evaluation Criteria)
├── 💰 Master Data — Payroll
│   ├── หัวข้อรายได้/เงินหัก (Pay Item Types)
│   └── ประเภท OT (OT Types)
├── 📊 Master Data — ACC
│   ├── บัญชีธนาคารบริษัท (Company Accounts)
│   ├── ทะเบียนคู่ค้า (Payees)
│   ├── หมวดหมู่ค่าใช้จ่าย (Expense Categories)
│   └── กฎอนุมัติ ACC (Approval Rules)
├── ⚡ ค่าคงที่ระบบ (System Config)
└── 👑 ผู้ดูแลระบบ (Admin Users)
```

---

## 3. ข้อมูลบริษัท (Company Management)

> **ตาราง:** `core_companies`
> **สิทธิ์:** แก้ไขได้อย่างเดียว (Edit Only) — ไม่มีเพิ่ม/ลบ (บริษัท 4 แห่งคงที่)

### 3.1 หน้ารายการบริษัท

แสดงตารางบริษัททั้ง 4 แห่ง:

| Column         | แหล่งข้อมูล                     | แก้ไขได้        |
| :------------- | :------------------------------ | :-------------- |
| รหัส           | `code`                          | ❌              |
| ชื่อ (TH)      | `name_th`                       | ✅              |
| ชื่อ (EN)      | `name_en`                       | ✅              |
| ประเภท         | `type` (HEADQUARTER/SUBSIDIARY) | ❌              |
| เลขผู้เสียภาษี | `tax_id`                        | ✅              |
| Logo           | `logo_url`                      | ✅ (อัปโหลดรูป) |
| ที่อยู่        | `address`                       | ✅              |
| เบอร์โทร       | `phone`                         | ✅              |
| อีเมล          | `email`                         | ✅              |
| เว็บไซต์       | `website`                       | ✅              |
| สถานะ          | `is_active`                     | ✅              |

> **Logo:** ใช้ในเอกสาร Generate (PRD #03 Section 11) — รองรับ PNG/JPG แนะนำพื้นหลังใส

### 3.2 Actions

- ✏️ แก้ไข (กดเข้าหน้า Edit Form)
- ❌ ไม่มีปุ่มเพิ่ม / ลบ

---

## 4. ข้อมูลสาขา (Branch Management)

> **ตาราง:** `core_branches`
> **สิทธิ์:** แก้ไขได้อย่างเดียว (Edit Only) — ไม่มีเพิ่ม/ลบ

### 4.1 หน้ารายการสาขา

**ตัวกรอง:** บริษัท (Dropdown)

| Column                | แหล่งข้อมูล     | แก้ไขได้ |
| :-------------------- | :-------------- | :------- |
| รหัสสาขา              | `code`          | ❌       |
| ชื่อ (TH)             | `name_th`       | ✅       |
| ชื่อ (EN)             | `name_en`       | ✅       |
| บริษัท                | `company_id`    | ❌       |
| PEAK Category         | `peak_category` | ✅       |
| ที่อยู่               | `address`       | ✅       |
| พิกัด GPS (Lat)       | `latitude`      | ✅       |
| พิกัด GPS (Lng)       | `longitude`     | ✅       |
| รัศมี Check-in (เมตร) | `check_radius`  | ✅       |
| Mapping Code          | `mapping_code`  | ✅       |
| สถานะ                 | `is_active`     | ✅       |

### 4.2 UI พิเศษ: ตั้งพิกัด GPS

- แสดง **Google Maps** ให้กดเลือกตำแหน่ง → Auto-fill `latitude`, `longitude`
- แสดงวงกลมรัศมี Check-in บนแผนที่ (Preview)

---

## 5. โครงสร้างองค์กร (Organization Structure)

### 5.1 แผนก (Departments)

> **ตาราง:** `core_departments` + `core_company_departments` (Junction)

**CRUD เต็มรูปแบบ:**

| ฟิลด์           | ตาราง                        | คำอธิบาย                      |
| :-------------- | :--------------------------- | :---------------------------- |
| ชื่อ (TH)       | `core_departments.name`      | ✅ บังคับ                     |
| ชื่อ (EN)       | `core_departments.name_en`   | ❌ ไม่บังคับ                  |
| สถานะ           | `core_departments.is_active` | ✅                            |
| บริษัทที่สังกัด | `core_company_departments`   | ✅ เลือกหลายบริษัท (Checkbox) |

**หน้ารายการ:**

| Column          | คำอธิบาย                                  |
| :-------------- | :---------------------------------------- |
| ชื่อแผนก        | name + name_en                            |
| บริษัทที่สังกัด | Badge แสดงรหัสบริษัท (SDR, SXD, SPD, SAR) |
| จำนวน Roles     | นับจาก `core_department_roles`            |
| สถานะ           | Active / Inactive                         |

> **กฎ:** ลบแผนกได้ต่อเมื่อไม่มีพนักงานสังกัดอยู่ (Soft Delete → `is_active = 0`)

### 5.2 ตำแหน่ง (Roles)

> **ตาราง:** `core_roles` + `core_department_roles` (Junction)

**CRUD เต็มรูปแบบ:**

| ฟิลด์         | ตาราง                   | คำอธิบาย                    |
| :------------ | :---------------------- | :-------------------------- |
| ชื่อ (TH)     | `core_roles.name_th`    | ✅ บังคับ                   |
| ชื่อ (EN)     | `core_roles.name_en`    | ✅ บังคับ                   |
| แผนกที่สังกัด | `core_department_roles` | ✅ เลือกหลายแผนก (Checkbox) |

**หน้ารายการ:**

| Column        | คำอธิบาย             |
| :------------ | :------------------- |
| ชื่อตำแหน่ง   | name_th + name_en    |
| แผนกที่สังกัด | Badge แสดงชื่อแผนก   |
| จำนวน Levels  | นับจาก `core_levels` |

### 5.3 ระดับ (Levels)

> **ตาราง:** `core_levels`

**CRUD เต็มรูปแบบ:**

| ฟิลด์        | ตาราง                          | คำอธิบาย        |
| :----------- | :----------------------------- | :-------------- |
| กลุ่มตำแหน่ง | `role_id` → FK `core_roles`    | ✅ Dropdown     |
| Level Score  | `level_score` (1-8)            | ✅ (1 = สูงสุด) |
| ชื่อ Level   | `name` เช่น "MD", "Programmer" | ✅              |
| คำอธิบาย     | `description`                  | ❌ ไม่บังคับ    |

**หน้ารายการ:**

| Column              | คำอธิบาย                                |
| :------------------ | :-------------------------------------- |
| Level Score         | ตัวเลข 1-8                              |
| ชื่อ Level          | name                                    |
| กลุ่มตำแหน่ง (Role) | ดึงจาก `core_roles.name_th`             |
| จำนวนพนักงาน        | นับจาก `hrm_employees` ที่ใช้ Level นี้ |

> **กฎ:** ลบ Level ได้ต่อเมื่อไม่มีพนักงานใช้อยู่

---

## 6. สิทธิ์การเข้าถึง (Permission Management)

> **อ้างอิง:** PRD #00 Section 7 (Action-Based Permission)

### 6.1 มุมมอง A: Matrix (Level × Page/Action)

แสดงตาราง Matrix:

```
                    │ Dashboard │ แบบฟอร์ม │ HR │ Payroll │ ตั้งค่า │
────────────────────┼───────────┼──────────┼────┼─────────┼─────────┤
Level 1 (ผู้บริหาร) │    ✅     │    ✅    │ ✅ │   ✅    │   ✅    │
Level 2 (รอง)       │    ✅     │    ✅    │ ✅ │   ✅    │   ❌    │
Level 3-4 (ผจก.)    │    ✅     │    ✅    │ ✅ │   ❌    │   ❌    │
Level 5 (หน.งาน)    │    ✅     │    ✅    │ ❌ │   ❌    │   ❌    │
Level 7 (พนง.)      │    ✅     │    ✅    │ ❌ │   ❌    │   ❌    │
Level 8 (ทั่วไป)    │    ✅     │    ✅    │ ❌ │   ❌    │   ❌    │
```

**ฟังก์ชัน:**

- **แกน Y:** Level ทั้งหมดจาก `core_levels` (Group by Role)
- **แกน X:** หน้าทั้งหมดจาก `core_app_structure` (Group by System)
- **เซลล์:** Checkbox ✅/❌
- ✅ = มี record ใน `core_level_permissions`
- ❌ = ไม่มี record
- **กดเซลล์** → Toggle สิทธิ์ (เพิ่ม/ลบ record)
- **Expand หน้า** → แสดง Actions ของหน้านั้น (จาก `core_app_actions`)

**ตาราง:**

| สิทธิ์ Page   | `core_level_permissions`        | มี record = เห็นหน้า |
| :------------ | :------------------------------ | :------------------- |
| สิทธิ์ Action | `core_level_action_permissions` | มี record = เห็นปุ่ม |

### 6.2 มุมมอง B: เลือก Level → Checklist

**Flow:**

1. Dropdown เลือก Level (เช่น "Level 7 — Programmer")
2. แสดง Checklist ของ **หน้า** ทั้งหมด (จัดกลุ่มตาม System)
3. แต่ละหน้า Expand ได้ → แสดง Actions ของหน้านั้น
4. ติ๊ก/ไม่ติ๊ก → บันทึก

```
📋 สิทธิ์ของ: [Level 7 — Programmer ▼]

☑ 📊 Dashboard
    ☑ ดูข้อมูลตัวเอง
    ☑ ดูข้อมูลลูกน้อง
☑ 📝 แบบฟอร์มคำขอ
    ☑ ขอลา
    ☑ ขอ OT
    ☑ ขอแก้เวลา
    ☑ สลับวันหยุด
☐ 👥 ระบบ HR
    ☐ ดูรายชื่อพนักงาน
    ☐ แก้ไขข้อมูลพนักงาน
    ...
```

### 6.3 มุมมอง C: User Override (สิทธิ์รายบุคคล)

**Flow:**

1. ค้นหา / เลือก User
2. แสดงสิทธิ์ปัจจุบัน (จาก Level Default) + Override ที่มี
3. กด **"เพิ่มสิทธิ์"** → `is_granted = 1` (เพิ่มสิทธิ์เกินกว่า Level Default)
4. กด **"ลดสิทธิ์"** → `is_granted = 0` (ลดสิทธิ์ที่ Level Default มี)
5. กด **"ลบ Override"** → ลบ record → กลับใช้สิทธิ์ Level Default

**UI:**

```
👤 สิทธิ์ของ: [ค้นหาพนักงาน...] → สมชาย ใจดี (Level 7 — Programmer)

แสดง: ☑ เฉพาะที่ Override  ☐ ทั้งหมด

| หน้า/Action          | Level Default | Override      | ผลลัพธ์ |
|:---------------------|:-------------|:-------------|:--------|
| 📊 Dashboard         | ✅ เห็น      | —            | ✅ เห็น |
| 👥 ระบบ HR           | ❌ ไม่เห็น   | ✅ เพิ่มสิทธิ์ | ✅ เห็น |
| 💰 ระบบเงินเดือน     | ❌ ไม่เห็น   | —            | ❌ ไม่เห็น |
```

**ตาราง:**

| สิทธิ์ Page   | `core_user_permissions`        |
| :------------ | :----------------------------- |
| สิทธิ์ Action | `core_user_action_permissions` |

### 6.4 การมองเห็นบริษัท/สาขา (Visibility)

> **อ้างอิง:** PRD #00 Section 5.4–5.5

**ส่วน 1: บริษัทที่เห็น (`core_user_company_access`)**

| ฟังก์ชัน          | คำอธิบาย                               |
| :---------------- | :------------------------------------- |
| ค้นหา/เลือก User  | เลือกพนักงาน                           |
| แสดงบริษัทที่เห็น | Checkbox 4 บริษัท (SDR, SXD, SPD, SAR) |
| ไม่มี record      | = Fallback ตามแผนก                     |
| มี record         | = ใช้ตามที่กำหนด                       |

**ส่วน 2: สาขาที่เห็น (`core_user_branch_access`)**

| ฟังก์ชัน     | คำอธิบาย                                           |
| :----------- | :------------------------------------------------- |
| แสดงสาขา     | Checkbox สาขาทั้งหมด (Group by บริษัท)             |
| ไม่มี record | = ใช้กฎ Default (1 บ.=สาขาตัวเอง / หลายบ.=ทุกสาขา) |
| มี record    | = Override ตามที่กำหนด                             |

---

## 7. โครงสร้างเมนูและ Actions (App Structure)

### 7.1 โครงสร้างเมนู (`core_app_structure`)

> **CRUD เต็มรูปแบบ**

| ฟิลด์        | คำอธิบาย                                        |
| :----------- | :---------------------------------------------- |
| `parent_id`  | NULL = System Group, มีค่า = Page ภายใต้ System |
| `code`       | รหัส เช่น "HRM", "HRM_LEAVE"                    |
| `name_th`    | ชื่อเมนู (TH)                                   |
| `type`       | SYSTEM / PAGE / SECTION                         |
| `sort_order` | ลำดับแสดง                                       |

**แสดงเป็น Tree:**

```
├── CORE (ระบบหลัก)
│   ├── CORE_DASHBOARD (Dashboard)
│   ├── CORE_REQUEST (แบบฟอร์มคำขอ)
│   └── CORE_PROFILE (ข้อมูลส่วนตัว)
├── HRM (ระบบ HR)
│   ├── HRM_EMPLOYEE (จัดการพนักงาน)
│   ├── HRM_TIME_REPORT (รายงานเวลา)
│   └── ...
├── PAY (ระบบเงินเดือน)
│   └── ...
└── SETTINGS (ตั้งค่า)
    └── ...
```

### 7.2 Actions ภายในหน้า (`core_app_actions`)

> **CRUD เต็มรูปแบบ**

| ฟิลด์         | คำอธิบาย                          |
| :------------ | :-------------------------------- |
| `page_id`     | FK → `core_app_structure.id`      |
| `code`        | รหัส เช่น "doc_cert_work_request" |
| `name_th`     | ชื่อปุ่ม (TH)                     |
| `name_en`     | ชื่อปุ่ม (EN)                     |
| `description` | คำอธิบาย                          |
| `sort_order`  | ลำดับ                             |
| `is_active`   | เปิด/ปิด                          |

---

## 8. Master Data — HR

### 8.1 ประเภทลา (Leave Types)

> **ตาราง:** `hrm_leave_types`
> **CRUD เต็มรูปแบบ**

| ฟิลด์       | คำอธิบาย                 | บังคับ |
| :---------- | :----------------------- | :----- |
| ชื่อ (TH)   | `name_th`                | ✅     |
| ชื่อ (EN)   | `name_en`                | ❌     |
| ต้องแนบไฟล์ | `requires_file` (Toggle) | ✅     |

**หน้ารายการ:**

| Column       | คำอธิบาย                    |
| :----------- | :-------------------------- |
| ชื่อประเภทลา | name_th                     |
| ต้องแนบไฟล์  | ✅ / ❌                     |
| จำนวนคำร้อง  | นับจาก `hrm_leave_requests` |

> **กฎ:** ลบได้ต่อเมื่อไม่มีคำร้องอ้างอิง (แนะนำ Soft Delete)

### 8.2 หมวดประเมิน (Evaluation Criteria)

> **ตาราง:** `hrm_evaluation_criteria`
> **CRUD เต็มรูปแบบ**
> **อ้างอิง:** PRD #02 Section 12.3

| ฟิลด์       | คำอธิบาย            | บังคับ |
| :---------- | :------------------ | :----- |
| ชื่อ (TH)   | `name_th`           | ✅     |
| ชื่อ (EN)   | `name_en`           | ❌     |
| คำอธิบาย    | `description`       | ❌     |
| น้ำหนัก (%) | `weight` เช่น 25.00 | ✅     |
| ลำดับ       | `sort_order`        | ✅     |
| สถานะ       | `is_active`         | ✅     |

**Validation:**

- ⚠️ **ผลรวม `weight` ของหมวดที่ `is_active = 1` ต้องเท่ากับ 100%** — แสดงแจ้งเตือนถ้าไม่ครบ

---

## 9. Master Data — Payroll

### 9.1 หัวข้อรายได้/เงินหัก (Pay Item Types)

> **ตาราง:** `pay_item_types`
> **CRUD เต็มรูปแบบ** (ยกเว้น System Items ห้ามลบ)
> **อ้างอิง:** PRD #03 Section 5

| ฟิลด์       | คำอธิบาย                         | บังคับ                   |
| :---------- | :------------------------------- | :----------------------- |
| รหัส        | `code`                           | ✅ (Unique)              |
| ชื่อ (TH)   | `name_th`                        | ✅                       |
| ประเภท      | `type` (INCOME / DEDUCTION)      | ✅                       |
| วิธีคำนวณ   | `calc_type` (AUTO / MANUAL)      | ✅                       |
| System Item | `is_system`                      | ❌ (แสดงเฉย — แก้ไม่ได้) |
| สถานะ       | `is_active` (เปิด/ปิดแสดงในสลิป) | ✅                       |
| ลำดับ       | `sort_order`                     | ✅                       |

**กฎ:**

- `is_system = 1` → **ห้ามลบ**, แก้ไขได้เฉพาะ `name_th`, `sort_order`, `is_active`
- `is_system = 0` → CRUD ได้เต็มที่, `calc_type` บังคับเป็น `MANUAL`

### 9.2 ประเภท OT (OT Types)

> **ตาราง:** `pay_ot_types` + `pay_ot_fixed_rates` + `pay_ot_time_slots`
> **CRUD เต็มรูปแบบ**
> **อ้างอิง:** PRD #03 Section 4

| ฟิลด์      | คำอธิบาย                                         | บังคับ |
| :--------- | :----------------------------------------------- | :----- |
| รหัส       | `code`                                           | ✅     |
| ชื่อ (TH)  | `name_th`                                        | ✅     |
| วิธีคำนวณ  | `calc_method` (FORMULA / FIXED_RATE / TIME_SLOT) | ✅     |
| Multiplier | `multiplier` (เช่น 1.5) — เฉพาะ FORMULA          | ⬜     |
| บริษัท     | `company_id` (NULL = ทุกบริษัท)                  | ❌     |
| สาขา       | `branch_id` (NULL = ทุกสาขา)                     | ❌     |
| สถานะ      | `is_active`                                      | ✅     |

**Sub-form ตาม `calc_method`:**

- **FIXED_RATE** → แสดง/แก้ไข `pay_ot_fixed_rates` (Tier อัตราตามเงินเดือน)
- **TIME_SLOT** → แสดง/แก้ไข `pay_ot_time_slots` (ช่วงเวลา + อัตราต่อช่วง)

---

## 10. ค่าคงที่ระบบ (System Config)

> **ตารางใหม่:** `core_system_config`

### 10.1 DB Schema

```sql
CREATE TABLE `core_system_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'รหัสค่าคงที่',
    `config_value` VARCHAR(500) NOT NULL COMMENT 'ค่า',
    `data_type` ENUM('STRING','INTEGER','DECIMAL','BOOLEAN') NOT NULL DEFAULT 'STRING',
    `category` VARCHAR(50) NOT NULL COMMENT 'หมวด เช่น ATTENDANCE, PAYROLL, SECURITY',
    `name_th` VARCHAR(200) NOT NULL COMMENT 'ชื่อแสดง (TH)',
    `description` VARCHAR(500) NULL COMMENT 'คำอธิบาย',
    `updated_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'ค่าคงที่ระบบ (System Configuration)';
```

### 10.2 ข้อมูลตั้งต้น (Seed Data)

| config_key                   | config_value | data_type | category   | name_th                             |
| :--------------------------- | :----------- | :-------- | :--------- | :---------------------------------- |
| `CHECK_IN_DEFAULT_RADIUS`    | `200`        | INTEGER   | ATTENDANCE | รัศมี Check-in Default (เมตร)       |
| `LATE_THRESHOLD_MINUTES`     | `15`         | INTEGER   | ATTENDANCE | เกณฑ์สาย (นาที/ครั้ง)               |
| `LATE_MONTHLY_LIMIT_MINUTES` | `30`         | INTEGER   | ATTENDANCE | เกณฑ์สายรวม (นาที/เดือน)            |
| `ABSENCE_AUTO_DEDUCT_LEAVE`  | `1`          | BOOLEAN   | ATTENDANCE | ขาดงาน = บังคับหักลา                |
| `OT_MINIMUM_HOURS`           | `1`          | DECIMAL   | PAYROLL    | OT ขั้นต่ำ (ชั่วโมง)                |
| `SOCIAL_SECURITY_RATE`       | `5`          | DECIMAL   | PAYROLL    | อัตราประกันสังคม (%)                |
| `SOCIAL_SECURITY_MAX`        | `750`        | DECIMAL   | PAYROLL    | เพดานประกันสังคม (บาท/เดือน)        |
| `SOCIAL_SECURITY_MIN`        | `83`         | DECIMAL   | PAYROLL    | ขั้นต่ำประกันสังคม (บาท/เดือน)      |
| `SOCIAL_SECURITY_BASE_MAX`   | `15000`      | DECIMAL   | PAYROLL    | ฐานเงินเดือนสูงสุดสำหรับประกันสังคม |
| `PAYROLL_CYCLE_START_DAY`    | `21`         | INTEGER   | PAYROLL    | วันเริ่มรอบเงินเดือน                |
| `PAYROLL_CYCLE_END_DAY`      | `20`         | INTEGER   | PAYROLL    | วันสิ้นรอบเงินเดือน                 |
| `PAYROLL_PAY_DAY`            | `1`          | INTEGER   | PAYROLL    | วันจ่ายเงินเดือน                    |
| `TAX_PERSONAL_DEDUCTION`     | `60000`      | DECIMAL   | PAYROLL    | ค่าลดหย่อนส่วนตัว (บาท/ปี)          |
| `BONUS_EVAL_WEIGHT`          | `70`         | DECIMAL   | PAYROLL    | น้ำหนักคะแนนประเมิน (%)             |
| `BONUS_ATTENDANCE_WEIGHT`    | `30`         | DECIMAL   | PAYROLL    | น้ำหนักคะแนน Attendance (%)         |
| `LOGIN_MAX_ATTEMPTS`         | `5`          | INTEGER   | SECURITY   | จำนวน Login ผิดสูงสุดก่อนล็อก       |
| `JWT_ACCESS_TOKEN_MINUTES`   | `30`         | INTEGER   | SECURITY   | อายุ Access Token (นาที)            |
| `JWT_REFRESH_TOKEN_DAYS`     | `7`          | INTEGER   | SECURITY   | อายุ Refresh Token (วัน)            |

### 10.3 หน้า UI

**แสดงจัดกลุ่มตาม `category`:**

```
⚡ ค่าคงที่ระบบ

── 📍 ATTENDANCE (การเข้างาน) ──────────────────
รัศมี Check-in Default (เมตร):    [200    ]
เกณฑ์สาย (นาที/ครั้ง):            [15     ]
เกณฑ์สายรวม (นาที/เดือน):         [30     ]
ขาดงาน = บังคับหักลา:             [✅ เปิด]

── 💰 PAYROLL (เงินเดือน) ─────────────────────
อัตราประกันสังคม (%):              [5      ]
เพดานประกันสังคม (บาท/เดือน):      [750    ]
...

── 🔒 SECURITY (ความปลอดภัย) ──────────────────
จำนวน Login ผิดสูงสุดก่อนล็อก:    [5      ]
...

                                    [ 💾 บันทึก ]
```

---

## 11. ผู้ดูแลระบบ (Admin Users)

> **ตาราง:** `core_users.is_admin`

### 11.1 ฟังก์ชัน

- แสดงรายชื่อ User ทั้งหมดที่ `is_admin = 1`
- ค้นหา User → Toggle `is_admin` (เปิด/ปิดสิทธิ์ Admin)
- **ไม่สามารถถอดสิทธิ์ Admin ของตัวเองได้** (ป้องกันล็อกตัวเอง)

### 11.2 หน้า UI

**แสดง 2 ส่วน:**

**ส่วนบน — Admin ปัจจุบัน:**

| ชื่อ-นามสกุล | ตำแหน่ง    | แผนก | สถานะ     | Actions     |
| :----------- | :--------- | :--- | :-------- | :---------- |
| สมชาย ใจดี   | Programmer | IT   | ✅ Active | [ถอดสิทธิ์] |
| ...          | ...        | ...  | ...       | ...         |

**ส่วนล่าง — เพิ่ม Admin ใหม่:**

- ค้นหาพนักงาน → กดเพิ่มเป็น Admin

---

## 12. DB Schema — ตารางใหม่

### 12.1 สรุปตารางใหม่ (1 ตาราง)

| ตาราง                   | คำอธิบาย                    | ใช้ใน Section |
| :---------------------- | :-------------------------- | :------------ |
| `core_system_config` 🆕 | ค่าคงที่ระบบ (Configurable) | 10            |

> **ตารางอื่นทั้งหมดมีอยู่แล้ว** จาก PRD #00–#03 — PRD #04 เป็น UI สำหรับจัดการตารางเหล่านั้น

### 12.2 SQL สร้างตาราง

```sql
CREATE TABLE `core_system_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'รหัสค่าคงที่',
    `config_value` VARCHAR(500) NOT NULL COMMENT 'ค่า',
    `data_type` ENUM('STRING','INTEGER','DECIMAL','BOOLEAN') NOT NULL DEFAULT 'STRING',
    `category` VARCHAR(50) NOT NULL COMMENT 'หมวด เช่น ATTENDANCE, PAYROLL, SECURITY',
    `name_th` VARCHAR(200) NOT NULL COMMENT 'ชื่อแสดง (TH)',
    `description` VARCHAR(500) NULL COMMENT 'คำอธิบาย',
    `updated_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'ค่าคงที่ระบบ (System Configuration)';
```

---

## 13. สรุปตารางที่ PRD #04 จัดการ

| ตาราง                           | Module                             | สิทธิ์                     |
| :------------------------------ | :--------------------------------- | :------------------------- |
| `core_companies`                | 3 (บริษัท)                         | Edit Only                  |
| `core_branches`                 | 4 (สาขา)                           | Edit Only                  |
| `core_departments`              | 5.1 (แผนก)                         | CRUD                       |
| `core_company_departments`      | 5.1 (แผนก ↔ บริษัท)                | CRUD                       |
| `core_roles`                    | 5.2 (ตำแหน่ง)                      | CRUD                       |
| `core_department_roles`         | 5.2 (ตำแหน่ง ↔ แผนก)               | CRUD                       |
| `core_levels`                   | 5.3 (ระดับ)                        | CRUD                       |
| `core_level_permissions`        | 6.1, 6.2 (สิทธิ์ Level ต่อ Page)   | CRUD                       |
| `core_level_action_permissions` | 6.1, 6.2 (สิทธิ์ Level ต่อ Action) | CRUD                       |
| `core_user_permissions`         | 6.3 (Override User ต่อ Page)       | CRUD                       |
| `core_user_action_permissions`  | 6.3 (Override User ต่อ Action)     | CRUD                       |
| `core_user_company_access`      | 6.4 (บริษัทที่เห็น)                | CRUD                       |
| `core_user_branch_access`       | 6.4 (สาขาที่เห็น)                  | CRUD                       |
| `core_app_structure`            | 7.1 (โครงสร้างเมนู)                | CRUD                       |
| `core_app_actions`              | 7.2 (Actions)                      | CRUD                       |
| `hrm_leave_types`               | 8.1 (ประเภทลา)                     | CRUD                       |
| `hrm_evaluation_criteria`       | 8.2 (หมวดประเมิน)                  | CRUD                       |
| `pay_item_types`                | 9.1 (หัวข้อรายได้/เงินหัก)         | CRUD (System Items ห้ามลบ) |
| `pay_ot_types`                  | 9.2 (ประเภท OT)                    | CRUD                       |
| `pay_ot_fixed_rates`            | 9.2 (Tier อัตรา OT)                | CRUD                       |
| `pay_ot_time_slots`             | 9.2 (ช่วงเวลา OT)                  | CRUD                       |
| `core_system_config` 🆕         | 10 (ค่าคงที่ระบบ)                  | Edit                       |
| `core_users.is_admin`           | 11 (ผู้ดูแลระบบ)                   | Edit                       |
| `v3_acc_company_accounts`       | 12.1 (บัญชีธนาคารบริษัท ACC)       | CRUD                       |
| `v3_acc_payees`                 | 12.2 (ทะเบียนคู่ค้า ACC)           | CRUD + Import              |
| `v3_acc_payee_banks`            | 12.2 (บัญชีธนาคารคู่ค้า ACC)       | CRUD                       |
| `v3_acc_expense_categories`     | 12.3 (หมวดหมู่ค่าใช้จ่าย ACC)      | CRUD                       |
| `v3_acc_approval_rules`         | 12.4 (กฎอนุมัติ ACC)               | CRUD                       |

---

## 14. ข้อกำหนดทางเทคนิค

| หัวข้อ         | รายละเอียด                                           |
| :------------- | :--------------------------------------------------- |
| **ทุก Action** | บันทึก Audit Trail (ใคร, ทำอะไร, เมื่อไหร่)          |
| **ลบข้อมูล**   | ใช้ Soft Delete (`is_active = 0`) ทุกกรณี            |
| **Validation** | ตรวจสอบ FK ก่อนลบ — ห้ามลบถ้ามีข้อมูลอ้างอิง         |
| **Backend**    | ตรวจ `is_admin = 1` ในทุก API endpoint ของ Settings  |
| **Cache**      | System Config ควร Cache ที่ Backend เพื่อลด DB Query |

---

## 15. Open Questions

| #   | คำถาม                          | สถานะ        |
| :-- | :----------------------------- | :----------- |
| —   | _(ไม่มีคำถามค้าง — รอ Review)_ | ⏳ รอ Review |

---

## 16. เอกสารอ้างอิง

| เอกสาร                                  | ใช้อ้างอิงในส่วน                     |
| :-------------------------------------- | :----------------------------------- |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md` | Section 5, 6 (โครงสร้างสิทธิ์)       |
| `PRD/PRD_01_MAIN_SYSTEM.md`             | Section 11 (is_admin → เมนูตั้งค่า)  |
| `PRD/PRD_02_HR_SYSTEM.md`               | Section 8 (ประเภทลา, หมวดประเมิน)    |
| `PRD/PRD_03_PAYROLL_SYSTEM.md`          | Section 9 (หัวข้อรายได้/เงินหัก, OT) |
| `ref/siamgroup_v3_final.sql`            | DB Schema                            |
