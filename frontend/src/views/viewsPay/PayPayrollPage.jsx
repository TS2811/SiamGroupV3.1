import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Tab, Tabs, Chip,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, IconButton, Tooltip, Alert,
    Card, CardContent, CircularProgress, Divider,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Calculate as CalcIcon,
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Paid as PaidIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { payService, settingsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ========================================
// Tab Panel Helper
// ========================================
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

// Status Chip Colors
const periodStatusColor = {
    DRAFT: 'default',
    REVIEWING: 'warning',
    FINALIZED: 'info',
    PAID: 'success',
};
const periodStatusLabel = {
    DRAFT: 'ร่าง',
    REVIEWING: 'ตรวจสอบ',
    FINALIZED: 'อนุมัติแล้ว',
    PAID: 'จ่ายแล้ว',
};

export default function PayPayrollPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Companies
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');

    // Periods
    const [periods, setPeriods] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Records
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [records, setRecords] = useState([]);
    const [periodSummary, setPeriodSummary] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Record Detail
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [recordDetail, setRecordDetail] = useState(null);

    // Item Types
    const [itemTypes, setItemTypes] = useState([]);

    // Create Period Dialog
    const [createDialog, setCreateDialog] = useState(false);
    const [newPeriodMonth, setNewPeriodMonth] = useState('');

    // Adjust Item Dialog
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [adjustData, setAdjustData] = useState({ item_type_id: '', amount: '', description: '' });

    // Confirm Dialog (shared)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });

    // ========================================
    // Load Initial Data
    // ========================================
    useEffect(() => {
        loadCompanies();
        loadItemTypes();
    }, []);

    useEffect(() => {
        if (selectedCompany) loadPeriods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCompany, selectedYear]);

    const loadCompanies = async () => {
        try {
            const res = await settingsService.getCompanies();
            const raw = res.data?.data;
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.companies) ? raw.companies : (Array.isArray(res.data) ? res.data : []));
            setCompanies(list);
            if (list.length > 0) {
                setSelectedCompany(list[0].id);
            }
        } catch (err) { console.error(err); }
    };

    const loadItemTypes = async () => {
        try {
            const res = await payService.getItemTypes();
            setItemTypes(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const loadPeriods = useCallback(async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const res = await payService.getPeriods({ company_id: selectedCompany, year: selectedYear });
            setPeriods(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [selectedCompany, selectedYear]);

    const loadRecords = useCallback(async (periodId) => {
        setLoading(true);
        try {
            const [recRes, perRes] = await Promise.all([
                payService.getRecords({ period_id: periodId, search: searchText || undefined }),
                payService.getPeriod(periodId),
            ]);
            setRecords(recRes.data?.data || recRes.data || []);
            const periodData = perRes.data?.data || perRes.data;
            setPeriodSummary(periodData?.summary || null);
            setSelectedPeriod(periodData);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [searchText]);

    const loadRecordDetail = async (recordId) => {
        try {
            const res = await payService.getRecord(recordId);
            setRecordDetail(res.data?.data || res.data);
        } catch (err) { console.error(err); }
    };

    // ========================================
    // Actions
    // ========================================
    const handleCreatePeriod = async () => {
        if (!newPeriodMonth || !selectedCompany) return;
        try {
            await payService.createPeriod({ company_id: selectedCompany, period_month: newPeriodMonth });
            showSnack('สร้างรอบเงินเดือนสำเร็จ');
            setCreateDialog(false);
            setNewPeriodMonth('');
            loadPeriods();
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    const handleCalculate = async (periodId) => {
        setConfirmDialog({
            open: true,
            title: 'คำนวณเงินเดือน',
            message: 'ต้องการคำนวณเงินเดือนรอบนี้?',
            action: async () => {
                setLoading(true);
                try {
                    const res = await payService.calculatePeriod(periodId);
                    showSnack(`คำนวณสำเร็จ ${res.data?.count || 0} คน`);
                    loadRecords(periodId);
                    loadPeriods();
                } catch (err) {
                    showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
                }
                setLoading(false);
            }
        });
    };

    const handleUpdateStatus = async (periodId, status) => {
        setConfirmDialog({
            open: true,
            title: `เปลี่ยนสถานะ`,
            message: `ต้องการเปลี่ยนสถานะเป็น ${periodStatusLabel[status]}?`,
            action: async () => {
                try {
                    await payService.updatePeriodStatus(periodId, status);
                    showSnack('อัปเดตสถานะสำเร็จ');
                    loadPeriods();
                    if (selectedPeriod?.id === periodId) loadRecords(periodId);
                } catch (err) {
                    showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
                }
            }
        });
    };

    const handleAdjustItem = async () => {
        if (!adjustData.item_type_id || !selectedRecord) return;
        try {
            await payService.adjustItem({
                record_id: selectedRecord,
                item_type_id: adjustData.item_type_id,
                amount: parseFloat(adjustData.amount) || 0,
                description: adjustData.description || null,
            });
            showSnack('บันทึกรายการสำเร็จ');
            setAdjustDialog(false);
            loadRecordDetail(selectedRecord);
        } catch (err) {
            showSnack(err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
        }
    };

    const showSnack = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fmtMoney = (v) => {
        const n = parseFloat(v) || 0;
        return n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    };

    const yearOptions = useMemo(() => {
        const curYear = new Date().getFullYear();
        return Array.from({ length: 3 }, (_, i) => curYear - 1 + i);
    }, []);

    // ========================================
    // RENDER
    // ========================================
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>💰 เงินเดือน (Payroll)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {companies.length > 0 && (
                        <TextField
                            select size="small" label="บริษัท" value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            sx={{ minWidth: 180 }}
                            slotProps={{ inputLabel: { shrink: true } }}
                        >
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name_th || c.name_en}</MenuItem>)}
                        </TextField>
                    )}
                    <TextField
                        select size="small" label="ปี" value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        sx={{ minWidth: 100 }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    >
                        {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </TextField>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
                    <Tab label="รอบเงินเดือน" />
                    <Tab label="รายละเอียดรอบ" disabled={!selectedPeriod} />
                    <Tab label="สลิปเงินเดือน" disabled={!selectedRecord} />
                </Tabs>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 0: Periods List */}
                {/* ═══════════════════════════════════════ */}
                <TabPanel value={tab} index={0}>
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>รอบเงินเดือน {selectedYear}</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadPeriods} size="small">
                                    รีเฟรช
                                </Button>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)} size="small">
                                    สร้างรอบใหม่
                                </Button>
                            </Box>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : periods.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>ยังไม่มีรอบเงินเดือนในปี {selectedYear}</Alert>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                                            <TableCell>รอบเดือน</TableCell>
                                            <TableCell>ช่วงวันที่</TableCell>
                                            <TableCell>วันจ่ายเงิน</TableCell>
                                            <TableCell align="center">สถานะ</TableCell>
                                            <TableCell align="right">การดำเนินการ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {periods.map(p => (
                                            <TableRow key={p.id} hover sx={{ cursor: 'pointer' }}
                                                onClick={() => { setSelectedPeriod(p); loadRecords(p.id); setTab(1); }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{p.period_month}</TableCell>
                                                <TableCell>{p.start_date} — {p.end_date}</TableCell>
                                                <TableCell>{p.pay_date}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={periodStatusLabel[p.status] || p.status}
                                                        color={periodStatusColor[p.status] || 'default'}
                                                        size="small" />
                                                </TableCell>
                                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                        {(p.status === 'DRAFT' || p.status === 'REVIEWING') && (
                                                            <Tooltip title="คำนวณเงินเดือน">
                                                                <IconButton size="small" color="primary" onClick={() => handleCalculate(p.id)}>
                                                                    <CalcIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {p.status === 'REVIEWING' && (
                                                            <Tooltip title="อนุมัติ (Finalize)">
                                                                <IconButton size="small" color="info" onClick={() => handleUpdateStatus(p.id, 'FINALIZED')}>
                                                                    <ApproveIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {p.status === 'FINALIZED' && (
                                                            <Tooltip title="จ่ายเงินแล้ว">
                                                                <IconButton size="small" color="success" onClick={() => handleUpdateStatus(p.id, 'PAID')}>
                                                                    <PaidIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="ดูรายละเอียด">
                                                            <IconButton size="small" onClick={() => { setSelectedPeriod(p); loadRecords(p.id); setTab(1); }}>
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </TabPanel>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 1: Period Detail (Records) */}
                {/* ═══════════════════════════════════════ */}
                <TabPanel value={tab} index={1}>
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Button startIcon={<BackIcon />} onClick={() => setTab(0)} size="small">กลับ</Button>
                            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                                รอบ {selectedPeriod?.period_month}
                                {selectedPeriod && <Chip label={periodStatusLabel[selectedPeriod.status]} color={periodStatusColor[selectedPeriod.status]} size="small" sx={{ ml: 1 }} />}
                            </Typography>
                            {(selectedPeriod?.status === 'DRAFT' || selectedPeriod?.status === 'REVIEWING') && (
                                <Button variant="contained" startIcon={<CalcIcon />}
                                    onClick={() => handleCalculate(selectedPeriod.id)} size="small">
                                    คำนวณเงินเดือน
                                </Button>
                            )}
                        </Box>

                        {/* Summary Cards */}
                        {periodSummary && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'จำนวนพนักงาน', value: periodSummary.employee_count, color: '#3B82F6' },
                                    { label: 'รวมรายได้', value: `฿${fmtMoney(periodSummary.total_income)}`, color: '#10B981' },
                                    { label: 'รวมเงินหัก', value: `฿${fmtMoney(periodSummary.total_deduction)}`, color: '#F59E0B' },
                                    { label: 'เงินเดือนสุทธิรวม', value: `฿${fmtMoney(periodSummary.total_net_pay)}`, color: '#8B5CF6' },
                                ].map((item, idx) => (
                                    <Card key={idx} sx={{ flex: '1 1 200px', borderRadius: 3, borderTop: `4px solid ${item.color}` }}>
                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {/* Search */}
                        <TextField
                            size="small" placeholder="ค้นหาพนักงาน..." value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && selectedPeriod && loadRecords(selectedPeriod.id)}
                            sx={{ mb: 2, width: 300 }}
                            slotProps={{
                                input: {
                                    startAdornment: <SearchIcon sx={{ color: 'grey.400', mr: 1 }} />,
                                }
                            }}
                        />

                        {/* Records Table */}
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.50' } }}>
                                            <TableCell>รหัส</TableCell>
                                            <TableCell>ชื่อ-นามสกุล</TableCell>
                                            <TableCell>แผนก</TableCell>
                                            <TableCell align="right">เงินเดือนฐาน</TableCell>
                                            <TableCell align="right">รวมรายได้</TableCell>
                                            <TableCell align="right">รวมหัก</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>สุทธิ</TableCell>
                                            <TableCell align="center">ดู</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {records.map(r => (
                                            <TableRow key={r.id} hover>
                                                <TableCell>{r.employee_code}</TableCell>
                                                <TableCell>{r.first_name_th} {r.last_name_th}</TableCell>
                                                <TableCell>{r.department_name || '-'}</TableCell>
                                                <TableCell align="right">{fmtMoney(r.base_salary)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main' }}>{fmtMoney(r.total_income)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main' }}>{fmtMoney(r.total_deduction)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(r.net_pay)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => {
                                                        setSelectedRecord(r.id);
                                                        loadRecordDetail(r.id);
                                                        setTab(2);
                                                    }}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {records.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    ยังไม่มีข้อมูลเงินเดือน — กดปุ่ม "คำนวณเงินเดือน"
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </TabPanel>

                {/* ═══════════════════════════════════════ */}
                {/* TAB 2: Payslip Detail */}
                {/* ═══════════════════════════════════════ */}
                <TabPanel value={tab} index={2}>
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Button startIcon={<BackIcon />} onClick={() => setTab(1)} size="small">กลับ</Button>
                            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                                สลิปเงินเดือน — {recordDetail?.first_name_th} {recordDetail?.last_name_th}
                            </Typography>
                            {selectedPeriod?.status === 'REVIEWING' && (
                                <Button variant="outlined" startIcon={<EditIcon />} size="small"
                                    onClick={() => {
                                        setAdjustData({ item_type_id: '', amount: '', description: '' });
                                        setAdjustDialog(true);
                                    }}>
                                    เพิ่ม/แก้ไขรายการ
                                </Button>
                            )}
                        </Box>

                        {recordDetail && (
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {/* ข้อมูลพนักงาน */}
                                <Paper sx={{ flex: '1 1 300px', p: 2, borderRadius: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                        ข้อมูลพนักงาน
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: 14 }}>
                                        <Typography variant="body2" color="text.secondary">รหัส</Typography>
                                        <Typography variant="body2">{recordDetail.employee_code}</Typography>
                                        <Typography variant="body2" color="text.secondary">ชื่อ</Typography>
                                        <Typography variant="body2">{recordDetail.first_name_th} {recordDetail.last_name_th}</Typography>
                                        <Typography variant="body2" color="text.secondary">แผนก</Typography>
                                        <Typography variant="body2">{recordDetail.department_name || '-'}</Typography>
                                        <Typography variant="body2" color="text.secondary">รอบเดือน</Typography>
                                        <Typography variant="body2">{recordDetail.period_month}</Typography>
                                        {recordDetail.working_days && <>
                                            <Typography variant="body2" color="text.secondary">วันทำงาน</Typography>
                                            <Typography variant="body2">{recordDetail.working_days} วัน</Typography>
                                        </>}
                                    </Box>
                                </Paper>

                                {/* รายการรายได้/หัก */}
                                <Paper sx={{ flex: '2 1 400px', p: 2, borderRadius: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                        รายการรายได้/เงินหัก
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 600 } }}>
                                                <TableCell>รายการ</TableCell>
                                                <TableCell>ประเภท</TableCell>
                                                <TableCell align="right">จำนวนเงิน</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(recordDetail.items || []).map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name_th}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={item.type === 'INCOME' ? 'รายได้' : 'เงินหัก'}
                                                            size="small"
                                                            color={item.type === 'INCOME' ? 'success' : 'error'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        fontWeight: 600,
                                                        color: item.type === 'INCOME' ? 'success.main' : 'error.main'
                                                    }}>
                                                        {item.type === 'DEDUCTION' ? '-' : ''}{fmtMoney(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">รวมรายได้</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                            ฿{fmtMoney(recordDetail.total_income)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">รวมเงินหัก</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                            -฿{fmtMoney(recordDetail.total_deduction)}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>เงินเดือนสุทธิ</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            ฿{fmtMoney(recordDetail.net_pay)}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </TabPanel>
            </Paper>

            {/* ═══════════════════════════════════════ */}
            {/* Dialog: Create Period */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="xs" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>สร้างรอบเงินเดือนใหม่</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth type="month" label="รอบเดือน" value={newPeriodMonth}
                        onChange={(e) => setNewPeriodMonth(e.target.value)}
                        sx={{ mt: 1 }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        ระบบจะสร้างรอบอัตโนมัติ: วันที่ 21 เดือนก่อน — วันที่ 20 เดือนที่เลือก
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCreateDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleCreatePeriod} disabled={!newPeriodMonth}>สร้าง</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════ */}
            {/* Dialog: Adjust Item */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={adjustDialog} onClose={() => setAdjustDialog(false)} maxWidth="sm" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>เพิ่ม/แก้ไขรายการ</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            select fullWidth label="หัวข้อรายการ" value={adjustData.item_type_id}
                            onChange={(e) => setAdjustData({ ...adjustData, item_type_id: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        >
                            {itemTypes.filter(t => t.calc_type === 'MANUAL').map(t => (
                                <MenuItem key={t.id} value={t.id}>
                                    {t.name_th} ({t.type === 'INCOME' ? 'รายได้' : 'เงินหัก'})
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth type="number" label="จำนวนเงิน (บาท)" value={adjustData.amount}
                            onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            fullWidth label="รายละเอียดเพิ่มเติม" value={adjustData.description}
                            onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAdjustDialog(false)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleAdjustItem}
                        disabled={!adjustData.item_type_id}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════ */}
            {/* Dialog: Confirm Action */}
            {/* ═══════════════════════════════════════ */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} maxWidth="xs" fullWidth
                slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mt: 1 }}>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>ยกเลิก</Button>
                    <Button variant="contained" onClick={async () => {
                        setConfirmDialog({ ...confirmDialog, open: false });
                        if (confirmDialog.action) await confirmDialog.action();
                    }}>ยืนยัน</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
