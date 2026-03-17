# 📜 กฎการทำงาน TSD (Technical Specification Document)

> **เอกสารนี้ต้องถูกอ่านและปฏิบัติตามทุกครั้งก่อนเริ่มทำงานเกี่ยวกับ TSD**

---

## 1. บทบาทผู้รับผิดชอบ (Responsible Roles)

TSD จัดทำโดย **Software Architect** หรือ **Technical Lead** โดยมีหน้าที่:

- แปลง PRD (ความต้องการ) → TSD (การออกแบบทางเทคนิค)
- ออกแบบ Database Schema, API Endpoints, Business Logic
- ตรวจสอบความเป็นไปได้ทางเทคนิคและความสอดคล้องกับระบบปัจจุบัน
- ตัดสินใจเรื่อง Technology Stack, Design Patterns, Security

---

## 2. หลักการห้ามคาดเดา (Zero Assumption Policy)

- ❌ **ห้ามคาดเดาข้อมูล** — หากไม่มีข้อมูลเพียงพอ ต้องถามกลับเสมอ
- ❌ **ห้ามเติมข้อมูลเอง** — ข้อมูลทุกอย่างต้องมาจากผู้ใช้หรือแหล่งอ้างอิงที่ได้รับอนุญาตเท่านั้น
- ❌ **ห้ามเดา Schema หรือ API** — ต้องอ้างอิงจาก DB จริง, PRD, หรือโค้ดจริงเท่านั้น
- ✅ **ถามกลับให้ได้มากที่สุด** — หากข้อมูลไม่ชัดเจน ให้รวบรวมคำถามและถามกลับทั้งหมด

---

## 3. แหล่งอ้างอิงที่อนุญาต (Approved Reference Sources)

TSD ใช้แหล่งอ้างอิง **3 ระดับ** ตามลำดับความสำคัญ:

### 3.1 แหล่งอ้างอิงหลัก (Primary) — PRD ที่ผ่านการอนุมัติแล้ว

| ไฟล์ PRD                                        | คำอธิบาย                                 |
| :---------------------------------------------- | :--------------------------------------- |
| `PRD/PRD_00_PERMISSION_ARCHITECTURE.md`         | สถาปัตยกรรม Permission, Junction Tables  |
| `PRD/PRD_01_MAIN_SYSTEM.md`                     | Login, Dashboard, Check-in/out, Profiles |
| `PRD/PRD_02_HR_SYSTEM.md`                       | Employee, Time Report, Leave, Evaluation |
| `PRD/PRD_03_PAYROLL_SYSTEM.md`                  | Salary, OT, Payslip, Loans, Documents    |
| `PRD/PRD_04_SETTINGS_SYSTEM.md`                 | System Config, Master Data, Admin UI     |
| `PRD/PRD_05_ACC_SYSTEM.md`                      | Expense, Vendor, Payment, Reconciliation |
| `PRD/APPENDIX_APP_STRUCTURE_AND_PERMISSIONS.md` | โครงสร้างหน้าจอและสิทธิ์ทั้งหมด          |

### 3.2 แหล่งอ้างอิงเทคนิค (Technical) — เอกสารใน `ref/`

| ไฟล์                             | คำอธิบาย                                    |
| :------------------------------- | :------------------------------------------ |
| `ref/project_summary_v3.md`      | สรุปภาพรวมโครงการ SiamGroup V3 (Core & HRM) |
| `ref/BACKEND_ARCHITECTURE.md`    | สถาปัตยกรรม Backend (Pure PHP, Model-Based) |
| `ref/FRONTEND_STANDARDS.md`      | มาตรฐานการพัฒนา Frontend (React, MUI, Vite) |
| `ref/THEME_SUMMARY.md`           | สรุป Theme และ Design Tokens                |
| `ref/siamgroup_v3_final.sql`     | โครงสร้างฐานข้อมูล V3 (SQL Schema)          |
| `ref/acc_system_summary.md`      | สรุประบบบัญชี ACC                           |
| `ref/system-siamgroup-models.md` | โครงสร้าง Models ของระบบ                    |

### 3.3 แหล่งอ้างอิงจริง (Live) — โค้ดและ DB

- ✅ อ่านไฟล์ Source Code จริงได้ เพื่อตรวจสอบ Implementation ที่มีอยู่
- ✅ อ่าน SQL Schema จริงได้ เพื่อตรวจสอบ Table Structure ที่มีอยู่
- ❌ ห้ามเดา path หรือ field name — ต้องอ่านจากของจริงเท่านั้น

### กฎการใช้แหล่งอ้างอิง:

1. **PRD คือแหล่งความจริงสูงสุด** — TSD ต้องครอบคลุมทุกข้อกำหนดจาก PRD
2. หากต้องการข้อมูลจากแหล่งอื่นนอกเหนือจากข้างต้น → **ต้องถามผู้ใช้ก่อนเท่านั้น**
3. หาก PRD กับโค้ดจริงขัดแย้งกัน → **ต้องถามผู้ใช้ว่าจะยึดตามแหล่งไหน**
4. หากข้อมูลไม่พอ → สามารถค้นหาข้อมูลเพิ่มเติมได้ แต่ **ต้องถามก่อนว่าใช้เป็นแหล่งอ้างอิงได้หรือไม่**

---

## 4. การเสนอความคิดเห็น (Opinion Proposal)

- ❌ **ห้ามเสนอความคิดเห็นโดยไม่ถาม** — ทุกข้อเสนอต้องถามก่อนว่า "โอเคไหม" เสมอ
- ✅ **ระบุเหตุผลทางเทคนิคประกอบ** — เมื่อเสนอสิ่งใดต้องอธิบายว่าทำไม (performance, security, scalability)
- ✅ **เสนอทางเลือก** — ถ้ามีหลายวิธีแก้ปัญหา ให้เสนอ pros/cons แล้วให้ผู้ใช้ตัดสินใจ

---

## 5. รูปแบบเอกสาร (Document Format)

- ไฟล์ TSD ต้องเป็นรูปแบบ **Markdown (.md)**
- เอกสารทั้งหมดเขียนเป็น **ภาษาไทยเป็นหลัก** — Terms ทางเทคนิค (เช่น API, Schema, JWT) ใช้ภาษาอังกฤษได้
- ไฟล์เก็บไว้ที่ **`TSD/`** เท่านั้น

---

## 6. โครงสร้างการจัดกลุ่ม TSD (TSD Module Structure)

TSD จัด **4 โมดูล** โดยรวมกลุ่ม PRD ที่เกี่ยวข้องเข้าด้วยกัน:

| TSD Module | ชื่อโมดูล               | PRD ที่อ้างอิง    | ขอบเขต                                                                                    |
| :--------- | :---------------------- | :---------------- | :---------------------------------------------------------------------------------------- |
| `TSD_01`   | **Core Infrastructure** | PRD #00, #01, #04 | Authentication, Permission Engine, Dashboard, Check-in/out, System Config, Settings Admin |
| `TSD_02`   | **HRM Module**          | PRD #02           | Employee Management, Time & Attendance, Leave, Work Schedules, Evaluation                 |
| `TSD_03`   | **Payroll Module**      | PRD #03           | Salary Engine, OT Calculation, Payslip, Loans, Document Generation & Signing              |
| `TSD_04`   | **ACC Module**          | PRD #05           | Expense Management, Vendor/Payee Registry, Payment Runs, Bank Reconciliation              |

### เหตุผลการจัดกลุ่ม:

- **TSD_01** รวม PRD #00 (Permission), #01 (Main System), #04 (Settings) เข้าด้วยกัน เพราะทั้งหมดเป็น Core Platform Infrastructure ที่โมดูลอื่นต้องพึ่งพา — การออกแบบรวมกันช่วยให้เห็น dependency ชัดเจน
- **TSD_02, TSD_03** แยกตาม PRD เดิม เพราะเป็น Domain-specific module ที่ซับซ้อนพอจะแยกได้
- **TSD_04** แยกจาก Core เพราะระบบ ACC ใช้ prefix `v3_acc_` แยกเป็นอิสระ

---

## 7. Template มาตรฐานของ TSD แต่ละตัว (Standard TSD Template)

TSD ทุกตัวต้องมีหัวข้อต่อไปนี้เป็นอย่างน้อย:

```markdown
# TSD_XX: [ชื่อโมดูล]

# Technical Specification Document

> **Version:** x.x
> **Status:** Draft | Review | Approved
> **Last Updated:** [วันที่]
> **PRD Reference:** PRD #XX, #XX
> **Author:** Software Architect

---

## 1. ภาพรวมและขอบเขต (Overview & Scope)

- สรุปจาก PRD ที่อ้างอิง
- ขอบเขตของ TSD นี้ (ทำอะไร / ไม่ทำอะไร)
- Dependencies กับ TSD ตัวอื่น

## 2. Tech Stack & Architecture

- เทคโนโลยีที่ใช้ (Backend, Frontend, Database)
- Architectural Patterns (Model-Based, RESTful, JWT)
- System Diagram (ถ้าจำเป็น)

## 3. Database Schema (โครงสร้างฐานข้อมูล)

- Tables ทั้งหมดพร้อม Column definitions
- Data Types, Constraints, Indexes
- ER Diagram (Mermaid)
- Migration Notes (ถ้ามี Schema เดิมอยู่แล้ว)

## 4. API Endpoints (จุดเชื่อมต่อ API)

- สำหรับแต่ละ Endpoint ต้องระบุ:
  - Method (GET/POST/PUT/DELETE)
  - Path
  - Request Body / Query Parameters
  - Response Format (Success & Error)
  - Permission Required
  - Business Rules

## 5. Business Logic & Rules (ตรรกะทางธุรกิจ)

- กฎการคำนวณ
- Validation Rules
- State Machine / Workflow (ถ้ามี)
- Edge Cases

## 6. Security & Constraints (ความปลอดภัยและข้อจำกัด)

- Authentication & Authorization
- Permission Checks (ระบุ Action ที่ต้อง Check)
- Input Validation & Sanitization
- Rate Limiting / Abuse Prevention

## 7. Dependencies & Integration Points (จุดเชื่อมต่อระหว่างโมดูล)

- โมดูลอื่นที่ต้องพึ่งพา
- Shared Tables / Shared Services
- Event / Notification Triggers

## 8. Open Questions (คำถามที่ยังค้างอยู่)

- ประเด็นที่ต้องหารือเพิ่มเติม
```

---

## 8. ขั้นตอนการทำงาน (Workflow)

```
1. อ่านกฎเอกสารนี้ (TSD_RULES.md) ทุกครั้งก่อนเริ่มงาน
2. อ่าน PRD ที่เกี่ยวข้องกับ TSD ที่จะทำ — เข้าใจ Requirements ให้ครบ
3. อ่านเอกสารอ้างอิงเทคนิคใน ref/ (โดยเฉพาะ BACKEND_ARCHITECTURE, FRONTEND_STANDARDS, SQL Schema)
4. อ่านโค้ดจริง (ถ้ามี Implementation อยู่แล้ว) — ห้ามเดา
5. ระบุข้อมูลที่ขาดหาย → รวบรวมคำถาม → ถามผู้ใช้
6. รอคำตอบจากผู้ใช้ → ตรวจสอบความสอดคล้อง
7. เขียน TSD ตาม Template มาตรฐาน (ข้อ 7)
8. ส่งให้ผู้ใช้ตรวจสอบ → แก้ไขตาม Feedback
```

---

## 9. กลยุทธ์การทำงาน (Execution Strategy) — **Hybrid Approach**

> **ตัดสินใจแล้ว:** ใช้แนวทาง Hybrid (2025-03-05)

```
Phase 1: TSD_01 (Core Infrastructure) → ทำเต็มรูปแบบ (เป็นฐานที่ทุกโมดูลพึ่งพา)
Phase 2: TSD_02, TSD_03, TSD_04 → ทำ "โครงหลัก" (Schema + API หลัก + Dependencies)
Phase 3: เริ่ม Code TSD_01 → จากนั้น Code + เก็บรายละเอียด TSD ที่เหลือไล่ตาม
```

### คำจำกัดความ "โครงหลัก" (Skeleton):

- ✅ Database Schema (Tables + Columns + Relations)
- ✅ API Endpoints หลักๆ (Path + Method + สรุปสั้น)
- ✅ Dependencies กับ TSD ตัวอื่น
- ✅ Business Logic หลัก (กฎสำคัญ)
- ❌ ยังไม่ต้องมี: Edge Cases, Validation Rules ละเอียด, Error Messages, UI Specs

---

## 10. การจดบันทึกการคุย (Conversation Notes)

> **บังคับ:** ทุกครั้งที่มีการคุยเกี่ยวกับ TSD ต้องบันทึกสิ่งสำคัญไว้เสมอ

- ✅ **จดบันทึกการคุยที่จำเป็น** ไว้ที่ `../TSD_conversation_notes.md`
- ✅ **อัปเดตทุกครั้ง** ที่มี TSD สมบูรณ์ หรือมีการตัดสินใจทางเทคนิคสำคัญ
- ✅ **วัตถุประสงค์:** เพื่อให้กรณีขึ้นแชทใหม่สามารถอ่านและต่องานได้ทันที

### ข้อมูลที่ต้องบันทึก:

1. **สถานะ TSD แต่ละตัว** — ตัวไหนเสร็จแล้ว / กำลังทำ / ยังไม่เริ่ม
2. **สรุปการตัดสินใจทางเทคนิค** — เฉพาะประเด็นสำคัญ (เช่น เลือก Pattern แบบไหน เพราะอะไร)
3. **คำถามที่ค้างอยู่** — ถ้ามี Open Questions ให้จดไว้
4. **Schema Changes** — ถ้ามีการเพิ่ม/แก้ไข Table ต้องจดสรุปไว้
5. **Conversation IDs** — เก็บ ID ของแชทที่เกี่ยวข้องไว้สำหรับอ้างอิง

---

## 11. หลักการออกแบบของโครงการ (Project Design Principles)

TSD ทุกตัวต้องสอดคล้องกับหลักการเหล่านี้:

| หลักการ                         | รายละเอียด                                                                        |
| :------------------------------ | :-------------------------------------------------------------------------------- |
| **Action-Based Permission**     | ทุก Page และ Button ต้องผ่าน Permission Check (Level Default + User Override)     |
| **21-20 Temporal Logic**        | รอบเวลาทั้งหมด (Attendance, Payroll) ยึดวันที่ 21 ถึง 20 ของเดือน                 |
| **Zero-Assumption Calculation** | การคำนวณ OT/Payroll ต้อง Configurable ผ่าน Metadata Tables                        |
| **Security-First**              | JWT ผ่าน HttpOnly Cookies, PDO Prepared Statements ทุก Query                      |
| **Model-Based Backend**         | Pure PHP RESTful API ตาม Model Architecture                                       |
| **Prefix-Based Schema**         | ใช้ prefix ตาม module: `core_`, `hrm_`, `pay_`, `v3_acc_`                         |
| **Schema-First Verification**   | ก่อนเขียน SQL JOIN/WHERE ต้อง `DESCRIBE` table จริงทุกครั้ง — ห้ามเดา column      |
| **Safe Array Parsing**          | Frontend ต้องรองรับ API response ทุก format: `[]`, `{data:[]}`, `{data:{key:[]}}` |
| **MUI Dialog over Native**      | ห้ามใช้ `window.confirm/alert` — ใช้ MUI Dialog แทนเสมอ (ป้องกัน browser block)   |

---

## 12. สรุปกฎสำคัญ (Quick Reference)

| กฎ                      | รายละเอียด                                       |
| :---------------------- | :----------------------------------------------- |
| 🚫 ห้ามคาดเดา           | ต้องถามกลับเสมอ                                  |
| 🚫 ห้ามเติมข้อมูลเอง    | ข้อมูลต้องมาจากผู้ใช้, PRD, ref/, หรือโค้ดจริง   |
| 🚫 ห้ามเสนอโดยไม่ถาม    | ต้องถามว่า "โอเคไหม" ก่อน                        |
| 🚫 ห้ามเดา Schema/API   | ต้องอ่านจาก DB จริง หรือ PRD เท่านั้น            |
| 📋 แหล่งอ้างอิงหลัก     | PRD ที่ผ่านการอนุมัติ                            |
| 📁 แหล่งอ้างอิงเทคนิค   | จาก `ref/` และโค้ดจริง                           |
| 📁 เก็บไฟล์             | ที่ `TSD/` เท่านั้น                              |
| 🌐 ภาษา                 | ภาษาไทยเป็นหลัก, Terms ทางเทคนิคใช้อังกฤษได้     |
| 📄 รูปแบบ               | Markdown (.md) เท่านั้น                          |
| ⚠️ PRD vs Code ขัดแย้ง  | ถามผู้ใช้ก่อนว่าจะยึดตามแหล่งไหน                 |
| 🔍 ข้อมูลไม่พอ          | ค้นหามา → ถามว่าใช้อ้างอิงได้ไหม                 |
| 📝 จดบันทึกการคุย       | บันทึกไว้ที่ `../TSD_conversation_notes.md` เสมอ |
| 🏗️ ใช้ Template มาตรฐาน | ทุก TSD ต้องมีหัวข้อตาม Template (ข้อ 7)         |
