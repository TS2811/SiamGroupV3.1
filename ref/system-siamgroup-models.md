# เอกสารแผนพัฒนาระบบ (System Development Plan)

**Project:** Unified Multi-Module System (PHP Backend + JSX Frontend)
**Version:** 3.1
**Date:** 2026-02-26

---

## 1. ขอบเขตของระบบ (Project Scope)

พัฒนาระบบศูนย์กลางที่สามารถรวบรวมระบบย่อยต่างๆ เข้าด้วยกัน โดยมีการจัดการสิทธิ์การเข้าถึง (RBAC) และส่วนต่อประสานผู้ใช้ (UI) ที่ยืดหยุ่น รองรับการใช้งานทั้ง Desktop และ Mobile

### Technology Stack:

- **Frontend:** React (JSX)
- **Backend:** PHP (RESTful API)
- **Database:** MySQL

---

## 2. โครงสร้างส่วนต่อประสานผู้ใช้ (UI Structure)

### 2.1 Navigation Bar (ระบบหลัก - Top Bar)

เป็นแถบเมนูคงที่ด้านบน (Fixed Top) เพื่อใช้สลับระหว่างระบบงานหลัก:

- **Desktop View:**
  - ปุ่มเมนูหลัก (Main Systems) แสดงผลตามสิทธิ์ของผู้ใช้ (Role-based)
  - ไอคอนกระดิ่งแจ้งเตือน (Notification Bell)
  - ปุ่ม Logout
- **Mobile View (Responsive):**
  - แสดงเมนูหลักที่จำเป็น
  - ไอคอนกระดิ่งแจ้งเตือน
  - **Hamburger Menu:** เมื่อกดจะกางเมนูย่อย (Sidebar items) และปุ่ม Logout ออกมา

### 2.2 Sidebar (ระบบย่อย - Side Navigation)

- **Desktop View:**
  แสดงผลด้านซ้ายมือเมื่อเข้าสู่ระบบหลักใดระบบหนึ่ง:
  - เรียกรายการหน้า (Pages) ที่เกี่ยวข้องกับระบบย่อยนั้นๆ
  - สามารถย่อ-ขยายได้ (Collapsible) เพื่อเพิ่มพื้นที่ทำงาน
- **Mobile View (Responsive):**
  แสดงผลด้านล่างของจอเมื่อเข้าสู่ระบบหลักใดระบบหนึ่ง
  - เรียกรายการหน้า (Pages) ที่เกี่ยวข้องกับระบบย่อยนั้นๆ

---

## 3. แผนการพัฒนา (Development Roadmap)

### Phase 1: Foundation & API (Backend - PHP)

- สร้าง API สำหรับ Login และคืนค่า `Menu JSON Tree` ตามสิทธิ์ของ User
- สร้าง Middleware ตรวจสอบ Token (JWT)

### Phase 2: Layout Engine (Frontend - JSX)

- สร้าง **MainLayout Component** เพื่อคุมโครงสร้าง Navbar และ Sidebar
- พัฒนาระบบ **Dynamic Routing** ที่ดึงค่าจาก API มา Render เมนู
- ทำระบบ **Responsive Context** (เช็คขนาดจอเพื่อสลับระหว่าง Sidebar กับ Hamburger Menu)

### Phase 3: Modules & Features

- พัฒนาระบบแจ้งเตือน (Notification API)
- เริ่มสร้างหน้า UI ของระบบย่อยแต่ละตัวในรูปแบบ Component
- ระบบ Logout และการทำลาย Session/Token

---

## 4. แผนผังการทำงาน (Logic Flow)

1. User Login -> Backend ตรวจสอบสิทธิ์
2. Backend คืนค่ารายการเมนูที่ User มีสิทธิ์เข้าถึงทั้งหมด
3. Frontend (React) นำข้อมูลเมนูไปสร้าง Navbar
4. เมื่อ User คลิกเลือกเมนูบน Navbar -> Sidebar จะเปลี่ยนรายการไปตาม `parent_id` ของเมนูนั้น
5. หากหน้าจอเล็กลง (Mobile) ระบบจะซ่อน Sidebar และนำเมนูไปใส่ใน Hamburger อัตโนมัติ

---
