# 📝 TSD Conversation Notes

> **วัตถุประสงค์:** บันทึกสิ่งสำคัญเพื่อให้กรณีขึ้นแชทใหม่สามารถอ่านและต่องานได้ทันที

---

## สถานะ TSD

| TSD       | ชื่อโมดูล           | สถานะ            | หมายเหตุ                            |
| :-------- | :------------------ | :--------------- | :---------------------------------- |
| TSD_RULES | กฎการทำงาน          | ✅ เสร็จ         | กลยุทธ์ Hybrid                      |
| TSD_01    | Core Infrastructure | 📝 Draft v1.0    | เสร็จครบทุก Section — รอ Review     |
| TSD_02    | HRM Module          | 🏗️ Skeleton v0.1 | โครงหลักเสร็จ — 16 ตาราง, 30+ APIs  |
| TSD_03    | Payroll Module      | 🏗️ Skeleton v0.1 | โครงหลักเสร็จ — 12 ตาราง, OT Engine |
| TSD_04    | ACC Module          | 🏗️ Skeleton v0.1 | โครงหลักเสร็จ — iframe Embed        |

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

---

## Open Questions ที่ค้างอยู่ (จาก TSD_01)

| #   | คำถาม                                                             | สถานะ         |
| :-- | :---------------------------------------------------------------- | :------------ |
| 1   | Theme / Color Palette สำหรับ V3.1 — ใช้สีอะไร?                    | ⏳ รอตัดสินใจ |
| 2   | Notification — ใช้ Telegram Bot ตัวเดียวกับระบบเดิมหรือสร้างใหม่? | ⏳ รอตัดสินใจ |
| 3   | File Upload Storage — local disk หรือ Cloud Storage?              | ⏳ รอตัดสินใจ |

---

## Conversation IDs

| ID                                     | หัวข้อ                   | วันที่     |
| :------------------------------------- | :----------------------- | :--------- |
| `04665f4c-635d-48dc-955d-c9d704ac138a` | สร้าง TSD Rules + TSD_01 | 2026-03-05 |
