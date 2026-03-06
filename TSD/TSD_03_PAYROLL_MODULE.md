# TSD_03: Payroll Module (โครงหลัก)

# Technical Specification Document — Skeleton

> **Version:** 0.1 Skeleton
> **Status:** 🏗️ โครงหลัก (Phase 2)
> **Last Updated:** 2026-03-05
> **PRD Reference:** PRD #03 (Payroll System)
> **Dependencies:** TSD_01 (Core Infrastructure), TSD_02 (HRM Module)

---

## 1. ขอบเขต (Scope)

ระบบเงินเดือนครบวงจร:

- คำนวณเงินเดือน (รอบ 21-20, จ่ายวันที่ 1)
- Configurable OT Engine (3 วิธี: FORMULA, FIXED_RATE, TIME_SLOT)
- รายได้อื่น / เงินหัก (Configurable Payroll Items)
- ประกันสังคม (auto-calculate)
- กู้ยืม / เบิกเงินเดือนล่วงหน้า
- สลิปเงินเดือน (PDF)
- หนังสือรับรอง (การทำงาน / เงินเดือน)
- โบนัสประจำปี

### ผู้ใช้งาน

| กลุ่ม     | การเข้าถึง                         |
| :-------- | :--------------------------------- |
| HR        | คำนวณ + ตรวจสอบ + ยืนยัน           |
| ผู้บริหาร | อนุมัติ Payroll + ดูรายงาน         |
| พนักงาน   | ดูสลิป + ขอเบิกล่วงหน้า + ดูกู้ยืม |

---

## 2. Database Schema (ตารางหลัก)

### 2.1 Payroll Core Tables

| #   | ตาราง                 | สถานะ | คำอธิบาย                                                      |
| :-- | :-------------------- | :---- | :------------------------------------------------------------ |
| 1   | `pay_payroll_periods` | 🆕    | รอบเงินเดือน (เดือน, สถานะ: DRAFT→CALCULATED→APPROVED→PAID)   |
| 2   | `pay_payroll_records` | 🆕    | เงินเดือนรายคน (base, total_income, total_deduction, net_pay) |
| 3   | `pay_payroll_items`   | 🆕    | รายการย่อย (EARNING/DEDUCTION + ประเภท)                       |

### 2.2 OT Engine Tables

| #   | ตาราง                | สถานะ | คำอธิบาย                                                 |
| :-- | :------------------- | :---- | :------------------------------------------------------- |
| 4   | `pay_ot_types`       | 🆕    | Master: ประเภท OT (code, calc_method, multiplier, scope) |
| 5   | `pay_ot_fixed_rates` | 🆕    | Tier อัตราตามเงินเดือน (salary_min → salary_max → rate)  |
| 6   | `pay_ot_time_slots`  | 🆕    | อัตราตามช่วงเวลา (CNX Shift Premium)                     |

### 2.3 Payroll Item Config

| #   | ตาราง                    | สถานะ | คำอธิบาย                                    |
| :-- | :----------------------- | :---- | :------------------------------------------ |
| 7   | `pay_payroll_item_types` | 🆕    | Master: หัวข้อรายได้/เงินหัก (Configurable) |

### 2.4 Loan & Advance

| #   | ตาราง                 | สถานะ | คำอธิบาย                                    |
| :-- | :-------------------- | :---- | :------------------------------------------ |
| 8   | `pay_loans`           | 🆕    | กู้ยืม (principal, installments, remaining) |
| 9   | `pay_loan_payments`   | 🆕    | งวดชำระ (auto-deduct ใน payroll)            |
| 10  | `pay_salary_advances` | 🆕    | เบิกเงินเดือนล่วงหน้า                       |

### 2.5 Document Generation

| #   | ตาราง              | สถานะ | คำอธิบาย                               |
| :-- | :----------------- | :---- | :------------------------------------- |
| 11  | `pay_payslips`     | 🆕    | สลิปเงินเดือน (PDF path, generated_at) |
| 12  | `pay_certificates` | 🆕    | หนังสือรับรอง (WORK/SALARY, PDF path)  |

---

## 3. API Endpoints (หลัก)

> ทุก API ใช้ prefix `/api/pay/`

### 3.1 Payroll Processing

| Method | Path                              | คำอธิบาย                             |
| :----- | :-------------------------------- | :----------------------------------- |
| `GET`  | `/api/pay/periods`                | รายการรอบเงินเดือน                   |
| `POST` | `/api/pay/periods/{id}/calculate` | คำนวณเงินเดือนทั้งรอบ (→ CALCULATED) |
| `PUT`  | `/api/pay/periods/{id}/approve`   | อนุมัติ (→ APPROVED)                 |
| `PUT`  | `/api/pay/periods/{id}/mark-paid` | จ่ายแล้ว (→ PAID)                    |
| `GET`  | `/api/pay/records?period_id=X`    | รายการเงินเดือนรายคน                 |
| `GET`  | `/api/pay/records/{id}/detail`    | รายละเอียดเงินเดือน 1 คน             |
| `PUT`  | `/api/pay/records/{id}/adjust`    | ปรับแก้ก่อนอนุมัติ                   |

### 3.2 OT Configuration

| Method | Path                                 | คำอธิบาย                  |
| :----- | :----------------------------------- | :------------------------ |
| `CRUD` | `/api/pay/ot-types`                  | จัดการประเภท OT           |
| `CRUD` | `/api/pay/ot-types/{id}/fixed-rates` | ตั้ง Tier อัตราตาม salary |
| `CRUD` | `/api/pay/ot-types/{id}/time-slots`  | ตั้งอัตราตามช่วงเวลา      |

### 3.3 Payroll Item Types

| Method | Path                  | คำอธิบาย                   |
| :----- | :-------------------- | :------------------------- |
| `CRUD` | `/api/pay/item-types` | จัดการหัวข้อรายได้/เงินหัก |

### 3.4 Loan & Advance

| Method | Path                           | คำอธิบาย           |
| :----- | :----------------------------- | :----------------- |
| `CRUD` | `/api/pay/loans`               | จัดการกู้ยืม       |
| `GET`  | `/api/pay/loans/{id}/payments` | ประวัติชำระ        |
| `POST` | `/api/pay/advances`            | ขอเบิกล่วงหน้า     |
| `GET`  | `/api/pay/advances`            | รายการเบิกล่วงหน้า |

### 3.5 Payslip & Certificate

| Method | Path                            | คำอธิบาย              |
| :----- | :------------------------------ | :-------------------- |
| `GET`  | `/api/pay/payslips?period_id=X` | สลิปเงินเดือน (PDF)   |
| `POST` | `/api/pay/payslips/generate`    | สร้าง PDF สลิปทั้งรอบ |
| `POST` | `/api/pay/certificates`         | ออกหนังสือรับรอง      |

### 3.6 Reports

| Method | Path                               | คำอธิบาย              |
| :----- | :--------------------------------- | :-------------------- |
| `GET`  | `/api/pay/reports/summary`         | สรุปเงินเดือนรายเดือน |
| `GET`  | `/api/pay/reports/social-security` | รายงานประกันสังคม     |
| `GET`  | `/api/pay/reports/tax`             | รายงานภาษี            |
| `GET`  | `/api/pay/reports/export`          | Export Excel          |

---

## 4. Business Logic สำคัญ

### 4.1 Payroll Cycle (21-20)

```
รอบ ก.พ. 2026 = 21 ม.ค. — 20 ก.พ. → จ่าย 1 มี.ค.

Flow: DRAFT → CALCULATED → APPROVED → PAID
```

### 4.2 Salary Calculation Formula

```
Net Pay = Base Salary
        + OT Pay
        + Other Earnings (เพิ่มเติม, คอมมิชชัน, etc.)
        - Social Security
        - Tax (ถ้ามี)
        - Loan Installment
        - Advance Deduction
        - Other Deductions (หักอื่นๆ)
```

### 4.3 OT Calculation (3 Methods)

| Method       | ใช้กับ               | สูตร                                              |
| :----------- | :------------------- | :------------------------------------------------ |
| `FORMULA`    | DHL (SXD, SPD)       | (base_salary ÷ 30 ÷ 8) × multiplier × hours       |
| `FIXED_RATE` | CarRental (SDR, SAR) | fixed_rate × multiplier × hours (tier ตาม salary) |
| `TIME_SLOT`  | CNX Shift Premium    | ดูตาราง time_slot → จำนวนเงินตามช่วงเวลา          |

### 4.4 Social Security

```
Employee = base_salary × 5% (cap ที่ 750 บาท)
Employer = base_salary × 5% (cap ที่ 750 บาท)
Salary cap = 15,000 บาท
Config: SOCIAL_SECURITY_RATE, SOCIAL_SECURITY_MAX_SALARY (จาก core_system_config)
```

### 4.5 Monthly Salary (DAILY type)

```
salary_type = DAILY:
  daily_rate = base_salary
  actual_pay = daily_rate × working_days (จาก hrm_time_logs)

salary_type = MONTHLY:
  actual_pay = base_salary (เต็มจำนวน)
```

---

## 5. Dependencies กับ TSD อื่น

| ใช้จาก TSD_01        | สิ่งที่ใช้                                  |
| :------------------- | :------------------------------------------ |
| AuthMiddleware       | ตรวจ JWT ทุก API                            |
| PermissionMiddleware | สิทธิ์เข้าหน้า Payroll                      |
| System Config        | SOCIAL*SECURITY*_, PAYROLL*CYCLE*_, TAX\_\* |

| ใช้จาก TSD_02                  | สิ่งที่ใช้                                      |
| :----------------------------- | :---------------------------------------------- |
| hrm_employees                  | base_salary, salary_type, company_id, branch_id |
| hrm_ot_requests (APPROVED)     | ชั่วโมง OT + ot_type_id                         |
| hrm_leave_requests (is_paid=0) | วันลาไม่รับค่าจ้าง → หักเงิน                    |
| hrm_time_logs                  | จำนวนวันทำงาน (DAILY type)                      |
| hrm_evaluations                | คะแนนประเมินสำหรับโบนัส                         |

---

## 6. TODO (Phase 3 — ต้องเพิ่มก่อน Code)

- [ ] SQL CREATE TABLE สำหรับ 12 ตารางใหม่ (pay\_\*)
- [ ] Detailed API Request/Response Schema
- [ ] OT Calculation Examples (ทุก Method ทุก Case)
- [ ] Payslip PDF Template Design
- [ ] Certificate PDF Template Design
- [ ] Tax Calculation Rules (ถ้ามี)
- [ ] Bonus Calculation Formula (คะแนนประเมิน 70% + Attendance 30%)
- [ ] Excel Export Format
