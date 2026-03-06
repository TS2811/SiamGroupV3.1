import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Stack, Tabs, Tab, Chip, TextField,
    Button, RadioGroup, Radio, FormControlLabel, FormControl, FormLabel,
    Select, MenuItem, InputLabel, Alert, Divider, Paper, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox,
    FormControlLabel as FCL,
} from '@mui/material';
import {
    Add, FilterList, EventBusy, AccessTime as OTIcon, EditCalendar,
    SwapHoriz, CheckCircle, Cancel, Pending, Visibility,
} from '@mui/icons-material';

// ========================================
// Status styling
// ========================================
const STATUS_MAP = {
    PENDING: { label: 'รออนุมัติ', color: 'warning', icon: <Pending fontSize="small" /> },
    APPROVED: { label: 'อนุมัติ', color: 'success', icon: <CheckCircle fontSize="small" /> },
    REJECTED: { label: 'ปฏิเสธ', color: 'error', icon: <Cancel fontSize="small" /> },
    CANCELLED: { label: 'ยกเลิก', color: 'default', icon: <Cancel fontSize="small" /> },
};

// ========================================
// Mock requests data
// ========================================
const MOCK_REQUESTS = [
    { id: 1, type: 'LEAVE', typeName: 'ขอลา', subtype: 'ป่วย', dateFrom: '2026-03-01', dateTo: '2026-03-01', status: 'APPROVED', approver: 'หัวหน้า A', createdAt: '2026-02-28', reason: 'ไม่สบาย' },
    { id: 2, type: 'OT', typeName: 'ขอ OT', subtype: 'OT_1_5', dateFrom: '2026-02-27', dateTo: '2026-02-27', status: 'APPROVED', approver: 'หัวหน้า A', createdAt: '2026-02-27', reason: 'ปิดงาน' },
    { id: 3, type: 'LEAVE', typeName: 'ขอลา', subtype: 'กิจ', dateFrom: '2026-03-10', dateTo: '2026-03-10', status: 'PENDING', approver: 'หัวหน้า A', createdAt: '2026-03-03', reason: 'ธุระส่วนตัว' },
    { id: 4, type: 'TIME_CORRECTION', typeName: 'แก้เวลา', subtype: '', dateFrom: '2026-02-25', dateTo: '2026-02-25', status: 'REJECTED', approver: 'หัวหน้า A', createdAt: '2026-02-26', reason: 'ลืมเช็คเอาท์' },
    { id: 5, type: 'SHIFT_SWAP', typeName: 'สลับกะ', subtype: 'SWAP', dateFrom: '2026-03-08', dateTo: '2026-03-09', status: 'PENDING', approver: 'หัวหน้า A', createdAt: '2026-03-04', reason: 'สลับกะกับพี่ B' },
];

// ========================================
// Tab icon mapping
// ========================================
const TAB_TYPES = [
    { value: '', label: 'ทั้งหมด', icon: null },
    { value: 'LEAVE', label: 'ขอลา', icon: <EventBusy fontSize="small" /> },
    { value: 'OT', label: 'ขอ OT', icon: <OTIcon fontSize="small" /> },
    { value: 'TIME_CORRECTION', label: 'แก้เวลา', icon: <EditCalendar fontSize="small" /> },
    { value: 'SHIFT_SWAP', label: 'สลับกะ', icon: <SwapHoriz fontSize="small" /> },
];

// ========================================
// Leave Form Component
// ========================================
function LeaveForm({ prefillDate, onClose }) {
    const [leaveType, setLeaveType] = useState('');
    const [format, setFormat] = useState('DAY');
    const [dateFrom, setDateFrom] = useState(prefillDate || '');
    const [dateTo, setDateTo] = useState(prefillDate || '');
    const [reason, setReason] = useState('');
    const [urgent, setUrgent] = useState(false);

    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>📋 แบบฟอร์มขอลา</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภทการลา</InputLabel>
                        <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} label="ประเภทการลา">
                            <MenuItem value="SICK">ลาป่วย</MenuItem>
                            <MenuItem value="PERSONAL">ลากิจ</MenuItem>
                            <MenuItem value="ANNUAL">ลาพักร้อน</MenuItem>
                            <MenuItem value="MATERNITY">ลาคลอด</MenuItem>
                            <MenuItem value="ORDINATION">ลาบวช</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <FormLabel sx={{ fontSize: 13 }}>รูปแบบการลา</FormLabel>
                        <RadioGroup row value={format} onChange={(e) => setFormat(e.target.value)}>
                            <FormControlLabel value="DAY" control={<Radio size="small" />} label="รายวัน" />
                            <FormControlLabel value="HOUR" control={<Radio size="small" />} label="รายชั่วโมง" />
                        </RadioGroup>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                        <TextField label="วันที่เริ่มลา" type="date" size="small" fullWidth
                            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                        <TextField label="วันที่สิ้นสุด" type="date" size="small" fullWidth
                            value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                    </Stack>

                    {format === 'HOUR' && (
                        <Stack direction="row" spacing={2}>
                            <TextField label="เวลาเริ่ม" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                            <TextField label="เวลาสิ้นสุด" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                        </Stack>
                    )}

                    <TextField label="เหตุผล" multiline rows={2} size="small" fullWidth
                        value={reason} onChange={(e) => setReason(e.target.value)} />

                    <Button variant="outlined" component="label" startIcon={<Add />}>
                        แนบไฟล์
                        <input hidden type="file" />
                    </Button>

                    <FCL control={<Checkbox checked={urgent} onChange={(e) => setUrgent(e.target.checked)} size="small" />}
                        label={<Typography variant="body2">ลาด่วน (is_urgent)</Typography>} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">ยกเลิก</Button>
                <Button variant="contained" onClick={onClose}>ส่งคำขอ</Button>
            </DialogActions>
        </>
    );
}

// ========================================
// OT Form Component
// ========================================
function OTForm({ prefillDate, onClose }) {
    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>⏰ แบบฟอร์มขอ OT</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField label="วันที่ทำ OT" type="date" size="small" fullWidth
                        defaultValue={prefillDate} InputLabelProps={{ shrink: true }} />
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภท OT</InputLabel>
                        <Select defaultValue="" label="ประเภท OT">
                            <MenuItem value="OT_1_0">ทำงานวันหยุดปกติ (1 เท่า)</MenuItem>
                            <MenuItem value="OT_1_5">OT วันทำงานปกติ (1.5 เท่า)</MenuItem>
                            <MenuItem value="OT_2_0">ทำงานวันหยุดนักขัตฤกษ์ (2 เท่า)</MenuItem>
                            <MenuItem value="OT_3_0">OT วันหยุดนักขัตฤกษ์ (3 เท่า)</MenuItem>
                            <MenuItem value="SHIFT_PREMIUM">เบี้ยกะ</MenuItem>
                        </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาเริ่ม" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                        <TextField label="เวลาสิ้นสุด" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <TextField label="เหตุผล/รายละเอียดงาน" multiline rows={2} size="small" fullWidth />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">ยกเลิก</Button>
                <Button variant="contained" onClick={onClose}>ส่งคำขอ</Button>
            </DialogActions>
        </>
    );
}

// ========================================
// Time Correction Form
// ========================================
function TimeCorrectionForm({ prefillDate, onClose }) {
    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>🕐 แบบฟอร์มขอแก้เวลา</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField label="วันที่ต้องการแก้" type="date" size="small" fullWidth
                        defaultValue={prefillDate} InputLabelProps={{ shrink: true }} />
                    <Divider><Chip label="เวลาเข้างาน" size="small" /></Divider>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาเข้าเดิม" size="small" fullWidth disabled defaultValue="08:35" />
                        <TextField label="เวลาเข้าที่ขอแก้" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <Divider><Chip label="เวลาออกงาน" size="small" /></Divider>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาออกเดิม" size="small" fullWidth disabled defaultValue="—" />
                        <TextField label="เวลาออกที่ขอแก้" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <TextField label="เหตุผล (บังคับ)" multiline rows={2} size="small" fullWidth required />
                    <Button variant="outlined" component="label" startIcon={<Add />}>
                        แนบไฟล์ (ถ้ามี)
                        <input hidden type="file" />
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">ยกเลิก</Button>
                <Button variant="contained" onClick={onClose}>ส่งคำขอ</Button>
            </DialogActions>
        </>
    );
}

// ========================================
// Main Requests Page
// ========================================
export default function RequestsPage() {
    const [searchParams] = useSearchParams();
    const prefillDate = searchParams.get('date') || '';
    const [tabFilter, setTabFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [openForm, setOpenForm] = useState(null); // 'LEAVE', 'OT', 'TIME_CORRECTION', 'SHIFT_SWAP'

    const filtered = useMemo(() => {
        return MOCK_REQUESTS.filter(r => {
            if (tabFilter && r.type !== tabFilter) return false;
            if (statusFilter && r.status !== statusFilter) return false;
            return true;
        });
    }, [tabFilter, statusFilter]);

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>📋 คำร้องของฉัน</Typography>

                {/* Quick create buttons */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="contained" size="small" startIcon={<EventBusy />} onClick={() => setOpenForm('LEAVE')} sx={{ textTransform: 'none' }}>
                        ขอลา
                    </Button>
                    <Button variant="contained" size="small" color="secondary" startIcon={<OTIcon />} onClick={() => setOpenForm('OT')} sx={{ textTransform: 'none' }}>
                        ขอ OT
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<EditCalendar />} onClick={() => setOpenForm('TIME_CORRECTION')} sx={{ textTransform: 'none' }}>
                        แก้เวลา
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<SwapHoriz />} onClick={() => setOpenForm('SHIFT_SWAP')} sx={{ textTransform: 'none' }}>
                        สลับกะ
                    </Button>
                </Stack>
            </Stack>

            {/* Pre-fill date notice */}
            {prefillDate && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    เลือกจากปฏิทินวันที่ <strong>{new Date(prefillDate).toLocaleDateString('th-TH')}</strong> — กดปุ่มด้านบนเพื่อสร้างคำร้อง
                </Alert>
            )}

            {/* Type filter tabs */}
            <Card sx={{ mb: 2 }}>
                <Tabs
                    value={tabFilter}
                    onChange={(_, v) => setTabFilter(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 42 }}
                >
                    {TAB_TYPES.map(t => (
                        <Tab key={t.value} value={t.value} label={t.label} icon={t.icon}
                            iconPosition="start" sx={{ minHeight: 42, textTransform: 'none', fontSize: 13 }} />
                    ))}
                </Tabs>
            </Card>

            {/* Status filter */}
            <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                <Chip label="ทั้งหมด" size="small" variant={statusFilter === '' ? 'filled' : 'outlined'}
                    color="primary" onClick={() => setStatusFilter('')} />
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <Chip key={key} label={val.label} size="small" icon={val.icon}
                        variant={statusFilter === key ? 'filled' : 'outlined'}
                        color={val.color}
                        onClick={() => setStatusFilter(statusFilter === key ? '' : key)} />
                ))}
            </Stack>

            {/* Requests table */}
            <Card>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ประเภท</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>รายละเอียด</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>วันที่</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>สถานะ</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ผู้อนุมัติ</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="center">จัดการ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        ไม่พบคำร้อง
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((req) => {
                                    const st = STATUS_MAP[req.status];
                                    return (
                                        <TableRow key={req.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontSize={12} fontWeight={600}>{req.typeName}</Typography>
                                                {req.subtype && <Typography variant="caption" color="text.secondary">{req.subtype}</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>{req.reason}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>
                                                    {new Date(req.dateFrom).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                    {req.dateFrom !== req.dateTo && ` — ${new Date(req.dateTo).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={st.label} size="small" color={st.color} variant="outlined" sx={{ fontSize: 10, height: 22 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontSize={11}>{req.approver}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                                                    {req.status === 'PENDING' && (
                                                        <IconButton size="small" color="error"><Cancel fontSize="small" /></IconButton>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Form Dialogs */}
            <Dialog open={openForm === 'LEAVE'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <LeaveForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} />
            </Dialog>
            <Dialog open={openForm === 'OT'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <OTForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} />
            </Dialog>
            <Dialog open={openForm === 'TIME_CORRECTION'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <TimeCorrectionForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} />
            </Dialog>
            <Dialog open={openForm === 'SHIFT_SWAP'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>🔄 สลับวันหยุด/กะ</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>ประเภท</InputLabel>
                            <Select defaultValue="" label="ประเภท">
                                <MenuItem value="SWAP">สลับกะ (SWAP)</MenuItem>
                                <MenuItem value="BANK">เก็บวันหยุด (BANK)</MenuItem>
                                <MenuItem value="USE_BANK">ใช้วันหยุดที่เก็บ (USE_BANK)</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="วันที่ของผู้ขอ" type="date" size="small" fullWidth
                            defaultValue={prefillDate} InputLabelProps={{ shrink: true }} />
                        <TextField label="วันที่เป้าหมาย (กรณี SWAP)" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} />
                        <TextField label="เหตุผล" multiline rows={2} size="small" fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenForm(null)} color="inherit">ยกเลิก</Button>
                    <Button variant="contained" onClick={() => setOpenForm(null)}>ส่งคำขอ</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
