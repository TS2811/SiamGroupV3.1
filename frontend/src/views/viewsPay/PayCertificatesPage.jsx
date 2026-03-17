import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert,
    CircularProgress, Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Description as DocIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { payService, settingsService, hrmService } from '../../services/api';

// ประเภทเอกสาร
const DOC_TYPES = {
    CERT_WORK: 'หนังสือรับรองการทำงาน',
    CERT_SALARY: 'หนังสือรับรองเงินเดือน',
    CONTRACT: 'สัญญาจ้างงาน',
    SUBCONTRACT: 'สัญญาจ้างเหมาบริการ',
    RESIGN: 'ใบลาออก',
    DISCIPLINARY: 'ใบลงโทษ/ตักเตือน',
};

const STATUS_MAP = {
    PENDING_APPROVAL: { label: 'รออนุมัติ', color: 'warning' },
    APPROVED: { label: 'อนุมัติแล้ว', color: 'success' },
    SIGNED: { label: 'ลงนามแล้ว', color: 'info' },
    REJECTED: { label: 'ปฏิเสธ', color: 'error' },
};

export default function PayCertificatesPage() {
    // State
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [employees, setEmployees] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDocType, setFilterDocType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Dialog state
    const [createDialog, setCreateDialog] = useState(false);
    const [viewDialog, setViewDialog] = useState(false);
    const [rejectDialog, setRejectDialog] = useState(false);
    const [approveDialog, setApproveDialog] = useState(false);
    const [approveCertId, setApproveCertId] = useState(null);
    const [selectedCert, setSelectedCert] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [newCert, setNewCert] = useState({ employee_id: '', doc_type: '', notes: '' });

    // Snackbar
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

    // Load companies
    useEffect(() => {
        (async () => {
            try {
                const res = await settingsService.getCompanies();
                const raw = res.data?.data;
                const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.companies) ? raw.companies : (Array.isArray(res.data) ? res.data : []));
                setCompanies(list);
                if (list.length > 0) setSelectedCompany(list[0].id);
            } catch (err) { console.error(err); }
        })();
    }, []);

    // Load employees
    useEffect(() => {
        if (!selectedCompany) return;
        (async () => {
            try {
                const res = await hrmService.getEmployees({ company_id: selectedCompany });
                const data = res.data?.data?.employees || res.data?.data || res.data || [];
                setEmployees(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        })();
    }, [selectedCompany]);

    // Load certificates
    const loadCertificates = useCallback(async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const params = { company_id: selectedCompany };
            if (filterDocType) params.doc_type = filterDocType;
            if (filterStatus) params.status = filterStatus;
            const res = await payService.getCertificates(params);
            const data = res.data?.data || res.data || [];
            setCertificates(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [selectedCompany, filterDocType, filterStatus]);

    useEffect(() => { loadCertificates(); }, [loadCertificates]);

    // Create certificate
    const handleCreate = async () => {
        if (!newCert.employee_id || !newCert.doc_type) return;
        try {
            await payService.createCertificate(newCert);
            showSnack('สร้างคำขอเอกสารสำเร็จ');
            setCreateDialog(false);
            setNewCert({ employee_id: '', doc_type: '', notes: '' });
            loadCertificates();
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    // Approve (sign)
    const openApproveDialog = (certId) => {
        setApproveCertId(certId);
        setApproveDialog(true);
    };
    const handleApprove = async () => {
        if (!approveCertId) return;
        try {
            await payService.signCertificate(approveCertId, { sign_method: 'APPROVE_ONLY' });
            showSnack('อนุมัติเอกสารสำเร็จ');
            setApproveDialog(false);
            setApproveCertId(null);
            loadCertificates();
            setViewDialog(false);
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    // Reject
    const handleReject = async () => {
        if (!selectedCert) return;
        try {
            await payService.rejectCertificate(selectedCert.id, rejectReason);
            showSnack('ปฏิเสธเอกสารสำเร็จ');
            setRejectDialog(false);
            setRejectReason('');
            loadCertificates();
            setViewDialog(false);
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    return (
        <Box sx={{ p: { xs: 1, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <DocIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                    หนังสือรับรอง / เอกสาร (Certificates)
                </Typography>
                <TextField select size="small" label="บริษัท" value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)} sx={{ minWidth: 200 }}>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name_th}</MenuItem>)}
                </TextField>
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Filters + Create */}
                <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField select size="small" label="ประเภทเอกสาร" value={filterDocType}
                        onChange={(e) => setFilterDocType(e.target.value)} sx={{ minWidth: 200 }}>
                        <MenuItem value="">ทั้งหมด</MenuItem>
                        {Object.entries(DOC_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="สถานะ" value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)} sx={{ minWidth: 150 }}>
                        <MenuItem value="">ทั้งหมด</MenuItem>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                    </TextField>
                    <Box sx={{ flex: 1 }} />
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => setCreateDialog(true)} size="small">
                        ขอเอกสาร
                    </Button>
                </Box>

                {/* Table */}
                {loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
                ) : certificates.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        ยังไม่มีรายการเอกสาร
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                                    <TableCell>เลขเอกสาร</TableCell>
                                    <TableCell>พนักงาน</TableCell>
                                    <TableCell>ประเภท</TableCell>
                                    <TableCell>วันที่ออก</TableCell>
                                    <TableCell align="center">สถานะ</TableCell>
                                    <TableCell align="right">การดำเนินการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {certificates.map(cert => (
                                    <TableRow key={cert.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{cert.document_number}</TableCell>
                                        <TableCell>{cert.first_name_th} {cert.last_name_th}</TableCell>
                                        <TableCell>{DOC_TYPES[cert.doc_type] || cert.doc_type}</TableCell>
                                        <TableCell>{cert.issued_date}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={STATUS_MAP[cert.status]?.label || cert.status}
                                                color={STATUS_MAP[cert.status]?.color || 'default'} size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="ดูรายละเอียด">
                                                    <IconButton size="small" onClick={() => { setSelectedCert(cert); setViewDialog(true); }}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {cert.status === 'PENDING_APPROVAL' && (
                                                    <>
                                                        <Tooltip title="อนุมัติ">
                                                            <IconButton size="small" color="success" onClick={() => openApproveDialog(cert.id)}>
                                                                <ApproveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="ปฏิเสธ">
                                                            <IconButton size="small" color="error" onClick={() => { setSelectedCert(cert); setRejectDialog(true); }}>
                                                                <RejectIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* ═══════════════════════════════════════ */}
            {/* Create Dialog */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>ขอเอกสารใหม่</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField select label="พนักงาน" value={newCert.employee_id}
                            onChange={(e) => setNewCert({ ...newCert, employee_id: e.target.value })} fullWidth>
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>
                                    {emp.employee_code} — {emp.first_name_th} {emp.last_name_th}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select label="ประเภทเอกสาร" value={newCert.doc_type}
                            onChange={(e) => setNewCert({ ...newCert, doc_type: e.target.value })} fullWidth>
                            {Object.entries(DOC_TYPES).map(([k, v]) => (
                                <MenuItem key={k} value={k}>{v}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="หมายเหตุ" value={newCert.notes}
                            onChange={(e) => setNewCert({ ...newCert, notes: e.target.value })}
                            multiline rows={3} fullWidth />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleCreate}
                        disabled={!newCert.employee_id || !newCert.doc_type}>
                        ส่งคำขอ
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════ */}
            {/* View Dialog */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>รายละเอียดเอกสาร</DialogTitle>
                <DialogContent>
                    {selectedCert && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                            {[
                                ['เลขเอกสาร', selectedCert.document_number],
                                ['ประเภท', DOC_TYPES[selectedCert.doc_type] || selectedCert.doc_type],
                                ['พนักงาน', `${selectedCert.employee_code} — ${selectedCert.first_name_th} ${selectedCert.last_name_th}`],
                                ['วันที่ออก', selectedCert.issued_date],
                                ['สถานะ', STATUS_MAP[selectedCert.status]?.label || selectedCert.status],
                                ['ผู้ขอ', selectedCert.requester_name || '-'],
                                ['ผู้อนุมัติ', selectedCert.approver_name || '-'],
                                ...(selectedCert.salary_at_issue ? [['เงินเดือน ณ วันออก', `฿${Number(selectedCert.salary_at_issue).toLocaleString()}`]] : []),
                                ...(selectedCert.notes ? [['หมายเหตุ', selectedCert.notes]] : []),
                                ...(selectedCert.reject_reason ? [['เหตุผลที่ปฏิเสธ', selectedCert.reject_reason]] : []),
                            ].map(([label, value], i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedCert?.status === 'PENDING_APPROVAL' && (
                        <>
                            <Button color="error" onClick={() => setRejectDialog(true)}>ปฏิเสธ</Button>
                            <Button variant="contained" color="success" onClick={() => openApproveDialog(selectedCert.id)}>อนุมัติ</Button>
                        </>
                    )}
                    <Button onClick={() => setViewDialog(false)}>ปิด</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════ */}
            {/* Reject Dialog */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>ปฏิเสธเอกสาร</DialogTitle>
                <DialogContent>
                    <TextField label="เหตุผล" value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        multiline rows={3} fullWidth sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" color="error" onClick={handleReject}>ปฏิเสธ</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════ */}
            {/* Approve Confirm Dialog */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>ยืนยันอนุมัติเอกสาร</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        ต้องการอนุมัติเอกสารนี้หรือไม่?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApproveDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" color="success" onClick={handleApprove}>อนุมัติ</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
            </Snackbar>
        </Box>
    );
}
