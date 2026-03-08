import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsService } from '../services/api';
import {
    Box, Card, CardContent, Typography, Stack, Tabs, Tab, Chip, TextField,
    Button, RadioGroup, Radio, FormControlLabel, FormControl, FormLabel,
    Select, MenuItem, InputLabel, Alert, Divider, Paper, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox,
    FormControlLabel as FCL, useMediaQuery, useTheme,
    CircularProgress, Snackbar,
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

const TYPE_LABELS = {
    LEAVE: 'ขอลา',
    OT: 'ขอ OT',
    TIME_CORRECTION: 'แก้เวลา',
    SHIFT_SWAP: 'สลับกะ',
};

const TAB_TYPES = [
    { value: '', label: 'ทั้งหมด', icon: null },
    { value: 'LEAVE', label: 'ขอลา', icon: <EventBusy fontSize="small" /> },
    { value: 'OT', label: 'ขอ OT', icon: <OTIcon fontSize="small" /> },
    { value: 'TIME_CORRECTION', label: 'แก้เวลา', icon: <EditCalendar fontSize="small" /> },
    { value: 'SHIFT_SWAP', label: 'สลับกะ', icon: <SwapHoriz fontSize="small" /> },
];

// ========================================
// Forms (with API submit)
// ========================================
function LeaveForm({ prefillDate, onClose, onSuccess }) {
    const [leaveType, setLeaveType] = useState('');
    const [format, setFormat] = useState('DAY');
    const [dateFrom, setDateFrom] = useState(prefillDate || '');
    const [dateTo, setDateTo] = useState(prefillDate || '');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');
    const [reason, setReason] = useState('');
    const [urgent, setUrgent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!leaveType || !dateFrom || !dateTo) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await requestsService.createLeave({
                leave_type_id: leaveType,
                leave_format: format,
                date_from: dateFrom,
                date_to: dateTo,
                time_from: format === 'HOUR' ? timeFrom : null,
                time_to: format === 'HOUR' ? timeTo : null,
                reason,
                is_urgent: urgent ? 1 : 0,
            });
            onSuccess('ส่งคำร้องขอลาสำเร็จ');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>📋 แบบฟอร์มขอลา</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภทการลา</InputLabel>
                        <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} label="ประเภทการลา">
                            <MenuItem value={1}>ลาป่วย</MenuItem>
                            <MenuItem value={2}>ลากิจ</MenuItem>
                            <MenuItem value={3}>ลาพักร้อน</MenuItem>
                            <MenuItem value={4}>ลาคลอด</MenuItem>
                            <MenuItem value={5}>ลาบวช</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <FormLabel sx={{ fontSize: 13 }}>รูปแบบการลา</FormLabel>
                        <RadioGroup row value={format} onChange={(e) => setFormat(e.target.value)}>
                            <FormControlLabel value="DAY" control={<Radio size="small" />} label="รายวัน" />
                            <FormControlLabel value="HOUR" control={<Radio size="small" />} label="รายชั่วโมง" />
                        </RadioGroup>
                    </FormControl>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="วันที่เริ่มลา" type="date" size="small" fullWidth
                            value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                        <TextField label="วันที่สิ้นสุด" type="date" size="small" fullWidth
                            value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    {format === 'HOUR' && (
                        <Stack direction="row" spacing={2}>
                            <TextField label="เวลาเริ่ม" type="time" size="small" fullWidth
                                value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }} />
                            <TextField label="เวลาสิ้นสุด" type="time" size="small" fullWidth
                                value={timeTo} onChange={(e) => setTimeTo(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Stack>
                    )}
                    <TextField label="เหตุผล" multiline rows={2} size="small" fullWidth
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                    <FCL control={<Checkbox checked={urgent} onChange={(e) => setUrgent(e.target.checked)} size="small" />}
                        label={<Typography variant="body2">ลาด่วน</Typography>} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={submitting}>ยกเลิก</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : 'ส่งคำขอ'}
                </Button>
            </DialogActions>
        </>
    );
}

function OTForm({ prefillDate, onClose, onSuccess }) {
    const [otType, setOtType] = useState('');
    const [workDate, setWorkDate] = useState(prefillDate || '');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!otType || !workDate || !startTime || !endTime) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await requestsService.createOT({
                ot_type: otType,
                work_date: workDate,
                start_time: startTime,
                end_time: endTime,
                reason,
            });
            onSuccess('ส่งคำร้องขอ OT สำเร็จ');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>⏰ แบบฟอร์มขอ OT</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField label="วันที่ทำ OT" type="date" size="small" fullWidth
                        value={workDate} onChange={(e) => setWorkDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }} />
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภท OT</InputLabel>
                        <Select value={otType} onChange={(e) => setOtType(e.target.value)} label="ประเภท OT">
                            <MenuItem value="OT_1_0">ทำงานวันหยุดปกติ (1 เท่า)</MenuItem>
                            <MenuItem value="OT_1_5">OT วันทำงานปกติ (1.5 เท่า)</MenuItem>
                            <MenuItem value="OT_2_0">ทำงานวันหยุดนักขัตฤกษ์ (2 เท่า)</MenuItem>
                            <MenuItem value="OT_3_0">OT วันหยุดนักขัตฤกษ์ (3 เท่า)</MenuItem>
                            <MenuItem value="SHIFT_PREMIUM">เบี้ยกะ</MenuItem>
                        </Select>
                    </FormControl>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาเริ่ม" type="time" size="small" fullWidth
                            value={startTime} onChange={(e) => setStartTime(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                        <TextField label="เวลาสิ้นสุด" type="time" size="small" fullWidth
                            value={endTime} onChange={(e) => setEndTime(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    <TextField label="เหตุผล/รายละเอียดงาน" multiline rows={2} size="small" fullWidth
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={submitting}>ยกเลิก</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : 'ส่งคำขอ'}
                </Button>
            </DialogActions>
        </>
    );
}

function TimeCorrectionForm({ prefillDate, onClose, onSuccess }) {
    const [workDate, setWorkDate] = useState(prefillDate || '');
    const [correctedIn, setCorrectedIn] = useState('');
    const [correctedOut, setCorrectedOut] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!workDate || !reason) {
            setError('กรุณากรอกวันที่และเหตุผล');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await requestsService.createTimeCorrection({
                work_date: workDate,
                corrected_in: correctedIn || null,
                corrected_out: correctedOut || null,
                reason,
            });
            onSuccess('ส่งคำร้องแก้เวลาสำเร็จ');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>🕐 แบบฟอร์มขอแก้เวลา</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField label="วันที่ต้องการแก้" type="date" size="small" fullWidth
                        value={workDate} onChange={(e) => setWorkDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }} />
                    <Divider><Chip label="เวลาเข้างาน" size="small" /></Divider>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาเข้าเดิม" size="small" fullWidth disabled defaultValue="—" />
                        <TextField label="ที่ขอแก้" type="time" size="small" fullWidth
                            value={correctedIn} onChange={(e) => setCorrectedIn(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    <Divider><Chip label="เวลาออกงาน" size="small" /></Divider>
                    <Stack direction="row" spacing={2}>
                        <TextField label="เวลาออกเดิม" size="small" fullWidth disabled defaultValue="—" />
                        <TextField label="ที่ขอแก้" type="time" size="small" fullWidth
                            value={correctedOut} onChange={(e) => setCorrectedOut(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    <TextField label="เหตุผล (บังคับ)" multiline rows={2} size="small" fullWidth required
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={submitting}>ยกเลิก</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : 'ส่งคำขอ'}
                </Button>
            </DialogActions>
        </>
    );
}

function ShiftSwapForm({ prefillDate, onClose, onSuccess }) {
    const [swapType, setSwapType] = useState('');
    const [requestDate, setRequestDate] = useState(prefillDate || '');
    const [targetDate, setTargetDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!swapType || !requestDate) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await requestsService.createShiftSwap({
                swap_type: swapType,
                request_date: requestDate,
                target_date: targetDate || null,
                reason,
            });
            onSuccess('ส่งคำร้องสลับกะสำเร็จ');
        } catch (err) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ fontWeight: 700 }}>🔄 สลับวันหยุด/กะ</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl fullWidth size="small">
                        <InputLabel>ประเภท</InputLabel>
                        <Select value={swapType} onChange={(e) => setSwapType(e.target.value)} label="ประเภท">
                            <MenuItem value="SWAP">สลับกะ (SWAP)</MenuItem>
                            <MenuItem value="BANK">เก็บวันหยุด (BANK)</MenuItem>
                            <MenuItem value="USE_BANK">ใช้วันหยุดที่เก็บ (USE_BANK)</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField label="วันที่ของผู้ขอ" type="date" size="small" fullWidth
                        value={requestDate} onChange={(e) => setRequestDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField label="วันที่เป้าหมาย (กรณี SWAP)" type="date" size="small" fullWidth
                        value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField label="เหตุผล" multiline rows={2} size="small" fullWidth
                        value={reason} onChange={(e) => setReason(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={submitting}>ยกเลิก</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : 'ส่งคำขอ'}
                </Button>
            </DialogActions>
        </>
    );
}

// ========================================
// Mobile Request Card
// ========================================
function RequestCard({ req, onCancel }) {
    const st = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
    const typeName = TYPE_LABELS[req.request_type] || req.request_type;

    // Map date fields based on request type
    const getDateDisplay = () => {
        if (req.request_type === 'LEAVE') {
            return req.date_from === req.date_to
                ? new Date(req.date_from).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                : `${new Date(req.date_from).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — ${new Date(req.date_to).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`;
        }
        if (req.request_type === 'OT') {
            return new Date(req.work_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        }
        if (req.request_type === 'TIME_CORRECTION') {
            return new Date(req.work_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        }
        return req.request_date ? new Date(req.request_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '';
    };

    const getSubtype = () => {
        if (req.request_type === 'LEAVE') return req.leave_type_name || '';
        if (req.request_type === 'OT') return req.ot_type || '';
        return '';
    };

    return (
        <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            {typeName} {getSubtype() && <Typography component="span" variant="caption" color="text.secondary">({getSubtype()})</Typography>}
                        </Typography>
                        {req.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{req.reason}</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">{getDateDisplay()}</Typography>
                    </Box>
                    <Chip label={st.label} size="small" color={st.color} variant="outlined" sx={{ fontSize: 10, height: 22 }} />
                </Stack>
                {req.status === 'PENDING' && (
                    <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
                        <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => onCancel(req)}>
                            <Cancel fontSize="small" />
                        </IconButton>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

// ========================================
// Main Requests Page
// ========================================
export default function RequestsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchParams] = useSearchParams();
    const prefillDate = searchParams.get('date') || '';
    const [tabFilter, setTabFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [openForm, setOpenForm] = useState(null);

    // API state
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    // Fetch requests from API
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (tabFilter) params.type = tabFilter;
            if (statusFilter) params.status = statusFilter;
            const res = await requestsService.getList(params);
            setRequests(res.data?.data?.requests || []);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [tabFilter, statusFilter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Handle form success
    const handleFormSuccess = (message) => {
        setOpenForm(null);
        setSnackbar({ open: true, message: `✅ ${message}` });
        fetchRequests(); // refresh list
    };

    // Handle cancel
    const handleCancel = async (req) => {
        if (!window.confirm('ต้องการยกเลิกคำร้องนี้?')) return;
        try {
            await requestsService.cancel(req.id, { type: req.request_type });
            setSnackbar({ open: true, message: '✅ ยกเลิกคำร้องสำเร็จ' });
            fetchRequests();
        } catch (err) {
            setSnackbar({ open: true, message: `❌ ${err.response?.data?.message || 'เกิดข้อผิดพลาด'}` });
        }
    };

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>📋 คำร้องของฉัน</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <Button variant="contained" size="small" startIcon={<EventBusy />} onClick={() => setOpenForm('LEAVE')} sx={{ textTransform: 'none', fontSize: 12 }}>ขอลา</Button>
                    <Button variant="contained" size="small" color="secondary" startIcon={<OTIcon />} onClick={() => setOpenForm('OT')} sx={{ textTransform: 'none', fontSize: 12 }}>ขอ OT</Button>
                    <Button variant="outlined" size="small" startIcon={<EditCalendar />} onClick={() => setOpenForm('TIME_CORRECTION')} sx={{ textTransform: 'none', fontSize: 12 }}>แก้เวลา</Button>
                    <Button variant="outlined" size="small" startIcon={<SwapHoriz />} onClick={() => setOpenForm('SHIFT_SWAP')} sx={{ textTransform: 'none', fontSize: 12 }}>สลับกะ</Button>
                </Stack>
            </Stack>

            {prefillDate && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    เลือกจากปฏิทินวันที่ <strong>{new Date(prefillDate).toLocaleDateString('th-TH')}</strong> — กดปุ่มด้านบนเพื่อสร้างคำร้อง
                </Alert>
            )}

            <Card sx={{ mb: 2 }}>
                <Tabs value={tabFilter} onChange={(_, v) => setTabFilter(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 42 }}>
                    {TAB_TYPES.map(t => (
                        <Tab key={t.value} value={t.value} label={t.label} icon={t.icon}
                            iconPosition="start" sx={{ minHeight: 42, textTransform: 'none', fontSize: 12, px: 1.5 }} />
                    ))}
                </Tabs>
            </Card>

            <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
                <Chip label="ทั้งหมด" size="small" variant={statusFilter === '' ? 'filled' : 'outlined'} color="primary" onClick={() => setStatusFilter('')} />
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <Chip key={key} label={val.label} size="small" icon={val.icon}
                        variant={statusFilter === key ? 'filled' : 'outlined'} color={val.color}
                        onClick={() => setStatusFilter(statusFilter === key ? '' : key)} />
                ))}
            </Stack>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : isMobile ? (
                <Box>
                    {requests.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>ไม่พบคำร้อง</Paper>
                    ) : (
                        requests.map(req => <RequestCard key={`${req.request_type}_${req.id}`} req={req} onCancel={handleCancel} />)
                    )}
                </Box>
            ) : (
                <Card>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>ประเภท</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>รายละเอียด</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>วันที่</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>สถานะ</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="center">จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>ไม่พบคำร้อง</TableCell></TableRow>
                                ) : (
                                    requests.map((req) => {
                                        const st = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
                                        const typeName = TYPE_LABELS[req.request_type] || req.request_type;
                                        const dateDisplay = req.date_from || req.work_date || req.request_date || '';
                                        return (
                                            <TableRow key={`${req.request_type}_${req.id}`} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontSize={12} fontWeight={600}>{typeName}</Typography>
                                                    {req.leave_type_name && <Typography variant="caption" color="text.secondary">{req.leave_type_name}</Typography>}
                                                    {req.ot_type && <Typography variant="caption" color="text.secondary">{req.ot_type}</Typography>}
                                                </TableCell>
                                                <TableCell><Typography variant="caption" fontSize={11}>{req.reason || '—'}</Typography></TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontSize={11}>
                                                        {dateDisplay ? new Date(dateDisplay).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell><Chip label={st.label} size="small" color={st.color} variant="outlined" sx={{ fontSize: 10, height: 22 }} /></TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                                                        {req.status === 'PENDING' && <IconButton size="small" color="error" onClick={() => handleCancel(req)}><Cancel fontSize="small" /></IconButton>}
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
            )}

            {/* Dialogs */}
            <Dialog open={openForm === 'LEAVE'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <LeaveForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} onSuccess={handleFormSuccess} />
            </Dialog>
            <Dialog open={openForm === 'OT'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <OTForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} onSuccess={handleFormSuccess} />
            </Dialog>
            <Dialog open={openForm === 'TIME_CORRECTION'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <TimeCorrectionForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} onSuccess={handleFormSuccess} />
            </Dialog>
            <Dialog open={openForm === 'SHIFT_SWAP'} onClose={() => setOpenForm(null)} maxWidth="sm" fullWidth>
                <ShiftSwapForm prefillDate={prefillDate} onClose={() => setOpenForm(null)} onSuccess={handleFormSuccess} />
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
        </Box>
    );
}
