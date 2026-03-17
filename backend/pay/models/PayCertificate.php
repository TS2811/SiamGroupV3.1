<?php

/**
 * SiamGroup V3.1 — PayCertificate Model
 * 
 * จัดการเอกสาร Generate จากระบบ (6 ประเภท, 2 ฝั่งลงนาม)
 * อ้างอิง: PRD_03 Section 11
 */

class PayCertificate extends BaseModel
{
    protected string $table = 'pay_certificates';

    // Document type labels
    const DOC_TYPES = [
        'CERT_WORK'    => 'หนังสือรับรองการทำงาน',
        'CERT_SALARY'  => 'หนังสือรับรองเงินเดือน',
        'CONTRACT'     => 'สัญญาจ้างงาน',
        'SUBCONTRACT'  => 'สัญญาจ้างเหมาบริการ',
        'RESIGN'       => 'ใบลาออก',
        'DISCIPLINARY' => 'ใบลงโทษ/ตักเตือน',
    ];

    /**
     * ดึงรายการเอกสารพร้อมข้อมูลพนักงาน
     */
    public function getCertificates(?int $companyId = null, ?int $employeeId = null, ?string $docType = null, ?string $status = null): array
    {
        $sql = "SELECT c.*, 
                    e.employee_code,
                    u.first_name_th, u.last_name_th,
                    req.first_name_th AS requester_name,
                    appr.first_name_th AS approver_name
                FROM pay_certificates c
                JOIN hrm_employees e ON c.employee_id = e.id
                JOIN core_users u ON e.user_id = u.id
                JOIN core_users req ON c.requested_by = req.id
                LEFT JOIN core_users appr ON c.approver_id = appr.id
                WHERE 1=1";
        $params = [];

        if ($companyId) {
            $sql .= " AND e.company_id = :cid";
            $params['cid'] = $companyId;
        }
        if ($employeeId) {
            $sql .= " AND c.employee_id = :eid";
            $params['eid'] = $employeeId;
        }
        if ($docType) {
            $sql .= " AND c.doc_type = :dtype";
            $params['dtype'] = $docType;
        }
        if ($status) {
            $sql .= " AND c.status = :status";
            $params['status'] = $status;
        }

        $sql .= " ORDER BY c.created_at DESC";
        return $this->query($sql, $params);
    }

    /**
     * สร้างคำขอเอกสาร
     */
    public function createCertificate(array $data): int
    {
        // Auto-generate document number: DOC-YYYYMM-XXXX
        $docNumber = $this->generateDocNumber($data['doc_type']);

        // ดึงเงินเดือนปัจจุบัน (สำหรับ CERT_SALARY)
        $salaryAtIssue = null;
        if ($data['doc_type'] === 'CERT_SALARY') {
            $emp = $this->query(
                "SELECT base_salary FROM hrm_employees WHERE id = :eid",
                ['eid' => $data['employee_id']]
            );
            $salaryAtIssue = $emp[0]['base_salary'] ?? null;
        }

        return $this->create([
            'employee_id'     => $data['employee_id'],
            'doc_type'        => $data['doc_type'],
            'document_number' => $docNumber,
            'issued_date'     => $data['issued_date'] ?? date('Y-m-d'),
            'requested_by'    => $data['requested_by'],
            'approver_id'     => $data['approver_id'] ?? null,
            'status'          => 'PENDING_APPROVAL',
            'salary_at_issue' => $salaryAtIssue,
            'notes'           => $data['notes'] ?? null,
        ]);
    }

    /**
     * ผู้ยืนยันลงนาม/อนุมัติ
     */
    public function signCertificate(int $certId, string $signMethod, ?string $signaturePath = null, ?string $signedDocPath = null): bool
    {
        $data = [
            'status'      => ($signMethod === 'APPROVE_ONLY') ? 'APPROVED' : 'SIGNED',
            'sign_method' => $signMethod,
            'approved_at' => date('Y-m-d H:i:s'),
        ];

        if ($signaturePath) {
            $data['signature_image_path'] = $signaturePath;
        }
        if ($signedDocPath) {
            $data['signed_document_path'] = $signedDocPath;
        }

        return $this->update($certId, $data);
    }

    /**
     * ปฏิเสธเอกสาร
     */
    public function rejectCertificate(int $certId, string $reason): bool
    {
        return $this->update($certId, [
            'status'        => 'REJECTED',
            'reject_reason' => $reason,
            'approved_at'   => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Auto-generate document number
     */
    private function generateDocNumber(string $docType): string
    {
        $prefix = match ($docType) {
            'CERT_WORK'    => 'CW',
            'CERT_SALARY'  => 'CS',
            'CONTRACT'     => 'CT',
            'SUBCONTRACT'  => 'SC',
            'RESIGN'       => 'RS',
            'DISCIPLINARY' => 'DC',
            default        => 'XX',
        };

        $yearMonth = date('Ym');

        // หา running number
        $result = $this->query(
            "SELECT COUNT(*) + 1 as next_num 
             FROM pay_certificates 
             WHERE document_number LIKE :pattern",
            ['pattern' => "{$prefix}-{$yearMonth}%"]
        );

        $nextNum = str_pad($result[0]['next_num'] ?? 1, 4, '0', STR_PAD_LEFT);
        return "{$prefix}-{$yearMonth}-{$nextNum}";
    }
}
