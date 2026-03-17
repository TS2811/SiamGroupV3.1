-- Fix corrupted Thai TABLE COMMENTs
-- Tables that display ??? in DB viewer

-- HRM Tables
ALTER TABLE `hrm_employee_documents` COMMENT = 'เอกสารพนักงาน (สัญญาจ้าง/บัตรประชาชน/ใบขับขี่)';

ALTER TABLE `hrm_evaluation_criteria` COMMENT = 'เกณฑ์การประเมินผลงาน (KPI/หัวข้อประเมิน)';

ALTER TABLE `hrm_evaluation_scores` COMMENT = 'คะแนนประเมินผลงานรายบุคคลต่อเกณฑ์';

ALTER TABLE `hrm_evaluations` COMMENT = 'รอบการประเมินผลงานพนักงาน';

ALTER TABLE `hrm_personal_off_days` COMMENT = 'วันหยุดส่วนตัวพนักงาน (HR กำหนดให้เป็นรายบุคคล)';

ALTER TABLE `hrm_user_daily_remarks` COMMENT = 'Remark รายวันของพนักงาน (HR บันทึกหมายเหตุ)';

-- Payroll Tables
ALTER TABLE `pay_bonuses` COMMENT = 'โบนัสพนักงาน (คำนวณจากเงินเดือนและ Attendance 70% + Attendance)';

ALTER TABLE `pay_certificates` COMMENT = 'หนังสือรับรองเงินเดือน Generate (สร้างจากข้อมูลพนักงานและเงินเดือน)';

ALTER TABLE `pay_item_types` COMMENT = 'ประเภทรายการเงินเดือน/รายได้/หักเงิน (Configurable จาก HR Module)';

ALTER TABLE `pay_loan_payments` COMMENT = 'รายการชำระเงินกู้พนักงาน (ตัดจากเงินเดือน)';

ALTER TABLE `pay_loans` COMMENT = 'สัญญาเงินกู้พนักงาน/เงินยืมบริษัท (Flat Rate Interest)';

ALTER TABLE `pay_ot_fixed_rates` COMMENT = 'อัตราค่าล่วงเวลา OT แบบคงที่ Fixed Rate (Tier ตามระดับตำแหน่ง)';

ALTER TABLE `pay_ot_time_slots` COMMENT = 'ช่วงเวลาคำนวณค่าล่วงเวลา OT แบบช่วง Time Slot (CNX Shift Premium)';

ALTER TABLE `pay_ot_types` COMMENT = 'ประเภทการคำนวณ OT (Configurable มี 3 รูปแบบ: FORMULA, FIXED_RATE, TIME_SLOT)';

ALTER TABLE `pay_payroll_items` COMMENT = 'รายการย่อยเงินเดือน/รายได้/หัก (สลิปเงินเดือนรายบุคคล)';

ALTER TABLE `pay_payroll_periods` COMMENT = 'งวดเงินเดือน/รอบการจ่ายเงินเดือน (21-20 cycle)';

ALTER TABLE `pay_payroll_records` COMMENT = 'บันทึกเงินเดือนหลักรายบุคคลต่องวด (สรุปยอดจ่าย)';

ALTER TABLE `pay_salary_advances` COMMENT = 'เงินเดือนล่วงหน้า/เบิกก่อนกำหนด (Dual-approval)';