# PRD #03: ระบบเงินเดือน (Payroll System)

**Project:** SiamGroup V3.1
**Version:** 1.2
**วันที่:** 2026-03-04
**ผู้เขียน:** Product Manager (AI)
**สถานะ:** ✅ สมบูรณ์ v1.2 Final — ปิดทุก Open Questions

> **เอกสารนี้ครอบคลุม:** การคำนวณเงินเดือน, OT, รายได้/เงินหัก, เบิกล่วงหน้า, กู้ยืม, สลิปเงินเดือน, หนังสือรับรอง, โบนัส

---

## 1. ภาพรวม (Overview)

ระบบเงินเดือนทำหน้าที่:

- คำนวณเงินเดือนอัตโนมัติทุกเดือน (รอบ 21-20)
- จัดการรายได้/เงินหักแบบ Configurable (เพิ่ม/ลด/เปิด/ปิดหัวข้อได้)
- จัดการเบิกเงินเดือนล่วงหน้าและกู้ยืม
- ออกสลิปเงินเดือนออนไลน์ + PDF
- ออกหนังสือรับรอง (การทำงาน / เงินเดือน)
- คำนวณโบนัสประจำปี

### 1.1 ผู้ใช้งาน

| กลุ่มผู้ใช้         | การเข้าถึง                                                         |
| :------------------ | :----------------------------------------------------------------- |
| HR                  | เข้าถึงทุกเมนู Payroll — คำนวณ, Review, สรุป, ออกเอกสาร            |
| IT                  | เข้าถึงทุกเมนู Payroll (`is_cross_company`)                        |
| ผู้บริหาร / หัวหน้า | ดูสรุปเงินเดือนลูกน้อง, อนุมัติเบิกล่วงหน้า (ตาม Level Visibility) |
| พนักงานทั่วไป       | ดูสลิปตัวเอง, ขอเบิกล่วงหน้า, ดาวน์โหลดหนังสือรับรอง               |

> **อ้างอิง:** สิทธิ์ทั้งหมดควบคุมโดย `core_level_permissions` → ดู PRD #00

### 1.2 เอกสารอ้างอิง

| เอกสาร                                  | ใช้ในส่วน                      |
| :-------------------------------------- | :----------------------------- |
| `ref/Meeting HR 23 Feb.txt`             | Requirements ทั้งหมด           |
| `ref/siamgroup_v3_final.sql`            | DB Schema                      |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md` | โครงสร้างสิทธิ์                |
| `PRD/PRD_02_HR_SYSTEM.md` Section 11    | ข้อมูล OT ที่ตกลงแล้ว          |
| `PRD/PRD_02_HR_SYSTEM.md` Section 12    | ระบบประเมิน/โบนัส (เกณฑ์คะแนน) |

---

## 2. รอบเงินเดือนและขั้นตอน (Payroll Cycle & Process)

### 2.1 รอบเงินเดือน

| รายการ      | ค่า                            |
| :---------- | :----------------------------- |
| เริ่มรอบ    | วันที่ **21** ของเดือนก่อน     |
| สิ้นสุดรอบ  | วันที่ **20** ของเดือนปัจจุบัน |
| วันจ่ายเงิน | วันที่ **1** ของเดือนถัดไป     |

> **ตัวอย่าง:** รอบ ก.พ. 2026 = 21 ม.ค. — 20 ก.พ. → จ่าย 1 มี.ค.

### 2.2 ขั้นตอนการทำ Payroll (Monthly Flow)

```
วันที่ 20 (สิ้นรอบ)
    │
    ▼
[1] ระบบคำนวณอัตโนมัติ ─────────────── Status: DRAFT
    │  - เงินเดือนฐาน
    │  - OT (จาก hrm_ot_requests ที่ APPROVED)
    │  - ทำงานวันหยุด
    │  - ประกันสังคม
    │  - ภาษีหัก ณ ที่จ่าย (ประมาณการ)
    │  - เบิกเงินเดือนล่วงหน้า (ที่อนุมัติแล้ว)
    │  - ผ่อนกู้ยืม (งวดเดือนนี้)
    ▼
[2] HR Review & แก้ไข ──────────────── Status: REVIEWING
    │  - ตรวจสอบข้อมูลที่ระบบคำนวณ
    │  - เพิ่ม/แก้ไขรายได้อื่น + เงินหักอื่น (Manual Items)
    │  - Override ภาษีถ้าจำเป็น
    ▼
[3] HR Finalize ────────────────────── Status: FINALIZED
    │  - Lock ข้อมูล (แก้ไขไม่ได้)
    │  - สลิปเงินเดือนพร้อมให้พนักงานดู
    ▼
วันที่ 1 (จ่ายเงิน) ──────────────── Status: PAID
```

> **ตาราง:** `pay_payroll_periods` — เก็บสถานะรอบเงินเดือนแต่ละเดือน

---

## 3. การคำนวณเงินเดือน (Salary Calculation)

### 3.1 สูตรสรุป

```
  เงินเดือนฐาน (Base Salary)
+ OT วันธรรมดา (OT Regular)
+ OT วันหยุด (OT Holiday)
+ ค่าทำงานวันหยุด (Holiday Work Pay)
+ รายได้อื่น (Manual Income Items)
═══════════════════════════════════
= รวมรายได้ (Total Income)

- ประกันสังคม (Social Security)
- ภาษีหัก ณ ที่จ่าย (Withholding Tax)
- เบิกเงินเดือนล่วงหน้า (Salary Advance)
- ผ่อนกู้ยืม (Loan Payment)
- เงินหักอื่น (Manual Deduction Items)
═══════════════════════════════════
= รวมเงินหัก (Total Deduction)

💰 เงินเดือนสุทธิ = รวมรายได้ - รวมเงินหัก
```

### 3.2 เงินเดือนฐาน (Base Salary)

| ประเภท (`salary_type`) | สูตร                               | หมายเหตุ                    |
| :--------------------- | :--------------------------------- | :-------------------------- |
| `MONTHLY`              | `base_salary` เต็มจำนวน            | ได้เต็มเงินเดือนทุกเดือน    |
| `DAILY`                | `base_salary ÷ 30 × วันที่มาทำงาน` | นับจาก `hrm_time_logs` (IN) |
| `JOB_BASED`            | ตาม HR กำหนด (Manual)              | ใส่ยอดเอง                   |

> **แหล่งข้อมูล:** `hrm_employees.salary_type` + `hrm_employees.base_salary`

### 3.3 จำนวนวันทำงาน (สำหรับ DAILY)

- นับจาก `hrm_time_logs` ที่มี `scan_type = 'IN'` ในรอบ 21-20
- **ไม่นับซ้ำ** — 1 `work_date` = 1 วัน (ถึงจะสแกนหลายครั้ง)
- วันลาที่ `is_paid = 1` → **นับเป็นวันทำงาน** (ไม่หักเงิน)
- วันลาที่ `is_paid = 0` → **ไม่นับ** (หักเงิน)

---

## 4. การคำนวณ OT (Configurable OT Engine)

> **อ้างอิง:** Meeting HR 23 Feb, ระเบียบสวัสดิการ SXD
> **หลักการ:** ระบบ OT แบบ Configurable — เก็บประเภท OT เป็น Master Data, เพิ่ม/แก้ไขได้, กำหนดขอบเขตตามบริษัท/สาขา

### 4.1 วิธีคำนวณ OT — 3 แบบ

| `calc_method` | คำอธิบาย                                           | ตัวอย่าง            |
| :------------ | :------------------------------------------------- | :------------------ |
| `FORMULA`     | `ฐาน × Multiplier` (ฐาน = เงินเดือน÷30÷8 หรือ ÷30) | OT ตามกม. (DHL)     |
| `FIXED_RATE`  | อัตราคงที่ บาท/ชม. (แบ่ง Tier ตามเงินเดือนได้)     | OT ออฟฟิศ CarRental |
| `TIME_SLOT`   | จำนวนเงินตามช่วงเวลา (Flat ต่อ Segment, สะสม)      | CNX Shift Premium   |

### 4.2 ขอบเขตประเภท OT

| ขอบเขต              | คำอธิบาย                                                       |
| :------------------ | :------------------------------------------------------------- |
| `company_id = NULL` | ใช้กับทุกบริษัท                                                |
| `company_id = X`    | ใช้เฉพาะบริษัท X                                               |
| `branch_id = NULL`  | ใช้กับทุกสาขาของบริษัท                                         |
| `branch_id = Y`     | ใช้เฉพาะสาขา Y (เช่น CNX ใช้เฉพาะสาขา CNX แต่เพิ่มสาขาอื่นได้) |

### 4.3 ประเภท OT ที่มีตอนนี้

#### กลุ่ม A: DHL (SXD, SPD) — FORMULA

| Code                       | ชื่อ                   | ฐาน            | Multiplier | ขอบเขต   |
| :------------------------- | :--------------------- | :------------- | :--------- | :------- |
| `OT_REGULAR_DHL`           | OT วันธรรมดา           | HOURLY (÷30÷8) | ×1.5       | SXD, SPD |
| `HOLIDAY_WORK_MONTHLY_DHL` | ทำงานวันหยุด (MONTHLY) | DAILY (÷30)    | ×1.0       | SXD, SPD |
| `HOLIDAY_WORK_DAILY_DHL`   | ทำงานวันหยุด (DAILY)   | DAILY (÷30)    | ×2.0       | SXD, SPD |
| `OT_HOLIDAY_DHL`           | OT วันหยุด             | HOURLY (÷30÷8) | ×3.0       | SXD, SPD |

**ตัวอย่าง:** พนักงาน SXD เงินเดือน 18,000 ทำ OT วันธรรมดา 3 ชม.
→ `(18,000 ÷ 30 ÷ 8) × 1.5 × 3 = 75 × 1.5 × 3 = 337.50 บาท`

#### กลุ่ม B: CarRental (SDR, SAR) — FIXED_RATE + FORMULA

| Code                   | ชื่อ                   | วิธี       | อัตรา                   | ขอบเขต   |
| :--------------------- | :--------------------- | :--------- | :---------------------- | :------- |
| `OT_OFFICE_REG_CAR`    | OT ออฟฟิศ วันธรรมดา    | FIXED_RATE | <20k: 70, ≥20k: 90 ×1.0 | SDR, SAR |
| `OT_OFFICE_HOL_CAR`    | OT ออฟฟิศ วันหยุด      | FIXED_RATE | <20k: 70, ≥20k: 90 ×1.5 | SDR, SAR |
| `OT_SALES_CAR`         | OT เซลล์               | FIXED_RATE | 90 บาท/ชม. ×1.0         | SDR, SAR |
| `HOLIDAY_WORK_REG_CAR` | ทำงานวันหยุดปกติ       | FORMULA    | DAILY ×1.0              | SDR, SAR |
| `HOLIDAY_WORK_NAT_CAR` | ทำงานวันหยุดนักขัตฤกษ์ | FORMULA    | DAILY ×1.5              | SDR, SAR |

**เงื่อนไข OT ออฟฟิศ:** ต้องทำงานล่วงเวลา **เกิน 1 ชั่วโมงเต็ม** จึงจะได้ OT (`min_hours = 1`)

**ตัวอย่าง:** พนักงาน SDR เงินเดือน 18,000 ทำ OT วันธรรมดา 3 ชม.
→ `70 × 1.0 × 3 = 210 บาท`

#### กลุ่ม C: CNX Shift Premium — TIME_SLOT

| Code                | ชื่อ              | วิธี      | ขอบเขต                                      |
| :------------------ | :---------------- | :-------- | :------------------------------------------ |
| `CNX_SHIFT_PREMIUM` | Shift Premium CNX | TIME_SLOT | **เฉพาะสาขา CNX** (เพิ่มสาขาอื่นได้ภายหลัง) |

**ช่วงเวลาและอัตรา (สะสม):**

| ช่วงเวลา    | เพิ่ม (บาท) |
| :---------- | :---------- |
| 17:01-19:59 | +100        |
| 20:00-22:00 | +200        |
| 22:01-23:59 | +300        |
| 00:00-01:59 | +500        |
| 02:00-03:59 | +600        |
| 04:00-05:00 | +300        |
| 05:01-06:00 | +200        |
| 06:59-07:59 | +100        |

**ตัวอย่าง:** ทำงาน 17:01–01:59 → `100 + 200 + 300 + 500 = 1,100 บาท`

> **SAR vs SDR → ใช้กฎเดียวกันก่อน** (รอสรุปกับพี่แนน)

### 4.4 DB Schema สำหรับ OT (3 ตาราง)

#### 🆕 `pay_ot_types` (Master: ประเภท OT)

```sql
CREATE TABLE `pay_ot_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name_th` VARCHAR(100) NOT NULL,
    `calc_method` ENUM('FORMULA','FIXED_RATE','TIME_SLOT') NOT NULL,
    `formula_base` ENUM('HOURLY','DAILY') NULL COMMENT 'HOURLY=÷30÷8, DAILY=÷30 (ใช้กับ FORMULA)',
    `multiplier` DECIMAL(3,1) NULL COMMENT 'ตัวคูณ (ใช้กับ FORMULA)',
    `min_hours` DECIMAL(3,1) DEFAULT 0 COMMENT 'ชม.ขั้นต่ำ (0=ไม่มี)',
    `company_id` INT NULL COMMENT 'NULL=ทุกบ., มีค่า=เฉพาะบ.นี้',
    `branch_id` INT NULL COMMENT 'NULL=ทุกสาขา, มีค่า=เฉพาะสาขานี้',
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'ประเภท OT (Configurable)';
```

#### 🆕 `pay_ot_fixed_rates` (Tier อัตราตามเงินเดือน)

```sql
CREATE TABLE `pay_ot_fixed_rates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ot_type_id` INT NOT NULL COMMENT 'FK → pay_ot_types.id',
    `salary_min` DECIMAL(12,2) NOT NULL DEFAULT 0,
    `salary_max` DECIMAL(12,2) NULL COMMENT 'NULL = ไม่จำกัด',
    `rate_per_hour` DECIMAL(10,2) NOT NULL,
    `multiplier` DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    CONSTRAINT `fk_fixedrate_ottype` FOREIGN KEY (`ot_type_id`) REFERENCES `pay_ot_types` (`id`) ON DELETE CASCADE
) COMMENT = 'อัตรา OT แบบ Fixed (แบ่งตามเงินเดือน)';
```

#### 🆕 `pay_ot_time_slots` (ช่วงเวลา Shift Premium)

```sql
CREATE TABLE `pay_ot_time_slots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ot_type_id` INT NOT NULL COMMENT 'FK → pay_ot_types.id',
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL COMMENT 'จำนวนเงิน Flat ต่อ Segment',
    `sort_order` INT DEFAULT 0,
    CONSTRAINT `fk_timeslot_ottype` FOREIGN KEY (`ot_type_id`) REFERENCES `pay_ot_types` (`id`) ON DELETE CASCADE
) COMMENT = 'ช่วงเวลา OT แบบ Time Slot (CNX)';
```

### 4.5 การเปลี่ยนแปลง `hrm_ot_requests`

```diff
- `ot_type` ENUM('OT_1_5','OT_1_0','OT_2_0','OT_3_0','SHIFT_PREMIUM')
+ `ot_type_id` INT NOT NULL COMMENT 'FK → pay_ot_types.id'
```

> ⚠️ **Breaking Change:** เปลี่ยน ENUM เป็น FK → ต้อง Migrate ข้อมูลเดิม

### 4.6 Flow เมื่อพนักงานขอ OT

```
พนักงานกดขอ OT
    │
    ▼
ระบบแสดงประเภท OT ที่ match กับ:
  ✓ company_id = บ.ของพนักงาน หรือ NULL
  ✓ branch_id = สาขาของพนักงาน หรือ NULL
  ✓ is_active = 1
    │
    ▼
พนักงานเลือกประเภท + กรอกเวลาเริ่ม/สิ้นสุด
    │
    ▼
ระบบคำนวณเงินตามวิธีของประเภทนั้น (แสดงยอดให้ดูก่อนส่ง)
    │
    ▼
ส่งให้หัวหน้าอนุมัติ → HR อนุมัติ
    │
    ▼ (APPROVED)
เงินเข้า pay_payroll_items → OT_PAY
```

### 4.7 แหล่งข้อมูล OT สำหรับ Payroll

- ดึงจาก `hrm_ot_requests` ที่ `status = APPROVED` ในรอบ 21-20
- ดึง `ot_type_id` → หาวิธีคำนวณจาก `pay_ot_types`
- คำนวณเป็นเงินตามวิธี → ใส่ `pay_payroll_items` ประเภท `OT_PAY`

---

## 5. หัวข้อรายได้และเงินหัก (Configurable Payroll Items)

### 5.1 แนวคิด

> **อ้างอิง Meeting HR:** "เพิ่มหัวข้อในการรับเงินเงินได้ / เงินหัก กี่อันก็ได้"

ระบบมี **Master List** ของหัวข้อรายได้/เงินหัก → HR สามารถ:

- ✅ **เพิ่ม** หัวข้อใหม่
- ✅ **ลบ** หัวข้อที่ไม่ใช้ (ถ้าไม่ใช่ System Item)
- ✅ **เปิด/ปิด** หัวข้อ → เปิดอยู่จึงแสดงในสลิป
- ✅ ถ้าพนักงานไม่มียอดในหัวข้อนั้น → **แสดงว่างไว้**

### 5.2 ประเภทหัวข้อ

| `type`      | คำอธิบาย | ตัวอย่าง                             |
| :---------- | :------- | :----------------------------------- |
| `INCOME`    | รายได้   | เบี้ยประชุม, เบี้ยเลี้ยง, คอมมิชชั่น |
| `DEDUCTION` | เงินหัก  | หักเงินกู้สหกรณ์, ค่าหอพัก           |

### 5.3 วิธีคำนวณ

| `calc_type` | คำอธิบาย     | ตัวอย่าง                                          |
| :---------- | :----------- | :------------------------------------------------ |
| `AUTO`      | ระบบคำนวณเอง | เงินเดือนฐาน, OT, ประกันสังคม, ภาษี, เบิกล่วงหน้า |
| `MANUAL`    | HR กรอกเอง   | เบี้ยเลี้ยง, ค่าที่พัก, หักค่าเช่าหอพัก           |

### 5.4 System Items (ห้ามลบ — `is_system = 1`)

| Code              | ชื่อ                | Type      | Calc |
| :---------------- | :------------------ | :-------- | :--- |
| `BASE_SALARY`     | เงินเดือนฐาน        | INCOME    | AUTO |
| `OT_PAY`          | ค่าล่วงเวลา         | INCOME    | AUTO |
| `HOLIDAY_WORK`    | ค่าทำงานวันหยุด     | INCOME    | AUTO |
| `SOCIAL_SECURITY` | ประกันสังคม         | DEDUCTION | AUTO |
| `WITHHOLDING_TAX` | ภาษีหัก ณ ที่จ่าย   | DEDUCTION | AUTO |
| `SALARY_ADVANCE`  | หักเบิกเงินล่วงหน้า | DEDUCTION | AUTO |
| `LOAN_PAYMENT`    | หักผ่อนกู้ยืม       | DEDUCTION | AUTO |

> **Custom Items** ที่ HR สร้างเอง → `is_system = 0`, `calc_type = 'MANUAL'`

### 5.5 ตัวอย่างหัวข้อ Custom (จาก Meeting HR)

| Code          | ชื่อ                   | Type      |
| :------------ | :--------------------- | :-------- |
| `MEETING_FEE` | เบี้ยประชุม            | INCOME    |
| `ALLOWANCE`   | เบี้ยเลี้ยงต่างจังหวัด | INCOME    |
| `COMMISSION`  | คอมมิชชั่น             | INCOME    |
| `DRIVING_PAY` | ค่าขับรถ               | INCOME    |
| `DORM_FEE`    | ค่าหอพัก               | DEDUCTION |

> **เบี้ยเลี้ยงต่างจังหวัด:** Fix 250 บาท/วัน (จาก Meeting HR) → HR กรอก จำนวนวัน × 250

---

## 6. ประกันสังคมและภาษี (Social Security & Tax)

### 6.1 ประกันสังคม

| รายการ      | ค่า                                           |
| :---------- | :-------------------------------------------- |
| อัตรา       | **5%** ของเงินเดือนฐาน                        |
| เพดานสูงสุด | **750 บาท/เดือน** (ฐานเงินเดือนสูงสุด 15,000) |
| เพดานต่ำสุด | **83 บาท/เดือน** (ฐานเงินเดือนต่ำสุด 1,650)   |

**สูตร:** `MIN(base_salary × 0.05, 750)`

> ระบบคำนวณอัตโนมัติ — HR ไม่ต้องกรอก

### 6.2 ภาษีหัก ณ ที่จ่าย (Withholding Tax)

**วิธีคำนวณ: ประมาณการอัตโนมัติ + HR Override**

**ขั้นตอน Auto-Calculate:**

1. ประมาณรายได้ทั้งปี = `รายได้เดือนนี้ × เดือนที่เหลือ + รายได้สะสม`
2. หักค่าลดหย่อน:
   - ค่าลดหย่อนส่วนตัว: 60,000 บาท
   - ประกันสังคมทั้งปี: `เงินประกันสังคม × 12`
3. คำนวณภาษีตามอัตราก้าวหน้า:

| รายได้สุทธิ (บาท/ปี)  | อัตราภาษี |
| :-------------------- | :-------- |
| 0 – 150,000           | 0%        |
| 150,001 – 300,000     | 5%        |
| 300,001 – 500,000     | 10%       |
| 500,001 – 750,000     | 15%       |
| 750,001 – 1,000,000   | 20%       |
| 1,000,001 – 2,000,000 | 25%       |
| 2,000,001 – 5,000,000 | 30%       |
| > 5,000,000           | 35%       |

4. ภาษีรายเดือน = `ภาษีทั้งปี ÷ เดือนที่เหลือ`

**HR Override:** HR สามารถแก้ไขยอดภาษีรายเดือนสำหรับพนักงานแต่ละคนได้ (กรณีมีค่าลดหย่อนเพิ่มเติม เช่น คู่สมรส, บุตร, ประกันชีวิต)

---

## 7. เบิกเงินเดือนล่วงหน้า (Salary Advance)

### 7.1 เงื่อนไข

| รายการ          | ค่า                                                    |
| :-------------- | :----------------------------------------------------- |
| จำนวนที่เบิกได้ | ตามจำนวนวันที่มาทำงานแล้วในรอบเดือนนั้นๆ               |
| สูตรเพดาน       | `base_salary ÷ 30 × วันที่มาทำงานแล้ว`                 |
| ผู้อนุมัติ      | **หัวหน้า** + **HR** ทั้ง 2 ต้องอนุมัติ (ใครก่อนก็ได้) |
| หักเงิน         | หักในสรุปเงินเดือนเดือนนั้นๆ อัตโนมัติ                 |

### 7.2 ขั้นตอน

```
พนักงานยื่นคำขอเบิก
    │
    ▼
┌─────────────────────────────────────┐
│  Dual Approval (ใครก่อนก็ได้)        │
│                                     │
│  หัวหน้า: PENDING → APPROVED        │
│  HR:      PENDING → APPROVED        │
│                                     │
│  ✅ ทั้ง 2 APPROVED → Overall APPROVED │
│  ❌ ใครคนใด REJECTED → Overall REJECTED │
└─────────────────────────────────────┘
    │
    ▼ (Overall APPROVED)
ระบบหักในรอบเงินเดือนถัดไปอัตโนมัติ
```

### 7.3 หน้าคำขอเบิก (พนักงาน)

| ฟิลด์           | คำอธิบาย                           |
| :-------------- | :--------------------------------- |
| จำนวนเงิน       | กรอกเอง (ไม่เกินเพดาน)             |
| เหตุผล          | Text                               |
| เพดานที่เบิกได้ | แสดงให้เห็น (คำนวณจากวันทำงานแล้ว) |
| รอบเงินเดือน    | แสดงรอบปัจจุบัน                    |

### 7.4 หน้าอนุมัติ (หัวหน้า / HR)

| ข้อมูล       | แหล่งข้อมูล                  |
| :----------- | :--------------------------- |
| ชื่อผู้ขอ    | `core_users`                 |
| จำนวนเงิน    | `pay_salary_advances.amount` |
| เพดาน        | คำนวณ real-time              |
| สถานะหัวหน้า | `manager_status`             |
| สถานะ HR     | `hr_status`                  |
| Actions      | อนุมัติ / ปฏิเสธ             |

---

## 8. กู้ยืม (Loan)

### 8.1 ข้อมูลเงินกู้

| ฟิลด์           | คำอธิบาย                             |
| :-------------- | :----------------------------------- |
| พนักงาน         | เลือกจาก dropdown                    |
| ยอดเงินกู้      | จำนวนเงินที่กู้                      |
| มีดอกเบี้ย      | ✅ มี / ❌ ไม่มี (Toggle)            |
| อัตราดอกเบี้ย   | % ต่อปี (ถ้ามี — 0 ถ้าไม่มี)         |
| ยอดผ่อนต่อเดือน | จำนวนเงินหักต่อเดือน                 |
| จำนวนงวด        | คำนวณอัตโนมัติ หรือ HR กำหนดเอง      |
| วันที่เริ่มหัก  | เดือนแรกที่จะเริ่มหักจากเงินเดือน    |
| สถานะ           | `ACTIVE` / `COMPLETED` / `CANCELLED` |

### 8.2 การหักเงินกู้ในเงินเดือน

- ระบบดึงเงินกู้ที่ `status = ACTIVE` + `start_date ≤ เดือนปัจจุบัน`
- หักยอดผ่อนต่อเดือนอัตโนมัติ → บันทึกใน `pay_loan_payments`
- เมื่อผ่อนครบ → เปลี่ยน status เป็น `COMPLETED`

### 8.3 หน้าจัดการกู้ยืม (HR)

**ตัวกรอง:** บริษัท / สาขา / พนักงาน / สถานะ

| ข้อมูลที่แสดง   | คำอธิบาย           |
| :-------------- | :----------------- |
| พนักงาน         | ชื่อ-นามสกุล       |
| ยอดกู้          | จำนวนเงินต้น       |
| อัตราดอกเบี้ย   | % ต่อปี            |
| ผ่อนต่อเดือน    | บาท                |
| จำนวนงวดทั้งหมด | งวด                |
| ผ่อนไปแล้ว      | งวด + จำนวนเงิน    |
| คงเหลือ         | ยอดเงินคงเหลือ     |
| สถานะ           | ACTIVE / COMPLETED |

### 8.4 ดอกเบี้ย (Flat Rate)

**สูตร:**

- ดอกเบี้ยรวม = `ยอดกู้ × อัตราดอกเบี้ย(%) × (จำนวนงวด ÷ 12)`
- ยอดผ่อนต่อเดือน = `(ยอดกู้ + ดอกเบี้ยรวม) ÷ จำนวนงวด`

**ตัวอย่าง:** กู้ 30,000 บาท ดอกเบี้ย 5%/ปี ผ่อน 12 งวด

- ดอกเบี้ยรวม = `30,000 × 0.05 × (12÷12)` = 1,500 บาท
- ยอดผ่อน/เดือน = `(30,000 + 1,500) ÷ 12` = 2,625 บาท

> **กรณีไม่มีดอกเบี้ย:** ยอดผ่อน/เดือน = `ยอดกู้ ÷ จำนวนงวด`

---

## 9. สรุปเงินเดือน (Payroll Closing)

### 9.1 หน้า Payroll Dashboard (HR)

**ตัวกรอง:** บริษัท / สาขา / เดือน-ปี

**ข้อมูลที่แสดง:**

| ส่วน                  | รายละเอียด                           |
| :-------------------- | :----------------------------------- |
| สถานะรอบ              | DRAFT / REVIEWING / FINALIZED / PAID |
| จำนวนพนักงาน          | แสดงจำนวนทั้งหมดในรอบ                |
| รวมเงินเดือนฐาน       | ผลรวม base_salary ทุกคน              |
| รวม OT                | ผลรวม OT pay ทุกคน                   |
| รวมรายได้อื่น         | ผลรวม manual income items            |
| รวมรายได้ทั้งหมด      | Total Income                         |
| รวมประกันสังคม        | ผลรวม social security                |
| รวมภาษี               | ผลรวม withholding tax                |
| รวมเงินหักอื่น        | ผลรวม deduction items                |
| รวมเงินหักทั้งหมด     | Total Deduction                      |
| **รวมเงินเดือนสุทธิ** | **Total Net Pay**                    |

### 9.2 ตาราง Payroll รายบุคคล

| Column       | คำอธิบาย                         |
| :----------- | :------------------------------- |
| รหัสพนักงาน  | `hrm_employees.employee_code`    |
| ชื่อ-นามสกุล | `core_users.first_name_th` + ... |
| แผนก         | `core_departments.name`          |
| เงินเดือนฐาน | base_salary                      |
| OT           | ค่า OT รวม                       |
| รายได้อื่น   | รวม manual income                |
| รวมรายได้    | total_income                     |
| ประกันสังคม  | social security                  |
| ภาษี         | withholding tax                  |
| เบิกล่วงหน้า | salary advance                   |
| ผ่อนกู้      | loan payment                     |
| เงินหักอื่น  | รวม manual deduction             |
| รวมเงินหัก   | total_deduction                  |
| **สุทธิ**    | **net_pay**                      |
| สถานะ        | ปกติ / มีหมายเหตุ                |

**Actions:**

- 🔍 ดูรายละเอียดรายบุคคล (Drill-down → ดูทุก payroll item)
- ✏️ แก้ไข (เฉพาะ Status = REVIEWING)
- 📋 Export Excel / PDF

### 9.3 ขั้นตอน Finalize

1. HR ตรวจสอบข้อมูลทุกคน → กดปุ่ม **"Finalize"**
2. ระบบถาม Confirm → **Lock** ข้อมูลทั้งรอบ
3. สลิปเงินเดือนพร้อมให้พนักงานดู
4. เมื่อจ่ายเงินแล้ว → HR กด **"Mark as Paid"**

> ⚠️ **หลัง Finalize แล้วแก้ไขไม่ได้** — ถ้าต้องแก้ต้อง "Reopen" (กลับเป็น REVIEWING)

### 9.4 สรุปเงินเดือน — รายงานรายเดือนและรายปี

> **อ้างอิง Meeting HR:** "ขอฟังก์ชั่นเงินเดือน รายได้อื่นๆ รวมถึงสรุปทั้งปีหรือกดเป็นรายเดือนได้จะได้รู้ว่าแต่ละช่วงเวลา เราจ่ายไปแล้วเท่าไหร่ เงินเดือนเพียวเท่าไหร่"

**ตัวกรอง:** ช่วงเวลา (รายเดือน / รายปี), บริษัท / สาขา / แผนก

| มุมมอง     | ข้อมูล                                                    |
| :--------- | :-------------------------------------------------------- |
| รายเดือน   | เงินเดือนฐานรวม, OT รวม, รายได้อื่นรวม, เงินหักรวม, สุทธิ |
| รายปี      | สรุปรายเดือนทั้ง 12 เดือน + ยอดรวมทั้งปี                  |
| แยกตาม บ.  | เทียบเงินเดือนรวมแต่ละบริษัท                              |
| แยกตามแผนก | เทียบเงินเดือนรวมแต่ละแผนก                                |

---

## 10. สลิปเงินเดือน (Payslip)

### 10.1 การเข้าถึง

| ผู้ใช้  | สิทธิ์                               |
| :------ | :----------------------------------- |
| พนักงาน | ดูสลิปตัวเอง (หลัง Finalize)         |
| HR      | ดูสลิปทุกคน + พิมพ์/ดาวน์โหลด        |
| หัวหน้า | ดูสลิปลูกน้อง (ตาม Level Visibility) |

### 10.2 รูปแบบสลิป

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo บริษัท]        สลิปเงินเดือน (Pay Slip)               │
│                       ประจำเดือน: กุมภาพันธ์ 2026              │
│                       รอบ: 21/01/2026 - 20/02/2026            │
├──────────────────────────────────────────────────────────────┤
│  ชื่อ: นายสมชาย ใจดี         รหัส: EMP-0001                  │
│  แผนก: ปฏิบัติการ             ตำแหน่ง: พนักงานขับรถ            │
│  สาขา: สำนักงานใหญ่           บริษัท: SDR                     │
├──────────────┬───────────────────────────────────────────────┤
│  📊 รายได้    │  📊 เงินหัก                                    │
├──────────────┼───────────────────────────────────────────────┤
│  เงินเดือน    15,000.00  │  ประกันสังคม          750.00       │
│  ค่าล่วงเวลา    840.00  │  ภาษีหัก ณ ที่จ่าย     0.00       │
│  เบี้ยเลี้ยง     750.00  │  เบิกเงินล่วงหน้า   3,000.00      │
│  ค่าขับรถ      2,500.00  │  ผ่อนกู้ยืม         2,625.00      │
│                          │  ค่าหอพัก           1,500.00      │
├──────────────┼───────────────────────────────────────────────┤
│  รวมรายได้   19,090.00  │  รวมเงินหัก          7,875.00      │
├──────────────┴───────────────────────────────────────────────┤
│                                                              │
│           💰 เงินเดือนสุทธิ:   11,215.00 บาท                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> **หัวข้อรายได้/เงินหัก** → แสดงเฉพาะที่ `is_active = 1` ใน `pay_item_types`
> **ถ้าพนักงานไม่มียอด** ในหัวข้อนั้น → แสดงว่างไว้ (ไม่แสดงหัวข้อ หรือแสดง 0.00)

### 10.3 ฟังก์ชัน

- ✅ ดูออนไลน์ผ่านหน้าระบบ
- ✅ ดาวน์โหลด **PDF**
- ✅ เลือกดูสลิปย้อนหลัง (เลือกเดือน)
- ✅ HR: พิมพ์สลิปเป็น Batch (เลือกหลายคน)

---

## 11. เอกสาร Generate จากระบบ (Document Generation)

> **อ้างอิง:** ไฟล์ตัวอย่างจาก `ref/` — สัญญาจ้าง, ใบลาออก, หนังสือแจ้งโทษ, หนังสือรับรอง

### 11.1 ประเภทเอกสารทั้งหมด

| #   | ประเภท                 | ไฟล์อ้างอิง (ref/)                              | เลขที่เอกสาร          |
| :-- | :--------------------- | :---------------------------------------------- | :-------------------- |
| 1   | หนังสือรับรองการทำงาน  | —                                               | `CERT-WORK-YYYY-NNNN` |
| 2   | หนังสือรับรองเงินเดือน | `คำร้องขอหนังสือรับรองเงินเดือน.doc`, `SAR.doc` | `CERT-SAL-YYYY-NNNN`  |
| 3   | สัญญาจ้างแรงงาน        | `สัญญาจ้างแรงงาน SDR.docx`, `SAR.docx`          | `CONTRACT-YYYY-NNNN`  |
| 4   | สัญญาจ้างเหมา          | `สัญญา-จ้างเหมา ฟอร์มเปล่า SDR.doc`, `SAR.doc`  | `SUBCON-YYYY-NNNN`    |
| 5   | ใบลาออก                | `ใบลาออกSDR.xlsx`, `SAR.xlsx`                   | `RESIGN-YYYY-NNNN`    |
| 6   | หนังสือแจ้งโทษทางวินัย | `หนังสือแจ้งโทษทางวินัย SDR.docx`, `SAR.docx`   | `DISC-YYYY-NNNN`      |

> **แต่ละประเภทมี Template แยกตามบริษัท** (SDR/SAR/SXD/SPD) — Logo + ที่อยู่ + ชื่อบริษัทต่างกัน

### 11.2 ระบบ 2 ฝั่ง: ผู้ขอ + ผู้ยืนยัน

> ทุกเอกสาร **บังคับ** ผ่านผู้ยืนยันก่อน จึงจะดาวน์โหลดได้

| ฝั่ง                       | บทบาท               | คำอธิบาย                              |
| :------------------------- | :------------------ | :------------------------------------ |
| ผู้ขอเอกสาร (Requester)    | สร้าง/ร้องขอเอกสาร  | ระบบ Generate PDF Draft → รอผู้ยืนยัน |
| ผู้ยืนยันเอกสาร (Approver) | ลงนาม/อนุมัติเอกสาร | เลือกวิธีลงนาม → เอกสารพร้อมดาวน์โหลด |

> ✅ **ตกลงแล้ว:** ใช้ระบบ Action-Based Permission (ดู PRD #00 Section 7) — กำหนดผู้ขอ/ผู้ยืนยันผ่านสิทธิ์ปุ่ม Admin เปลี่ยนได้ ไม่ Hardcode

### 11.3 วิธีลงนาม/อนุมัติ — 3 วิธี

ผู้ยืนยันเอกสารเลือกได้ 3 วิธี:

| #   | วิธี                           | คำอธิบาย                                                          | ผลลัพธ์                            |
| :-- | :----------------------------- | :---------------------------------------------------------------- | :--------------------------------- |
| 1   | **อัปโหลดลายเซ็น**             | อัปโหลดรูปลายเซ็น (PNG/JPG) **หรือ** วาด E-Signature Pad บนหน้าจอ | ระบบ Stamp ลายเซ็นลง PDF อัตโนมัติ |
| 2   | **พิมพ์ → เซ็นจริง → อัปโหลด** | ดาวน์โหลด PDF Draft → พิมพ์ → เซ็นมือ → ถ่ายรูป/Scan อัปโหลดกลับ  | ไฟล์ที่เซ็นแล้วแทน PDF เดิม        |
| 3   | **กดอนุมัติโดยไม่เซ็น**        | กดปุ่มอนุมัติ → ไม่มีลายเซ็นบนเอกสาร                              | อีกฝั่งดาวน์โหลด PDF ได้เลย        |

**รูปแบบลายเซ็นที่รองรับ (วิธีที่ 1):**

- **(A)** อัปโหลดไฟล์รูป: PNG / JPG (แนะนำพื้นหลังใส PNG)
- **(B)** วาดบนหน้าจอ: E-Signature Pad (Canvas) → บันทึกเป็นรูป

### 11.4 สถานะเอกสาร

| Status             | คำอธิบาย                              |
| :----------------- | :------------------------------------ |
| `PENDING_APPROVAL` | ผู้ขอสร้างแล้ว → รอผู้ยืนยัน          |
| `SIGNED`           | ผู้ยืนยันลงนามแล้ว (วิธี 1 หรือ 2)    |
| `APPROVED`         | ผู้ยืนยันกดอนุมัติโดยไม่เซ็น (วิธี 3) |
| `REJECTED`         | ผู้ยืนยันปฏิเสธ (ต้องระบุเหตุผล)      |

### 11.5 Flow เอกสาร

```
ผู้ขอเอกสาร สร้าง/ร้องขอ
    │  ระบบ Generate PDF Draft
    ▼
Status: PENDING_APPROVAL
    │  ผู้ยืนยันได้รับแจ้ง
    ▼
ผู้ยืนยันเลือกวิธี:
    ├── วิธี 1: อัปโหลดรูป / วาด E-Signature
    │       → ระบบ Stamp ลง PDF ─────── Status: SIGNED
    │
    ├── วิธี 2: พิมพ์ → เซ็นจริง → อัปโหลดไฟล์
    │       → แทนที่ PDF เดิม ────────── Status: SIGNED
    │
    ├── วิธี 3: กดอนุมัติโดยไม่เซ็น
    │       → PDF ไม่มีลายเซ็น ──────── Status: APPROVED
    │
    └── ปฏิเสธ (ระบุเหตุผล)
            → ──────────────────────── Status: REJECTED
    │
    ▼ (SIGNED / APPROVED)
ทั้ง 2 ฝั่ง ดาวน์โหลดเอกสารได้
```

> ⚠️ **บังคับ:** ทุกเอกสาร **ต้อง** ผ่านผู้ยืนยันก่อน จึงจะดาวน์โหลดได้

### 11.6 หนังสือรับรองการทำงาน — Layout

```
                    [Logo บริษัท]
               [ชื่อบริษัท (ภาษาไทย)]
              [ที่อยู่บริษัท] [เบอร์โทร]

              หนังสือรับรองการทำงาน
              เลขที่: CERT-WORK-2026-0001

    หนังสือฉบับนี้ออกให้เพื่อรับรองว่า

    ชื่อ-นามสกุล:  [first_name_th] [last_name_th]
    ตำแหน่ง:       [core_levels.name]
    แผนก:          [core_departments.name]
    สาขา:          [core_branches.name_th]

    ได้เข้าทำงานกับบริษัทตั้งแต่วันที่ [start_date]
    จนถึงปัจจุบัน (หรือ ถึงวันที่ [end_date] กรณีลาออก)

    หนังสือฉบับนี้ออกให้เพื่อใช้ตามที่เห็นสมควร

    ออก ณ วันที่ [issued_date]

                    ลงชื่อ ___________________
                          (ผู้มีอำนาจลงนาม)
                          ตำแหน่ง: [ตำแหน่ง]
```

### 11.7 หนังสือรับรองเงินเดือน — Layout

```
                    [Logo บริษัท]
               [ชื่อบริษัท (ภาษาไทย)]
              [ที่อยู่บริษัท] [เบอร์โทร]

             หนังสือรับรองเงินเดือน
             เลขที่: CERT-SAL-2026-0001

    หนังสือฉบับนี้ออกให้เพื่อรับรองว่า

    ชื่อ-นามสกุล:  [first_name_th] [last_name_th]
    ตำแหน่ง:       [core_levels.name]
    แผนก:          [core_departments.name]

    ได้เข้าทำงานกับบริษัทตั้งแต่วันที่ [start_date]
    ปัจจุบันได้รับเงินเดือน [base_salary] บาท
    ([base_salary ตัวอักษร] บาทถ้วน)

    หนังสือฉบับนี้ออกให้เพื่อใช้ตามที่เห็นสมควร

    ออก ณ วันที่ [issued_date]

                    ลงชื่อ ___________________
                          (ผู้มีอำนาจลงนาม)
                          ตำแหน่ง: [ตำแหน่ง]
```

### 11.8 เอกสารอื่น (3-6)

> Layout ของสัญญาจ้างแรงงาน, สัญญาจ้างเหมา, ใบลาออก, หนังสือแจ้งโทษทางวินัย
> → **ใช้ตาม Template จากไฟล์ตัวอย่างใน `ref/`** โดยระบบจะ Fill-in ข้อมูลพนักงานอัตโนมัติ

**ข้อมูลที่ระบบ Auto-Fill:**

| ฟิลด์                | แหล่งข้อมูล                                 |
| :------------------- | :------------------------------------------ |
| ชื่อ-นามสกุล         | `core_users.first_name_th` + `last_name_th` |
| ตำแหน่ง              | `core_levels.name`                          |
| แผนก                 | `core_departments.name`                     |
| สาขา                 | `core_branches.name_th`                     |
| วันที่เริ่มงาน       | `hrm_employees.start_date`                  |
| เงินเดือน            | `hrm_employees.base_salary`                 |
| Logo + ที่อยู่บริษัท | ตั้งค่าใน PRD #04 (ข้อมูลบริษัท)            |

### 11.9 ฟังก์ชัน

- ผู้ขอเลือกพนักงาน (ถ้าเป็น HR) หรือเลือกตัวเอง → เลือกประเภทเอกสาร → กด **ร้องขอ**
- ระบบสร้าง **PDF Draft** อัตโนมัติ (Fill-in จาก DB) → ส่งให้ผู้ยืนยัน
- ผู้ยืนยันเลือกวิธีลงนาม (3 วิธี) → เอกสารพร้อมดาวน์โหลด
- เลขที่เอกสาร Auto-Generate
- บันทึกประวัติการออกเอกสาร (ใคร, เมื่อไหร่, ประเภท, วิธีลงนาม)
- ดาวน์โหลด PDF / เอกสารที่เซ็นแล้ว ได้ย้อนหลัง

---

## 12. โบนัส (Bonus)

### 12.1 ภาพรวม

| รายการ        | ค่า                                            |
| :------------ | :--------------------------------------------- |
| จ่ายเมื่อไหร่ | **ช่วงตรุษจีน** ของทุกปี (ปีละ 1 ครั้ง)        |
| คำนวณจาก      | คะแนนรวม (ดู PRD #02 Section 12.10)            |
| สัดส่วน       | คะแนนประเมินผลงาน **70%** + Attendance **30%** |

### 12.2 สูตรคะแนนโบนัส

> **อ้างอิง:** PRD #02 Section 12.10

| องค์ประกอบ                                | สัดส่วน  | คะแนนเต็ม |
| :---------------------------------------- | :------: | :-------: |
| คะแนนประเมินผลงาน (เฉลี่ยทั้งปี 12 เดือน) |   70%    |    70     |
| คะแนน Attendance (ขาด/ลา/สาย)             |   30%    |    30     |
| **รวม**                                   | **100%** |  **100**  |

**คะแนน Attendance (30 คะแนน):**

| เกณฑ์     | คะแนนเต็ม | วิธีหัก                                                                    |
| :-------- | :-------: | :------------------------------------------------------------------------- |
| ไม่ขาดงาน |    10     | ขาด = **หัก 5 คะแนน/ครั้ง**                                                |
| ไม่ลาบ่อย |    10     | หัก 0.5 คะแนน/วันลา (เกินโควตาเกณฑ์)                                       |
| ไม่มาสาย  |    10     | หัก 1 คะแนน ถ้าสายเกิน 15 นาที/ครั้ง, หัก 2 คะแนน ถ้ารวมเกิน 30 นาที/เดือน |

### 12.3 ขั้นตอน

1. **ปลายปี** → ระบบคำนวณคะแนนโบนัสอัตโนมัติทุกคน
2. ดึงคะแนนประเมินเฉลี่ย 12 เดือน (จาก `hrm_evaluations`)
3. คำนวณคะแนน Attendance จาก `hrm_time_logs` + `hrm_leave_requests`
4. **HR Review** → ตรวจสอบ + กำหนด **จำนวนเงินโบนัส** แต่ละคน
5. **ผู้บริหารอนุมัติ** → Finalize

### 12.4 หน้าสรุปโบนัส (HR)

**ตัวกรอง:** ปี, บริษัท / สาขา / แผนก

| Column                | คำอธิบาย                   |
| :-------------------- | :------------------------- |
| พนักงาน               | ชื่อ-นามสกุล               |
| คะแนนประเมิน (70)     | เฉลี่ย weighted_score × 14 |
| คะแนน Attendance (30) | คำนวณจากขาด/ลา/สาย         |
| คะแนนรวม (100)        | evaluation + attendance    |
| จำนวนเงินโบนัส        | HR กำหนด (บาท)             |
| สถานะ                 | DRAFT / APPROVED           |

> **จำนวนเงินโบนัสจริง → HR กำหนดเอง** โดยใช้คะแนนเป็นเกณฑ์ประกอบ (ระบบไม่ Auto คำนวณเงินโบนัส เพราะนโยบายอาจเปลี่ยนแต่ละปี)

---

## 13. DB Schema — ตารางใหม่

> **Prefix:** ใช้ `pay_` สำหรับตารางเงินเดือนทั้งหมด (แยกจาก `hrm_` เพื่อความชัดเจน)

### 13.1 สรุปตารางใหม่ (12 ตาราง)

| ตาราง                    | ใช้ใน Section | คำอธิบาย                         |
| :----------------------- | :------------ | :------------------------------- |
| `pay_ot_types` 🆕        | 4             | Master: ประเภท OT (Configurable) |
| `pay_ot_fixed_rates` 🆕  | 4             | Tier อัตรา OT ตามเงินเดือน       |
| `pay_ot_time_slots` 🆕   | 4             | ช่วงเวลา OT แบบ Shift Premium    |
| `pay_item_types` 🆕      | 5             | Master: หัวข้อรายได้/เงินหัก     |
| `pay_payroll_periods` 🆕 | 2, 9          | รอบเงินเดือนแต่ละเดือน           |
| `pay_payroll_records` 🆕 | 9, 10         | สรุปเงินเดือนรายบุคคล            |
| `pay_payroll_items` 🆕   | 9, 10         | รายการรายได้/หักแต่ละหัวข้อ      |
| `pay_salary_advances` 🆕 | 7             | คำขอเบิกเงินล่วงหน้า             |
| `pay_loans` 🆕           | 8             | เงินกู้ยืม                       |
| `pay_loan_payments` 🆕   | 8             | ประวัติการหักผ่อนกู้ยืม          |
| `pay_certificates` 🆕    | 11            | ประวัติเอกสาร Generate           |
| `pay_bonuses` 🆕         | 12            | โบนัสประจำปี                     |

### 13.2 ตารางที่แก้ไข

| ตาราง             | การเปลี่ยนแปลง                                            |
| :---------------- | :-------------------------------------------------------- |
| `hrm_ot_requests` | เปลี่ยน `ot_type` ENUM → `ot_type_id` FK → `pay_ot_types` |

### 13.3 ตารางที่มีอยู่แล้ว (ใช้ร่วม — ไม่ต้องแก้)

| ตาราง                | ใช้ใน Section | คำอธิบาย          |
| :------------------- | :------------ | :---------------- |
| `hrm_employees`      | 3, 4, 7, 8    | ข้อมูลพนักงาน     |
| `hrm_time_logs`      | 3, 12         | บันทึกเวลา        |
| `hrm_leave_requests` | 3, 12         | คำร้องลา          |
| `hrm_holidays`       | 4             | วันหยุดบริษัท     |
| `hrm_evaluations`    | 12            | ผลประเมินรายเดือน |

---

### 13.3 รายละเอียดตาราง

#### 🆕 `pay_item_types` (หัวข้อรายได้/เงินหัก)

```sql
CREATE TABLE `pay_item_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. BASE_SALARY, OT_PAY, MEETING_FEE',
    `name_th` VARCHAR(100) NOT NULL COMMENT 'ชื่อหัวข้อ (TH)',
    `type` ENUM('INCOME', 'DEDUCTION') NOT NULL COMMENT 'รายได้ หรือ เงินหัก',
    `calc_type` ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'MANUAL' COMMENT 'ระบบคำนวณ หรือ HR กรอก',
    `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=System Item ห้ามลบ',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'เปิด/ปิดหัวข้อ',
    `sort_order` INT DEFAULT 0 COMMENT 'ลำดับการแสดง',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT = 'หัวข้อรายได้/เงินหัก (Configurable)';
```

#### 🆕 `pay_payroll_periods` (รอบเงินเดือน)

```sql
CREATE TABLE `pay_payroll_periods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL COMMENT 'FK → core_companies.id',
    `period_month` VARCHAR(7) NOT NULL COMMENT 'YYYY-MM (e.g. 2026-02)',
    `start_date` DATE NOT NULL COMMENT 'วันเริ่มรอบ (21)',
    `end_date` DATE NOT NULL COMMENT 'วันสิ้นรอบ (20)',
    `pay_date` DATE NOT NULL COMMENT 'วันจ่ายเงิน (1)',
    `status` ENUM('DRAFT', 'REVIEWING', 'FINALIZED', 'PAID') DEFAULT 'DRAFT',
    `finalized_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `finalized_at` DATETIME NULL,
    `paid_at` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_company_period` (`company_id`, `period_month`),
    CONSTRAINT `fk_period_company` FOREIGN KEY (`company_id`) REFERENCES `core_companies` (`id`)
) COMMENT = 'รอบเงินเดือนรายเดือน';
```

#### 🆕 `pay_payroll_records` (สรุปเงินเดือนรายบุคคล)

```sql
CREATE TABLE `pay_payroll_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `period_id` INT NOT NULL COMMENT 'FK → pay_payroll_periods.id',
    `employee_id` INT UNSIGNED NOT NULL COMMENT 'FK → hrm_employees.id',
    `base_salary` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'เงินเดือนฐาน',
    `total_income` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'รวมรายได้',
    `total_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'รวมเงินหัก',
    `net_pay` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'เงินเดือนสุทธิ',
    `tax_auto_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'ภาษีที่ระบบคำนวณ',
    `tax_final_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'ภาษีที่ใช้จริง (HR override ได้)',
    `notes` TEXT NULL COMMENT 'หมายเหตุ',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_period_employee` (`period_id`, `employee_id`),
    CONSTRAINT `fk_record_period` FOREIGN KEY (`period_id`) REFERENCES `pay_payroll_periods` (`id`),
    CONSTRAINT `fk_record_employee` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) COMMENT = 'สรุปเงินเดือนรายบุคคล';
```

#### 🆕 `pay_payroll_items` (รายการรายได้/หักแต่ละหัวข้อ)

```sql
CREATE TABLE `pay_payroll_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_id` INT NOT NULL COMMENT 'FK → pay_payroll_records.id',
    `item_type_id` INT NOT NULL COMMENT 'FK → pay_item_types.id',
    `amount` DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'จำนวนเงิน',
    `description` VARCHAR(255) NULL COMMENT 'รายละเอียดเพิ่มเติม',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_record_item` (`record_id`, `item_type_id`),
    CONSTRAINT `fk_item_record` FOREIGN KEY (`record_id`) REFERENCES `pay_payroll_records` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_type` FOREIGN KEY (`item_type_id`) REFERENCES `pay_item_types` (`id`)
) COMMENT = 'รายการรายได้/เงินหักแต่ละหัวข้อ';
```

#### 🆕 `pay_salary_advances` (เบิกเงินเดือนล่วงหน้า)

```sql
CREATE TABLE `pay_salary_advances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT UNSIGNED NOT NULL COMMENT 'FK → hrm_employees.id',
    `period_month` VARCHAR(7) NOT NULL COMMENT 'รอบเดือนที่เบิก (YYYY-MM)',
    `amount` DECIMAL(12,2) NOT NULL COMMENT 'จำนวนเงินเบิก',
    `reason` TEXT NULL COMMENT 'เหตุผล',
    `manager_status` ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    `manager_id` BIGINT UNSIGNED NULL COMMENT 'หัวหน้าที่อนุมัติ',
    `manager_approved_at` DATETIME NULL,
    `manager_comment` TEXT NULL,
    `hr_status` ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    `hr_id` BIGINT UNSIGNED NULL COMMENT 'HR ที่อนุมัติ',
    `hr_approved_at` DATETIME NULL,
    `hr_comment` TEXT NULL,
    `overall_status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_advance_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) COMMENT = 'คำขอเบิกเงินเดือนล่วงหน้า (Dual Approval)';
```

#### 🆕 `pay_loans` (เงินกู้ยืม)

```sql
CREATE TABLE `pay_loans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT UNSIGNED NOT NULL COMMENT 'FK → hrm_employees.id',
    `loan_amount` DECIMAL(12,2) NOT NULL COMMENT 'ยอดเงินกู้',
    `has_interest` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=มีดอกเบี้ย, 0=ไม่มี',
    `interest_rate` DECIMAL(5,2) DEFAULT 0 COMMENT 'อัตราดอกเบี้ย %/ปี',
    `total_interest` DECIMAL(12,2) DEFAULT 0 COMMENT 'ดอกเบี้ยรวม',
    `total_amount` DECIMAL(12,2) NOT NULL COMMENT 'ยอดรวม (เงินต้น + ดอกเบี้ย)',
    `monthly_payment` DECIMAL(12,2) NOT NULL COMMENT 'ยอดผ่อนต่อเดือน',
    `total_installments` INT NOT NULL COMMENT 'จำนวนงวดทั้งหมด',
    `paid_installments` INT NOT NULL DEFAULT 0 COMMENT 'ผ่อนไปแล้ว (งวด)',
    `remaining_balance` DECIMAL(12,2) NOT NULL COMMENT 'ยอดคงเหลือ',
    `start_date` DATE NOT NULL COMMENT 'เดือนที่เริ่มหัก',
    `status` ENUM('ACTIVE','COMPLETED','CANCELLED') DEFAULT 'ACTIVE',
    `approved_by` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_loan_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) COMMENT = 'เงินกู้ยืมพนักงาน';
```

#### 🆕 `pay_loan_payments` (ประวัติการผ่อนกู้)

```sql
CREATE TABLE `pay_loan_payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `loan_id` INT NOT NULL COMMENT 'FK → pay_loans.id',
    `period_id` INT NOT NULL COMMENT 'FK → pay_payroll_periods.id',
    `installment_no` INT NOT NULL COMMENT 'งวดที่',
    `payment_amount` DECIMAL(12,2) NOT NULL COMMENT 'จำนวนเงินที่หัก',
    `remaining_balance` DECIMAL(12,2) NOT NULL COMMENT 'ยอดคงเหลือหลังหัก',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_loan_period` (`loan_id`, `period_id`),
    CONSTRAINT `fk_loanpay_loan` FOREIGN KEY (`loan_id`) REFERENCES `pay_loans` (`id`),
    CONSTRAINT `fk_loanpay_period` FOREIGN KEY (`period_id`) REFERENCES `pay_payroll_periods` (`id`)
) COMMENT = 'ประวัติการหักผ่อนกู้ยืมรายเดือน';
```

#### 🆕 `pay_certificates` (เอกสาร Generate — 2 ฝั่งลงนาม)

```sql
CREATE TABLE `pay_certificates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT UNSIGNED NOT NULL COMMENT 'FK → hrm_employees.id',
    `doc_type` ENUM('CERT_WORK','CERT_SALARY','CONTRACT','SUBCONTRACT','RESIGN','DISCIPLINARY') NOT NULL,
    `document_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'เลขที่เอกสาร (Auto-Generate)',
    `issued_date` DATE NOT NULL COMMENT 'วันที่ออก',
    `requested_by` BIGINT UNSIGNED NOT NULL COMMENT 'FK → core_users.id (ผู้ขอเอกสาร)',
    `approver_id` BIGINT UNSIGNED NULL COMMENT 'FK → core_users.id (ผู้ยืนยันเอกสาร)',
    `status` ENUM('PENDING_APPROVAL','SIGNED','APPROVED','REJECTED') DEFAULT 'PENDING_APPROVAL',
    `sign_method` ENUM('UPLOAD_IMAGE','E_SIGNATURE','PRINT_SIGN_UPLOAD','APPROVE_ONLY') NULL COMMENT 'วิธีที่ผู้ยืนยันเลือก',
    `file_path` VARCHAR(500) NULL COMMENT 'Path ไฟล์ PDF ที่ Generate',
    `signature_image_path` VARCHAR(500) NULL COMMENT 'Path รูปลายเซ็น (วิธี 1: อัปโหลด/E-Signature)',
    `signed_document_path` VARCHAR(500) NULL COMMENT 'Path เอกสารที่เซ็นแล้ว (วิธี 2: พิมพ์+เซ็น+อัปโหลด)',
    `salary_at_issue` DECIMAL(12,2) NULL COMMENT 'เงินเดือน ณ วันที่ออก (ถ้าเกี่ยวข้อง)',
    `approved_at` DATETIME NULL COMMENT 'วันเวลาที่ลงนาม/อนุมัติ',
    `reject_reason` TEXT NULL COMMENT 'เหตุผลที่ปฏิเสธ',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cert_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) COMMENT = 'เอกสาร Generate จากระบบ (6 ประเภท, 2 ฝั่งลงนาม)';
```

#### 🆕 `pay_bonuses` (โบนัสประจำปี)

```sql
CREATE TABLE `pay_bonuses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT UNSIGNED NOT NULL COMMENT 'FK → hrm_employees.id',
    `year` INT NOT NULL COMMENT 'ปี (ค.ศ.)',
    `evaluation_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนนประเมิน (เต็ม 70)',
    `attendance_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนน Attendance (เต็ม 30)',
    `total_score` DECIMAL(5,2) DEFAULT 0 COMMENT 'คะแนนรวม (เต็ม 100)',
    `bonus_amount` DECIMAL(12,2) DEFAULT 0 COMMENT 'จำนวนเงินโบนัส (HR กำหนด)',
    `status` ENUM('DRAFT','APPROVED','PAID') DEFAULT 'DRAFT',
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_bonus_emp_year` (`employee_id`, `year`),
    CONSTRAINT `fk_bonus_emp` FOREIGN KEY (`employee_id`) REFERENCES `hrm_employees` (`id`)
) COMMENT = 'โบนัสประจำปี';
```

---

## 14. สิ่งที่อยู่นอกขอบเขต PRD #03

| หัวข้อ                             | อยู่ใน PRD |
| :--------------------------------- | :--------- |
| ตั้งค่าบริษัท / สาขา / ตำแหน่ง     | PRD #04    |
| ตั้งค่าสิทธิ์ (Permissions)        | PRD #04    |
| ตั้งค่าหมวดประเมิน (น้ำหนัก/เกณฑ์) | PRD #04    |
| API ค่าขับรถจากระบบพี่ปอม          | PRD #05    |
| ระบบ ACC (บัญชี)                   | PRD #05    |

---

## 15. Open Questions

| #   | คำถาม                                           | สถานะ                                               |
| :-- | :---------------------------------------------- | :-------------------------------------------------- |
| 1   | OT: DHL ใช้ตามกม. / CarRental ใช้ Fixed Rate    | ✅ ตกลงแล้ว — ออกแบบ Configurable OT Engine         |
| 2   | OT CNX: Flat ต่อ Segment / SAR vs SDR เหมือนกัน | ✅ ใช้ Flat + เหมือนกันก่อน (รอสรุปพี่แนน)          |
| 3   | เอกสาร Generate: ต้องการทั้งหมด 6 ประเภท        | ✅ ตกลงแล้ว                                         |
| 4   | ภาษี: เก็บข้อมูลค่าลดหย่อนรายตัวไหม?            | ✅ ใช้ Auto + HR Override (ไม่เก็บค่าลดหย่อนรายตัว) |
| 5   | เอกสาร: ผู้ลงนาม ใช้ข้อมูลจากไหน?               | ✅ ระบบ 2 ฝั่ง (ผู้ขอ+ผู้ยืนยัน) + 3 วิธีลงนาม      |
| 6   | กู้ยืม: ต้องมีขั้นตอนอนุมัติไหม?                | ✅ (A) HR ลงข้อมูลเลย ไม่มี Approval Flow           |
| 7   | เอกสาร: แต่ละประเภท ใครเป็นผู้ขอ/ผู้ยืนยัน?     | ✅ ใช้ Action-Based Permission (PRD #00 Sec.7)      |
