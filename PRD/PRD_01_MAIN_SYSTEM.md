# PRD #01: ระบบหลัก (Main System)

**Project:** SiamGroup V3.1
**Version:** 2.0 (Final)
**วันที่:** 2026-02-26
**ผู้เขียน:** Product Manager (AI)
**สถานะ:** ✅ สมบูรณ์

---

## 1. ภาพรวม (Overview)

ระบบหลักเป็นระบบที่ **ผู้ใช้ทุกคน** สามารถเข้าถึงได้หลังจาก Login โดยจะแสดงผลใน Sidebar ของระบบหลัก ประกอบด้วย:

1. **Login** — หน้า Login เข้าสู่ระบบ
2. **Dashboard** — หน้าแรกหลัง Login แสดงปฏิทินรอบเงินเดือน สรุปสถิติ และปุ่มไปหน้า Check-in
3. **Check-in / Check-out** — หน้าย่อยสำหรับลงเวลาเข้า-ออกงาน (เข้าผ่านปุ่มใน Dashboard)
4. **แบบฟอร์มคำขอ** — ศูนย์รวมคำร้องต่างๆ ของพนักงาน
5. **ข้อมูลส่วนตัว** — หน้าโปรไฟล์ส่วนตัวของพนักงาน

> **หมายเหตุ:** แม้ทุกคนเห็นเมนูเหมือนกัน แต่เนื้อหาที่แสดงจะ **แตกต่างกันตามสิทธิ์** เช่น หัวหน้าจะเห็นข้อมูลลูกน้องเพิ่มเติมใน Dashboard

---

## 2. กลุ่มผู้ใช้ (User Groups)

| กลุ่ม       | ตัวอย่างตำแหน่ง                 | การใช้งานหลักในระบบนี้                  |
| :---------- | :------------------------------ | :-------------------------------------- |
| ผู้บริหาร   | MD, Asst MD, CFO                | ดู Dashboard สรุปภาพรวม                 |
| ผู้จัดการ   | EM, AM                          | ดู Dashboard + อนุมัติคำร้องลูกน้อง     |
| HR          | HR                              | จัดการคำร้อง, ดูข้อมูลพนักงาน           |
| บัญชี       | ACC                             | ส่งคำร้อง, ดู Dashboard ตัวเอง          |
| หัวหน้าสาขา | หัวหน้าสาขา                     | ดู Dashboard + อนุมัติคำร้อง            |
| พนักงาน     | ออฟฟิศ, Operation, เซลล์, คนขับ | Check-in/out, ส่งคำร้อง, ดูข้อมูลตัวเอง |

**จำนวนผู้ใช้:** ~300 คน | **บริษัท:** 4 แห่ง | **สาขา:** 43 สาขา

---

## 3. Sidebar Menu ของระบบหลัก

```
📊 Dashboard
📝 แบบฟอร์มคำขอ
👤 ข้อมูลส่วนตัว
```

> **หน้า Check-in/Check-out** ไม่อยู่ใน Sidebar — เข้าถึงผ่าน **ปุ่มใน Dashboard** เท่านั้น

---

## 4. ระบบ Login

### 4.1 รายละเอียดหน้า Login

| หัวข้อ         | รายละเอียด                                                                    |
| :------------- | :---------------------------------------------------------------------------- |
| **URL**        | `/login`                                                                      |
| **Design**     | Glassmorphism ตาม `THEME_SUMMARY.md` (Gradient bg, Floating orbs, Glass card) |
| **ช่องกรอก**   | Username, Password                                                            |
| **ปุ่ม**       | Login                                                                         |
| **จำ Session** | Auto-login ผ่าน JWT ใน HttpOnly Cookie (ไม่หมดอายุจนกว่า Token จะ expire)     |

### 4.2 Authentication: JWT + HttpOnly Cookie (Security-First)

> **หลักการ:** ความปลอดภัยเป็นอันดับ 1 — ใช้ JWT Token เก็บใน HttpOnly Cookie เพื่อป้องกันทั้ง XSS และ CSRF

#### Token Strategy:

| Token             | เก็บที่ไหน                 | อายุ       | ใช้ทำอะไร                         |
| :---------------- | :------------------------- | :--------- | :-------------------------------- |
| **Access Token**  | HttpOnly Cookie            | 15-30 นาที | ส่งไปกับทุก API Request อัตโนมัติ |
| **Refresh Token** | HttpOnly Cookie (separate) | 7 วัน      | ขอ Access Token ใหม่เมื่อหมดอายุ  |

#### Cookie Security Flags:

```
Set-Cookie: access_token=<JWT>;
  HttpOnly;     ← JS เข้าถึง Token ไม่ได้ → กัน XSS
  Secure;       ← ส่งผ่าน HTTPS เท่านั้น → กัน MITM
  SameSite=Lax; ← บล็อก cross-site request → กัน CSRF
  Path=/api;    ← ส่ง Cookie เฉพาะ API path
```

### 4.3 Flow การ Login

```
User กรอก Username + Password
    ↓
Frontend ส่ง POST /api/auth/login (credentials: 'include')
    ↓
Backend ตรวจสอบ:
  1. username ตรงกับ core_users.username?
  2. password ตรงกับ core_users.password_hash? (bcrypt verify)
  3. core_users.is_active = 1?
  4. ตรวจสอบ Rate Limiting (ป้องกัน brute force)
    ↓
[สำเร็จ]
  → สร้าง Access Token + Refresh Token (JWT)
  → ตั้ง HttpOnly Cookie ใน Response
  → คืน User Object + Menu JSON (ไม่มี Token ใน body)
  → บันทึก last_login_at, last_login_ip
  → Frontend เก็บ User Object ใน React State (ไม่ใช่ localStorage)
  → Redirect ไปหน้า Dashboard
    ↓
[ล้มเหลว]
  → แสดง Error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
  → ไม่บอกว่า username ผิดหรือ password ผิด (ป้องกัน enumeration)
  → หลัง 5 ครั้ง → ล็อกชั่วคราว + แจ้ง Admin
```

### 4.4 Token Refresh Flow

```
Frontend ส่ง API Request →  Access Token หมดอายุ → Response 401
    ↓
Frontend ส่ง POST /api/auth/refresh (Cookie อัตโนมัติ)
    ↓
Backend ตรวจสอบ Refresh Token:
  - ยังไม่หมดอายุ? valid signature?
    ↓
[สำเร็จ] → ออก Access Token ใหม่ → ตั้ง Cookie ใหม่ → Retry Request เดิม
[ล้มเหลว] → Redirect ไปหน้า Login
```

### 4.5 ข้อมูล User Object ที่คืนหลัง Login

> **หมายเหตุ:** User Object อยู่ใน Response Body — Token อยู่ใน Cookie เท่านั้น (ไม่คืนใน body)

| ข้อมูล                          | แหล่ง DB                                        | ใช้ทำอะไร               |
| :------------------------------ | :---------------------------------------------- | :---------------------- |
| `user_id`                       | `core_users.id`                                 | ระบุตัวตน               |
| `username`                      | `core_users.username`                           | แสดง                    |
| `first_name_th`, `last_name_th` | `core_users`                                    | แสดงชื่อ                |
| `avatar_url`                    | `core_users.avatar_url`                         | แสดงรูป                 |
| `is_admin`                      | `core_users.is_admin`                           | เปิดเมนูตั้งค่า         |
| `employee_id`                   | `hrm_employees.id`                              | เชื่อมข้อมูลพนักงาน     |
| `company_id`                    | `hrm_employees.company_id`                      | กรองข้อมูลตามบริษัท     |
| `branch_id`                     | `hrm_employees.branch_id`                       | Check-in สาขา           |
| `level_id`                      | `hrm_employees.level_id`                        | กำหนดสิทธิ์มองเห็น      |
| `manager_id`                    | `hrm_employees.manager_id`                      | กำหนดสายอนุมัติ         |
| `menu_tree`                     | `core_app_structure` + `core_level_permissions` | Render Navbar + Sidebar |

### 4.6 Logout

```
Frontend ส่ง POST /api/auth/logout
    ↓
Backend:
  → เพิ่ม Refresh Token เข้า Blacklist (ป้องกันใช้ซ้ำ)
  → ลบ Cookie (Set-Cookie: max-age=0)
    ↓
Frontend:
  → ล้าง React State
  → Redirect ไปหน้า Login
```

### 4.7 Protected Route

- ทุกหน้า (ยกเว้น `/login`) ต้องผ่าน `ProtectedRoute`
- ถ้า Cookie ไม่มี Token หรือ Token หมดอายุ → Refresh → ถ้าล้มเหลว → Redirect ไป `/login`
- ทุก API Request ต้องมี Cookie ที่มี valid JWT

> **อ้างอิง:** `FRONTEND_STANDARDS.md`, `BACKEND_ARCHITECTURE.md`, `system-siamgroup-models.md` (Phase 1: JWT)

---

## 5. หน้า Dashboard

### 5.1 ปฏิทิน (Calendar)

#### รูปแบบการแสดงผล:

- แสดงเป็น **รอบเงินเดือน** (วันที่ 21 ของเดือนก่อน ถึง วันที่ 20 ของเดือนปัจจุบัน)
- ตัวอย่าง: รอบเดือนกุมภาพันธ์ = **21/01/2026 — 20/02/2026**
- สามารถเลื่อนไปดูรอบอื่นได้

#### สำหรับพนักงานทุกคน:

แต่ละวันในปฏิทินจะแสดง **สถานะ** พร้อมสีตามตารางนี้:

| สถานะ               | สัญลักษณ์         | สี                     | เงื่อนไข                                              |
| :------------------ | :---------------- | :--------------------- | :---------------------------------------------------- |
| ✅ เข้างานปกติ      | 🟢 จุดเขียว       | `#4CAF50` (Green)      | ลงเวลาครบ ตรงเวลา                                     |
| ⏰ มาสาย (≤15 นาที) | 🟡 จุดเหลือง      | `#FFC107` (Warning)    | ลงเวลาหลัง start_time ไม่เกิน 15 นาที                 |
| 🔴 มาสาย (>15 นาที) | 🔴 จุดแดง + เตือน | `#F44336` (Red)        | ลงเวลาหลัง start_time เกิน 15 นาที — **เตือนเด่นชัด** |
| 🚪 กลับก่อน         | 🟠 จุดส้ม         | `#FF9800` (Orange)     | scan OUT ก่อน end_time ของกะ                          |
| ⚠️ ลืมเช็ค Out      | 🟤 จุดน้ำตาล      | `#795548` (Brown)      | มี scan IN แต่ไม่มี scan OUT                          |
| ⏳ ทำงานไม่ครบชม.   | 🟡🔶 จุดเหลืองส้ม | `#FF6F00` (Amber)      | สำหรับพนักงานนับชั่วโมง — ชม.จริง < ชม.ตามกะ          |
| 📌 OT ยังไม่ได้ขอ   | 🔷 จุดฟ้าเข้ม     | `#1565C0` (Dark Blue)  | ทำงานเกินเวลากะ แต่ยังไม่มีใบขอ OT                    |
| ❌ ขาดงาน           | ⬛ จุดเทาเข้ม     | `#616161` (Dark Gray)  | ไม่มีการลงเวลา ไม่มีใบลา                              |
| 📋 ลา               | 🔵 จุดน้ำเงิน     | `#2196F3` (Blue)       | มีใบลาที่ APPROVED                                    |
| 🏢 วันหยุดบริษัท    | 🟣 จุดม่วง        | `#9C27B0` (Purple)     | จาก `hrm_holidays`                                    |
| 🏖️ วันหยุดส่วนตัว   | 🩵 จุดฟ้าอ่อน     | `#03A9F4` (Light Blue) | จาก `hrm_personal_off_days`                           |

#### นิยาม "มาสาย":

```
เวลาเข้างานจริง (scan_time ของ scan_type = 'IN')
  เทียบกับ
เวลาเริ่มกะ (hrm_work_schedules.start_time)

ถ้า scan_time > start_time → "มาสาย"
  - สาย ≤ 15 นาที → แสดงสีเหลือง (เตือนปกติ)
  - สาย > 15 นาที  → แสดงสีแดง (เตือนเด่นชัด/แจ้งเตือน)
```

#### ปฏิทิน Clickable:

- **แต่ละวันในปฏิทินสามารถกดได้**
- กดแล้ว → นำไปที่แถบ **แบบฟอร์มคำขอ** ที่เกี่ยวข้องกับวันนั้น โดย **ส่งวันที่ไปด้วย**
- ตัวอย่าง: กดวันที่ 15/02/2026 → ไปหน้าแบบฟอร์มคำขอ พร้อม pre-fill วันที่ 15/02/2026
- สามารถเลือกสร้างคำขอได้เลย เช่น ขอลา / ขอ OT / ขอแก้เวลา ของวันนั้น

#### ปุ่มไปหน้า Check-in / Check-out:

- แสดงปุ่มเด่นบน Dashboard เช่น **"🕐 ลงเวลาเข้า-ออกงาน"**
- กดแล้วนำไปหน้าย่อย Check-in/Check-out (ดูหัวข้อ 6)

---

#### สำหรับหัวหน้า (ผู้ที่มีลูกน้อง — manager_id):

> **ขอบเขตลูกน้อง:** รวม **ทุกระดับ** (Recursive) — ลูกน้องตรง + ลูกน้องของลูกน้อง + ...

แสดงข้อมูลเพิ่มเติมในปฏิทิน:

| ข้อมูล                      | รายละเอียด                                             |
| :-------------------------- | :----------------------------------------------------- |
| จำนวนลูกน้องที่ต้องมาวันนี้ | นับจากตารางกะ (ไม่รวมวันหยุด/วันลา)                    |
| มาแล้วกี่คน                 | นับจาก `hrm_time_logs` ที่มี scan_type = IN            |
| ขาดกี่คน                    | ต้องมา − มาแล้ว − ลา                                   |
| ลากี่คน                     | จำนวนใบลา APPROVED ในวันนั้น                           |
| มาสายกี่คน                  | จำนวนที่ scan_time > start_time                        |
| **Hover (เอาเมาส์ไป)**      | แสดงรายชื่อพนักงานในแต่ละสถานะ                         |
| คำขอวันนี้                  | มีกี่อัน / เหลือ PENDING กี่อัน → กดลิงก์ไปหน้าอนุมัติ |

---

### 5.2 รายงานสรุปด้านล่าง Dashboard

| หัวข้อ                       | รายละเอียด                              | แหล่งข้อมูล                              |
| :--------------------------- | :-------------------------------------- | :--------------------------------------- |
| สถิติเดือนนี้ (รอบเงินเดือน) | จำนวนวัน: ขาดงาน / ลา / มาสาย           | `hrm_time_logs` + `hrm_leave_requests`   |
| วันหยุดเดือนนี้              | วันหยุดทั้งหมดกี่วัน / หยุดไปแล้วกี่วัน | `hrm_holidays` + `hrm_personal_off_days` |
| สิทธิ์การลาปีนี้             | ใช้ไปแล้ว / ทั้งหมด (แยกตามประเภทลา)    | `hrm_employee_leave_quotas`              |

---

## 6. หน้าย่อย Check-in / Check-out

> **เข้าถึง:** ผ่านปุ่มใน Dashboard — ไม่มีใน Sidebar

### 6.1 โหมดการ Check-in (2 โหมด)

ระบบจะกำหนดโหมดอัตโนมัติจากค่า `location_type` ใน `hrm_work_schedules` ของพนักงาน:

| โหมด                     | `location_type` | เงื่อนไข GPS                    | ข้อมูลเพิ่ม             |
| :----------------------- | :-------------- | :------------------------------ | :---------------------- |
| **ONSITE** (ในสถานที่)   | `OFFICE`        | ✅ ต้องอยู่ในรัศมีสาขา          | ไม่ต้องกรอกเหตุผล       |
| **OFFSITE** (นอกสถานที่) | `ANYWHERE`      | ✅ จับ GPS แต่ **ไม่เช็ครัศมี** | ต้องกรอกเหตุผล + แนบรูป |

### 6.2 Flow: ONSITE (ในสถานที่)

Logic อ้างอิงจาก `cico.php` (ระบบเดิม):

1. เข้าหน้า → ระบบขอ **สิทธิ์เข้าถึง GPS** จาก Browser/Device
2. แสดง **แผนที่ Google Maps** พร้อมตำแหน่งปัจจุบันของผู้ใช้
3. ระบบ **คำนวณระยะห่าง** จากพิกัดสาขาที่ผู้ใช้สังกัด (`core_branches.latitude`, `longitude`)
4. ถ้าอยู่ **ในรัศมี** (`core_branches.check_radius` — ค่าเริ่มต้น 200 เมตร) → เปิดปุ่ม
5. ถ้า **อยู่นอกรัศมี** → ปิดปุ่ม แสดงข้อความ "กรุณาอยู่ในพื้นที่สาขา"

### 6.3 Flow: OFFSITE (นอกสถานที่)

1. เข้าหน้า → ระบบขอ **สิทธิ์เข้าถึง GPS** จาก Browser/Device
2. แสดง **แผนที่ Google Maps** พร้อมตำแหน่งปัจจุบัน
3. ระบบ **ไม่ตรวจสอบรัศมี** — ปุ่ม Check-in เปิดเสมอ
4. ก่อนกด Check-in ต้อง:
   - กรอก **เหตุผลที่อยู่นอกสถานที่** (บังคับ)
   - **แนบรูปถ่าย/หลักฐาน** (บังคับ)
5. บันทึก `check_in_type = 'OFFSITE'` + เหตุผล + รูปแนบ

### 6.4 ข้อมูลที่ระบบบันทึก

| ข้อมูล                  | แหล่งที่มา                         | หมายเหตุ                |
| :---------------------- | :--------------------------------- | :---------------------- |
| `employee_id`           | ผู้ใช้ที่ Login                    |                         |
| `work_date`             | วันที่ปัจจุบัน (Logical Date)      |                         |
| `scan_time`             | เวลาจริงที่กดปุ่ม                  |                         |
| `scan_type`             | `IN` หรือ `OUT`                    |                         |
| `check_in_type`         | `ONSITE` หรือ `OFFSITE`            | **🆕 ฟิลด์ใหม่**        |
| `latitude`, `longitude` | พิกัด GPS ของผู้ใช้                | ทั้ง ONSITE และ OFFSITE |
| `location_name`         | ชื่อสาขา                           |                         |
| `distance_from_base`    | ระยะห่างจากสาขา (เมตร)             | OFFSITE อาจไม่คำนวณ     |
| `is_verified_location`  | `1` ถ้าอยู่ในรัศมี                 | OFFSITE = `0` เสมอ      |
| `offsite_reason`        | เหตุผลที่อยู่นอกสถานที่            | **🆕 เฉพาะ OFFSITE**    |
| `offsite_attachment`    | Path รูปถ่าย/หลักฐาน               | **🆕 เฉพาะ OFFSITE**    |
| `user_agent`            | ข้อมูล Browser/Device              |                         |
| `device_risk_flag`      | ตรวจจับ Shared Device (Sticky Tag) |                         |
| `ip_address`            | IP Address                         |                         |

> **อ้างอิง:** ตาราง `hrm_time_logs` จาก `siamgroup_v3_final.sql` (ต้องเพิ่มฟิลด์ใหม่ 3 ตัว: `check_in_type`, `offsite_reason`, `offsite_attachment`)

### 6.5 Shared Device Detection (Silent Audit)

- เก็บ `user_id` ใน `localStorage` (`cico_last_user_id`)
- เมื่อ Check-in ถ้า `localStorage` มี `user_id` ของคนอื่น → บันทึก `device_risk_flag`
- **ไม่บล็อก** การ Check-in — บันทึกเป็นหลักฐานเท่านั้น (Silent Audit)

### 6.6 UI ของหน้า Check-in/Check-out

- แสดง: ชื่อผู้ใช้, วันที่, สาขา, รูป Avatar
- แผนที่ Google Maps พร้อมตำแหน่งปัจจุบัน
- ปุ่ม **"บันทึกเข้างาน"** (สี Primary) หรือ **"บันทึกออกงาน"** (สี Error) ตามสถานะ
- แสดงเวลาปัจจุบัน + สถานะ (อยู่ในรัศมี / นอกรัศมี + ระยะห่าง)
- **กรณี OFFSITE:** แสดงฟอร์มเพิ่ม → ช่องกรอกเหตุผล + ปุ่มแนบรูปถ่าย

---

## 7. หน้าแบบฟอร์มคำขอ

### 7.1 รายการคำขอ

| #   | ประเภทคำขอ            | ตาราง DB                       |
| :-- | :-------------------- | :----------------------------- |
| 1   | ขอลา                  | `hrm_leave_requests`           |
| 2   | ขอ OT                 | `hrm_ot_requests`              |
| 3   | ขอแก้เวลา             | `hrm_time_correction_requests` |
| 4   | สลับวันหยุด/กะ        | `hrm_shift_swap_requests`      |
| 5   | เบิกเงินเดือนล่วงหน้า | 🔜 จะออกแบบตอนสร้าง            |
| 6   | ขอสลิปเงินเดือน       | 🔜 จะออกแบบตอนสร้าง            |
| 7   | คำขออื่นๆ             | 🔜 จะออกแบบตอนสร้าง            |

> **หมายเหตุ:** ฟอร์มข้อ 5-7 จะออกแบบรายละเอียดเพิ่มเติมเมื่อถึงขั้นตอนพัฒนา

---

### 7.2 ฟอร์มขอลา

| ช่อง                  | ประเภท                           | บังคับ | หมายเหตุ                           |
| :-------------------- | :------------------------------- | :----- | :--------------------------------- |
| ประเภทการลา           | Dropdown (จาก `hrm_leave_types`) | ✅     | ป่วย, กิจ, พักร้อน ฯลฯ             |
| รูปแบบการลา           | Radio: รายวัน / รายชั่วโมง       | ✅     | `leave_format`                     |
| วันที่เริ่มลา         | Date Picker                      | ✅     |                                    |
| วันที่สิ้นสุดลา       | Date Picker                      | ✅     |                                    |
| เวลาเริ่ม-เวลาสิ้นสุด | Time Picker                      | ⬜     | กรณีลาชั่วโมง                      |
| จำนวนวัน              | Auto-calculate                   | ✅     |                                    |
| เหตุผล                | Textarea                         | ⬜     |                                    |
| ไฟล์แนบ               | File Upload                      | ⬜     | ตาม `requires_file` ใน leave_types |
| ลาด่วน                | Checkbox                         | ⬜     | `is_urgent`                        |

**เงื่อนไข:** ตรวจสอบสิทธิ์วันลาคงเหลือจาก `hrm_employee_leave_quotas` ก่อนส่ง

---

### 7.3 ฟอร์มขอ OT

| ช่อง                 | ประเภท      | บังคับ | หมายเหตุ                                          |
| :------------------- | :---------- | :----- | :------------------------------------------------ |
| วันที่ทำ OT          | Date Picker | ✅     |                                                   |
| ประเภท OT            | Dropdown    | ✅     | OT_1_0 / OT_1_5 / OT_2_0 / OT_3_0 / SHIFT_PREMIUM |
| เวลาเริ่ม-สิ้นสุด    | Time Picker | ✅     |                                                   |
| เหตุผล/รายละเอียดงาน | Textarea    | ⬜     |                                                   |

**ประเภท OT:**

| Code            | คำอธิบาย                        |
| :-------------- | :------------------------------ |
| `OT_1_0`        | ทำงานวันหยุดปกติ (1 เท่า)       |
| `OT_1_5`        | OT วันทำงานปกติ (1.5 เท่า)      |
| `OT_2_0`        | ทำงานวันหยุดนักขัตฤกษ์ (2 เท่า) |
| `OT_3_0`        | OT วันหยุดนักขัตฤกษ์ (3 เท่า)   |
| `SHIFT_PREMIUM` | เบี้ยกะ                         |

> **หมายเหตุ:** วิธีคำนวณเงิน OT จะอยู่ใน PRD ระบบเงินเดือน (รอข้อมูลจากพี่ปอย)

---

### 7.4 ฟอร์มขอแก้เวลา

| ช่อง             | ประเภท        | บังคับ | หมายเหตุ         |
| :--------------- | :------------ | :----- | :--------------- |
| วันที่ต้องการแก้ | Date Picker   | ✅     |                  |
| เวลาเข้าเดิม     | แสดงอัตโนมัติ | —      | ดึงจาก time_logs |
| เวลาเข้าที่ขอแก้ | Time Picker   | ⬜     |                  |
| เวลาออกเดิม      | แสดงอัตโนมัติ | —      | ดึงจาก time_logs |
| เวลาออกที่ขอแก้  | Time Picker   | ⬜     |                  |
| เหตุผล           | Textarea      | ✅     |                  |
| ไฟล์แนบ          | File Upload   | ⬜     |                  |

---

### 7.5 ฟอร์มสลับวันหยุด/กะ

| ช่อง             | ประเภท          | บังคับ | หมายเหตุ               |
| :--------------- | :-------------- | :----- | :--------------------- |
| ประเภท           | Dropdown        | ✅     | SWAP / BANK / USE_BANK |
| พนักงานที่จะสลับ | Search/Dropdown | ⬜     | กรณี SWAP              |
| วันที่ของผู้ขอ   | Date Picker     | ✅     | วันหยุดเดิม            |
| วันที่เป้าหมาย   | Date Picker     | ⬜     | กรณี SWAP              |
| วันที่ใช้ Bank   | Date Picker     | ⬜     | กรณี USE_BANK          |
| เหตุผล           | Textarea        | ⬜     |                        |

**กรณี SWAP — เงื่อนไขพิเศษ:**

- **คนใดก็ได้** จาก 2 คน สามารถเป็นผู้คีย์คำร้อง
- เมื่อ **อนุมัติแล้ว** → ผลลัพธ์จะ **แสดงในทั้ง 2 คน** (ทั้งผู้ขอและพนักงานเป้าหมาย)
- ทั้ง 2 คนจะเห็นคำร้องนี้ในหน้า "คำขอของฉัน"

> **เงื่อนไขจาก Meeting:** สลับได้ในช่วง 21 ของเดือน ถึง 20 ของเดือนถัดไปเท่านั้น

---

### 7.6 Approval Flow (กระบวนการอนุมัติ)

```
พนักงานส่งคำขอ
    ↓
หัวหน้าโดยตรง (manager_id) ได้รับแจ้งเตือน (Email + Telegram)
    ↓
หัวหน้าอนุมัติ / ปฏิเสธ
    ↓
(ถ้าจำเป็น) หัวหน้าของหัวหน้า ได้รับแจ้งเตือน (Email + Telegram)
    ↓
ส่งแจ้งผลให้พนักงาน (Email + Telegram)
```

| สถานะ       | คำอธิบาย          |
| :---------- | :---------------- |
| `PENDING`   | รออนุมัติ         |
| `APPROVED`  | อนุมัติแล้ว       |
| `REJECTED`  | ปฏิเสธ            |
| `CANCELLED` | ยกเลิก (โดยผู้ขอ) |

**การแจ้งเตือน:** ผ่าน **Email** + **Telegram**

---

### 7.7 หน้ารวมคำขอของฉัน

- ตาราง/รายการ: ประเภทคำขอ, วันที่ส่ง, สถานะ, ผู้อนุมัติ
- กรองได้ตาม: ประเภท, สถานะ, ช่วงวันที่
- กดดูรายละเอียดแต่ละรายการได้
- สามารถ **ยกเลิก** คำขอที่ยังเป็น `PENDING` ได้

---

## 8. หน้าข้อมูลส่วนตัว (Profile)

### 8.1 ข้อมูลที่แสดง

| หมวด                 | ข้อมูล                                                                               | แหล่ง DB                             |
| :------------------- | :----------------------------------------------------------------------------------- | :----------------------------------- |
| **ข้อมูลส่วนตัว**    | ชื่อ-นามสกุล (TH/EN), ชื่อเล่น, เพศ, วันเกิด, เบอร์โทร, อีเมล, รูป Avatar            | `core_users`                         |
| **ข้อมูลการจ้างงาน** | รหัสพนักงาน, บริษัท, สาขา, แผนก, ตำแหน่ง, Level, วันเริ่มงาน, ประเภทเงินเดือน, สถานะ | `hrm_employees` + `core_*`           |
| **ประวัติการลา**     | รายการลาทั้งหมด พร้อมสถานะ                                                           | `hrm_leave_requests`                 |
| **ประวัติ OT**       | รายการ OT ทั้งหมด พร้อมสถานะ                                                         | `hrm_ot_requests`                    |
| **เอกสารอัปโหลด**    | เอกสารต่างๆ ของพนักงาน                                                               | `hrm_employee_documents` (ตารางใหม่) |

### 8.2 สิทธิ์การแก้ไข

| ข้อมูลที่แก้ไข      | ใครแก้ได้        |
| :------------------ | :--------------- |
| เบอร์โทร            | ✅ พนักงานแก้เอง |
| อีเมล               | ✅ พนักงานแก้เอง |
| รูป Avatar          | ✅ พนักงานแก้เอง |
| รหัสผ่าน (Password) | ✅ พนักงานแก้เอง |
| ชื่อ-นามสกุล        | 🔒 ต้องขอ HR แก้ |
| ที่อยู่             | 🔒 ต้องขอ HR แก้ |
| ข้อมูลการจ้างงาน    | 🔒 HR เท่านั้น   |

---

### 8.3 ระบบเอกสารอัปโหลด

> **สิทธิ์การอัปโหลด:** **HR เท่านั้น** — พนักงานสามารถ **ดู** เอกสารของตัวเองได้ แต่ไม่สามารถอัปโหลดเอง

#### ตารางใหม่ที่ต้องสร้าง: `hrm_employee_documents`

| Column          | Type               | คำอธิบาย                                     |
| :-------------- | :----------------- | :------------------------------------------- |
| `id`            | INT AUTO_INCREMENT | PK                                           |
| `employee_id`   | INT UNSIGNED       | FK → `hrm_employees.id` (ของใคร)             |
| `document_name` | VARCHAR(255)       | ชื่อเอกสาร (เช่น "บัตรประชาชน", "สัญญาจ้าง") |
| `file_path`     | VARCHAR(500)       | ที่อยู่ไฟล์                                  |
| `uploaded_at`   | DATETIME           | วันที่อัปโหลด                                |
| `uploaded_by`   | BIGINT UNSIGNED    | ผู้อัปโหลด — HR (FK → `core_users.id`)       |
| `created_at`    | TIMESTAMP          |                                              |
| `updated_at`    | TIMESTAMP          |                                              |

---

## 9. หลักการ Security-First Design

> **ความปลอดภัยเป็นอันดับ 1 ในทุกการออกแบบ**

### 9.1 Authentication Security

| มาตรการ                | รายละเอียด                                  |
| :--------------------- | :------------------------------------------ |
| JWT ใน HttpOnly Cookie | JS อ่าน Token ไม่ได้ → **กัน XSS**          |
| Secure Flag            | ส่งผ่าน HTTPS เท่านั้น → **กัน MITM**       |
| SameSite=Lax           | บล็อก cross-site request → **กัน CSRF**     |
| bcrypt Password Hash   | ใช้ cost factor ≥ 12                        |
| Rate Limiting          | จำกัด Login ผิด 5 ครั้ง → ล็อกชั่วคราว      |
| Error ไม่เปิดเผยข้อมูล | ไม่บอกว่า username ผิดหรือ password ผิด     |
| Token Blacklist        | Refresh Token ที่ Logout แล้วจะใช้ซ้ำไม่ได้ |

### 9.2 API Security

| มาตรการ                 | รายละเอียด                               |
| :---------------------- | :--------------------------------------- |
| API Key Authentication  | ทุก Request ต้องมี `X-API-Key` Header    |
| CORS Whitelist          | อนุญาตเฉพาะ domain ที่กำหนด              |
| PDO Prepared Statements | ป้องกัน **SQL Injection** ทุก query      |
| Input Validation        | ตรวจสอบ type + length + format ทุก input |
| Output Encoding         | Escape HTML → ป้องกัน **Stored XSS**     |

### 9.3 Data Security

| มาตรการ                | รายละเอียด                                            |
| :--------------------- | :---------------------------------------------------- |
| Row-Level Security     | ผู้ใช้เห็นเฉพาะข้อมูลที่ตัวเองมีสิทธิ์ (Level System) |
| File Upload Validation | ตรวจ MIME Type + ขนาดไฟล์ + rename ไฟล์               |
| Sensitive Data Masking | เลขบัตรประชาชน, เงินเดือน → แสดงบางส่วน               |
| Audit Trail            | บันทึกทุกการกระทำสำคัญ (Login, อนุมัติ, แก้ข้อมูล)    |

### 9.4 Check-in Security

| มาตรการ                 | รายละเอียด                                |
| :---------------------- | :---------------------------------------- |
| GPS Verification        | ตรวจพิกัดก่อน Check-in (ONSITE)           |
| Shared Device Detection | Silent Audit ด้วย localStorage Sticky Tag |
| IP + User Agent Logging | บันทึกทุกครั้งที่ Check-in                |

> **อ้างอิง:** `BACKEND_ARCHITECTURE.md` (Security Layers)

---

## 10. ข้อกำหนดทางเทคนิค (Technical Notes)

| หัวข้อ              | รายละเอียด                                                |
| :------------------ | :-------------------------------------------------------- |
| **Frontend**        | React (JSX) + MUI v7 + Vite                               |
| **Backend**         | Pure PHP (RESTful API, Model-Based)                       |
| **Database**        | MySQL (PDO Prepared Statements)                           |
| **Authentication**  | JWT Token ใน HttpOnly Cookie (Access 15-30m + Refresh 7d) |
| **แจ้งเตือน**       | Email + Telegram                                          |
| **แผนที่**          | Google Maps JavaScript API                                |
| **GPS**             | HTML5 Geolocation API                                     |
| **PHP JWT Library** | `firebase/php-jwt`                                        |

> **อ้างอิง:** `FRONTEND_STANDARDS.md`, `BACKEND_ARCHITECTURE.md`, `THEME_SUMMARY.md`

---

## 11. เอกสารอ้างอิง

| เอกสาร                       | ใช้อ้างอิงในส่วน                 |
| :--------------------------- | :------------------------------- |
| `project_summary_v3.md`      | โครงสร้างระบบ, ตาราง DB          |
| `BACKEND_ARCHITECTURE.md`    | สถาปัตยกรรม Backend, Security    |
| `FRONTEND_STANDARDS.md`      | มาตรฐาน Frontend, Authentication |
| `THEME_SUMMARY.md`           | Design System, Login page        |
| `Meeting HR 23 Feb.txt`      | Requirements จากการประชุม        |
| `siamgroup_v3_final.sql`     | Schema DB                        |
| `cico.php`                   | Logic Check-in/Check-out         |
| `system-siamgroup-models.md` | UI Structure (Navbar/Sidebar)    |

---

## 12. Open Questions

> ✅ **ไม่มีคำถามค้าง** — PRD ฉบับนี้สมบูรณ์แล้ว
