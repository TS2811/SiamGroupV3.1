import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Chip, TextField, Button, Avatar,
    List, ListItem, ListItemAvatar, ListItemText, ListItemButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    InputAdornment, CircularProgress, FormControl, InputLabel, Select,
    MenuItem, IconButton, Tooltip, Divider, Dialog, DialogTitle,
    DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import {
    Search as SearchIcon, CalendarMonth as CalendarIcon,
    AccessTime as TimeIcon, Edit as EditIcon,
    CheckCircle as CheckIcon, Cancel as CancelIcon,
    Schedule as ScheduleIcon, EventBusy as AbsentIcon,
    EventAvailable as LeaveIcon, BeachAccess as OffIcon,
    NavigateBefore, NavigateNext,
} from '@mui/icons-material';
import { hrmService, settingsService } from '../../services/api';

// สีสถานะ
const statusStyle = {
    ON_TIME: { icon: '✅', color: '#22C55E', bg: '#F0FDF4', label: 'ตรงเวลา' },
    LATE: { icon: '⚠️', color: '#F59E0B', bg: '#FFFBEB', label: 'สาย' },
    NO_CHECKOUT: { icon: '🟡', color: '#F59E0B', bg: '#FFFBEB', label: 'ไม่ได้ OUT' },
    ABSENT: { icon: '❌', color: '#EF4444', bg: '#FEF2F2', label: 'ขาด' },
    ON_LEAVE: { icon: '📋', color: '#3B82F6', bg: '#EFF6FF', label: 'ลา' },
    DAY_OFF: { icon: '🏖️', color: '#9CA3AF', bg: '#F3F4F6', label: 'วันหยุด' },
    OT: { icon: '🌙', color: '#F97316', bg: '#FFF7ED', label: 'OT' },
    SWAP: { icon: '🔄', color: '#8B5CF6', bg: '#F5F3FF', label: 'สลับ' },
};

export default function HrmTimeReportPage() {
    // State
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [calendarData, setCalendarData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [filters, setFilters] = useState({ company_id: '', branch_id: '', search: '' });
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [remarkDialog, setRemarkDialog] = useState({ open: false, empId: null, date: '', remark: '' });
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [viewTab, setViewTab] = useState('calendar'); // 'calendar' | 'daily'

    // Period labels
    const prevMonth = month - 1 < 1 ? 12 : month - 1;
    const prevYear = month - 1 < 1 ? year - 1 : year;
    const periodLabel = `${prevYear}-${String(prevMonth).padStart(2, '0')}-21 ถึง ${year}-${String(month).padStart(2, '0')}-20`;

    // Load calendar
    const loadCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const params = { year, month, ...filters };
            Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
            const res = await hrmService.getTimeCalendar(params);
            const data = res.data?.data;
            setCalendarData(data);
            setEmployees(data?.employees || []);
            if (data?.employees?.length > 0 && !selectedEmp) {
                setSelectedEmp(data.employees[0]);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [year, month, filters]);

    useEffect(() => {
        loadCalendar();
        loadMasterData();
    }, [loadCalendar]);

    // Load daily when employee changes
    useEffect(() => {
        if (selectedEmp && calendarData?.period) {
            loadDaily(selectedEmp.employee_id);
        }
    }, [selectedEmp, calendarData]);

    const loadMasterData = async () => {
        try {
            const [cRes, bRes] = await Promise.all([
                settingsService.getCompanies(),
                settingsService.getBranches(),
            ]);
            setCompanies(cRes.data?.data?.companies || []);
            setBranches(bRes.data?.data?.branches || []);
        } catch (err) { console.error(err); }
    };

    const loadDaily = async (empId) => {
        if (!calendarData?.period) return;
        setLoadingDaily(true);
        try {
            const [dailyRes, sumRes] = await Promise.all([
                hrmService.getTimeDailyBreakdown({
                    employee_id: empId,
                    start: calendarData.period.startDate,
                    end: calendarData.period.endDate,
                }),
                hrmService.getTimeSummary({
                    employee_id: empId,
                    start: calendarData.period.startDate,
                    end: calendarData.period.endDate,
                }),
            ]);
            setDailyData(dailyRes.data?.data);
            setSummaryData(sumRes.data?.data);
        } catch (err) { console.error(err); }
        setLoadingDaily(false);
    };

    // Navigate month
    const prevPeriod = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextPeriod = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Save remark
    const saveRemark = async () => {
        try {
            await hrmService.upsertRemark({
                employee_id: remarkDialog.empId,
                date: remarkDialog.date,
                remark: remarkDialog.remark,
            });
            setSnack({ open: true, message: 'บันทึก Remark สำเร็จ', severity: 'success' });
            setRemarkDialog({ open: false, empId: null, date: '', remark: '' });
            if (selectedEmp) loadDaily(selectedEmp.employee_id);
        } catch (err) {
            setSnack({ open: true, message: err.response?.data?.message || 'เกิดข้อผิดพลาด', severity: 'error' });
        }
    };

    // Generate date range array
    const getDates = () => {
        if (!calendarData?.period) return [];
        const dates = [];
        const start = new Date(calendarData.period.startDate);
        const end = new Date(calendarData.period.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    // Build daily rows from raw data
    const buildDailyRows = () => {
        if (!dailyData || !calendarData?.period) return [];
        const dates = getDates();
        const logMap = {};
        (dailyData.logs || []).forEach(l => {
            if (!logMap[l.work_date]) logMap[l.work_date] = {};
            logMap[l.work_date][l.scan_type] = l.scan_time;
            logMap[l.work_date].check_in_type = l.check_in_type;
        });
        const leaveMap = {};
        (dailyData.leaves || []).forEach(l => {
            const s = new Date(l.start_date); const e = new Date(l.end_date);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                leaveMap[d.toISOString().split('T')[0]] = l.leave_type;
            }
        });
        const otMap = {};
        (dailyData.ots || []).forEach(o => { otMap[o.ot_date] = o; });
        const remarkMap = {};
        (dailyData.remarks || []).forEach(r => { remarkMap[r.remark_date] = r.remark; });
        const holidayMap = {};
        (dailyData.holidays || []).forEach(h => { holidayMap[h.holiday_date] = h.name_th; });
        const offMap = {};
        (dailyData.off_days || []).forEach(o => { offMap[o.day_off_date] = o.description; });

        return dates.map(date => {
            const log = logMap[date];
            const leave = leaveMap[date];
            const ot = otMap[date];
            const holiday = holidayMap[date];
            const offDay = offMap[date];
            const remark = remarkMap[date];
            const dayOfWeek = new Date(date).getDay(); // 0=Sun

            let status = 'ON_TIME';
            if (holiday || offDay || dayOfWeek === 0) status = 'DAY_OFF';
            else if (leave) status = 'ON_LEAVE';
            else if (!log) status = 'ABSENT';
            else if (log.IN && !log.OUT) status = 'NO_CHECKOUT';
            else if (log.IN && dailyData.shift) {
                const scanTime = log.IN.split(' ')[1] || '';
                const shiftStart = dailyData.shift.start_time;
                if (scanTime > shiftStart) status = 'LATE';
            }

            return {
                date, status, log, leave, ot, holiday, offDay, remark, dayOfWeek,
                checkIn: log?.IN?.split(' ')[1]?.substring(0, 5) || '-',
                checkOut: log?.OUT?.split(' ')[1]?.substring(0, 5) || '-',
            };
        });
    };

    const dailyRows = buildDailyRows();
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    return (
        <Box>
            {/* Header + Period Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon color="primary" /> รายงานเวลาทำงาน
                    </Typography>
                    <Typography variant="body2" color="text.secondary">รอบ {periodLabel}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={prevPeriod}><NavigateBefore /></IconButton>
                    <Chip label={`${year}-${String(month).padStart(2, '0')}`} variant="outlined" />
                    <IconButton onClick={nextPeriod}><NavigateNext /></IconButton>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }} elevation={0}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" label="ค้นหาพนักงาน" value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                        sx={{ minWidth: 200, flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>บริษัท</InputLabel>
                        <Select value={filters.company_id} label="บริษัท" onChange={e => setFilters(f => ({ ...f, company_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.code} - {c.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>สาขา</InputLabel>
                        <Select value={filters.branch_id} label="สาขา" onChange={e => setFilters(f => ({ ...f, branch_id: e.target.value }))}>
                            <MenuItem value="">ทั้งหมด</MenuItem>
                            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name_th}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant={viewTab === 'calendar' ? 'contained' : 'outlined'} size="medium"
                            onClick={() => setViewTab('calendar')} sx={{ textTransform: 'none', borderRadius: 2 }}>
                            ปฏิทิน
                        </Button>
                        <Button variant={viewTab === 'daily' ? 'contained' : 'outlined'} size="medium"
                            onClick={() => setViewTab('daily')} sx={{ textTransform: 'none', borderRadius: 2 }}>
                            รายละเอียดรายวัน
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 250px)', minHeight: 400 }}>
                    {/* LEFT PANEL — Employee list (fixed width) */}
                    <Paper sx={{ borderRadius: 3, width: 260, minWidth: 260, overflow: 'auto', flexShrink: 0 }} elevation={0}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ p: 1.5, pb: 0.5, fontSize: '0.8rem' }}>
                            รายชื่อพนักงาน ({employees.length})
                        </Typography>
                        <List dense sx={{ py: 0 }}>
                            {employees.map(emp => (
                                <ListItemButton key={emp.employee_id}
                                    selected={selectedEmp?.employee_id === emp.employee_id}
                                    onClick={() => setSelectedEmp(emp)}
                                    sx={{ borderRadius: 2, mx: 0.5, mb: 0.3, py: 0.5 }}>
                                    <ListItemAvatar sx={{ minWidth: 36 }}>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                            {(emp.first_name_th || '?')[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography variant="body2" fontWeight={600} fontSize="0.78rem" noWrap>{emp.first_name_th} {emp.last_name_th}</Typography>}
                                        secondary={<Typography variant="caption" color="text.secondary" fontSize="0.68rem" noWrap>{emp.employee_code} {emp.nickname && `(${emp.nickname})`}</Typography>}
                                    />
                                </ListItemButton>
                            ))}
                            {employees.length === 0 && (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    ไม่พบพนักงาน
                                </Box>
                            )}
                        </List>
                    </Paper>

                    {/* RIGHT PANEL — fills remaining width */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {!selectedEmp ? (
                            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, flex: 1 }} elevation={0}>
                                <Typography color="text.secondary">กรุณาเลือกพนักงานจากรายชื่อด้านซ้าย</Typography>
                            </Paper>
                        ) : (
                            <>
                                {/* Summary Card — Compact */}
                                {summaryData && (
                                    <Paper sx={{ p: 1, mb: 1, borderRadius: 2, flexShrink: 0 }} elevation={0}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                                {(selectedEmp.first_name_th || '?')[0]}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={700} fontSize="0.8rem" noWrap>
                                                    {selectedEmp.first_name_th} {selectedEmp.last_name_th}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontSize="0.65rem" noWrap>
                                                    {selectedEmp.employee_code} {selectedEmp.nickname && `(${selectedEmp.nickname})`}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                                                {[
                                                    { label: 'ทำงาน', value: summaryData.work_days, color: '#22C55E' },
                                                    { label: 'สาย', value: `${summaryData.late_count} ครั้ง`, color: '#F59E0B' },
                                                    { label: 'รวม', value: `${summaryData.late_minutes} นาที`, color: '#F59E0B' },
                                                    { label: 'OT', value: `${summaryData.ot_hours || 0} ชม.`, color: '#F97316' },
                                                ].map(item => (
                                                    <Box key={item.label} sx={{ textAlign: 'center', px: 0.8, py: 0.3, borderRadius: 1.5, bgcolor: `${item.color}10`, minWidth: 50 }}>
                                                        <Typography fontWeight={700} sx={{ color: item.color, fontSize: '0.75rem', lineHeight: 1.2 }}>{item.value}</Typography>
                                                        <Typography sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>{item.label}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>

                                            {summaryData.leave_quotas?.length > 0 && (
                                                <Box sx={{ display: 'flex', gap: 0.3 }}>
                                                    {summaryData.leave_quotas.map((q, i) => (
                                                        <Chip key={i} size="small" variant="outlined"
                                                            label={`${q.name_th}: ${q.remaining}/${q.quota_days}`}
                                                            color={parseFloat(q.remaining) > 0 ? 'primary' : 'error'}
                                                            sx={{ fontSize: '0.6rem', height: 20, '& .MuiChip-label': { px: 0.5 } }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                )}

                                {/* Content area — Calendar or Daily */}
                                {loadingDaily ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                                ) : viewTab === 'calendar' ? (
                                    /* ========== CALENDAR GRID ========== */
                                    <Paper sx={{ borderRadius: 3, overflow: 'auto', flex: 1 }} elevation={0}>
                                        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="subtitle2" fontWeight={700} fontSize="0.8rem">
                                                📅 ปฏิทินการทำงาน — {selectedEmp?.first_name_th} {selectedEmp?.last_name_th}
                                            </Typography>
                                        </Box>
                                        {(() => {
                                            const rowMap = {};
                                            dailyRows.forEach(r => { rowMap[r.date] = r; });
                                            const weeks = [];
                                            let currentWeek = new Array(7).fill(null);
                                            dailyRows.forEach(r => {
                                                const dow = r.dayOfWeek === 0 ? 6 : r.dayOfWeek - 1;
                                                currentWeek[dow] = r;
                                                if (dow === 6) { weeks.push(currentWeek); currentWeek = new Array(7).fill(null); }
                                            });
                                            if (currentWeek.some(c => c !== null)) weeks.push(currentWeek);

                                            const calDayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
                                            return (
                                                <Box sx={{ p: 2 }}>
                                                    {/* Legend */}
                                                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                                                        {Object.entries(statusStyle).map(([key, st]) => (
                                                            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: st.color }} />
                                                                <Typography variant="caption" fontSize="0.65rem">{st.label}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    {/* Header */}
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
                                                        {calDayNames.map(d => (
                                                            <Box key={d} sx={{ textAlign: 'center', py: 0.5 }}>
                                                                <Typography variant="caption" fontWeight={700} color="text.secondary">{d}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                    {/* Weeks */}
                                                    {weeks.map((week, wi) => (
                                                        <Box key={wi} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
                                                            {week.map((cell, ci) => {
                                                                if (!cell) return <Box key={ci} sx={{ minHeight: 60 }} />;
                                                                const st = statusStyle[cell.status] || statusStyle.ON_TIME;
                                                                const dayNum = cell.date.split('-')[2];
                                                                const isWeekend = ci >= 5;
                                                                return (
                                                                    <Tooltip key={ci} title={`${cell.date} — ${st.label}${cell.checkIn !== '-' ? ` | เข้า ${cell.checkIn}` : ''}${cell.checkOut !== '-' ? ` | ออก ${cell.checkOut}` : ''}${cell.holiday ? ` | ${cell.holiday}` : ''}${cell.leave ? ` | ${cell.leave}` : ''}`} arrow>
                                                                        <Box sx={{
                                                                            minHeight: 60, borderRadius: 2, bgcolor: st.bg, border: `1.5px solid ${st.color}30`,
                                                                            p: 0.5, cursor: 'pointer', transition: 'all 0.15s',
                                                                            '&:hover': { transform: 'scale(1.05)', boxShadow: 2, borderColor: st.color },
                                                                        }}
                                                                            onClick={() => { setViewTab('daily'); }}
                                                                        >
                                                                            <Typography variant="caption" fontWeight={700} sx={{ color: isWeekend ? '#EF4444' : 'text.primary', fontSize: '0.75rem' }}>
                                                                                {parseInt(dayNum)}
                                                                            </Typography>
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0.3 }}>
                                                                                <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{st.icon}</Typography>
                                                                                {cell.checkIn !== '-' && (
                                                                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: cell.status === 'LATE' ? '#F59E0B' : 'text.secondary', mt: 0.2 }}>
                                                                                        {cell.checkIn}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            );
                                        })()}
                                    </Paper>
                                ) : (
                                    /* ========== DAILY BREAKDOWN TABLE ========== */
                                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }} elevation={0}>
                                        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                                            <Typography variant="subtitle2" fontWeight={700} fontSize="0.8rem">
                                                📋 รายละเอียดรายวัน — {selectedEmp?.first_name_th} {selectedEmp?.last_name_th}
                                            </Typography>
                                        </Box>
                                        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                                            <Table size="small" stickyHeader sx={{ width: '100%' }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>วันที่</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>วัน</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>เข้า</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>ออก</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>สถานะ</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>OT</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Remark</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {dailyRows.map(row => {
                                                        const st = statusStyle[row.status] || statusStyle.ON_TIME;
                                                        return (
                                                            <TableRow key={row.date} sx={{ bgcolor: st.bg, '&:hover': { bgcolor: `${st.color}15` } }}>
                                                                <TableCell sx={{ fontWeight: 500 }}>{row.date}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={dayNames[row.dayOfWeek]} size="small"
                                                                        sx={{
                                                                            fontSize: 11, height: 20, minWidth: 28,
                                                                            bgcolor: row.dayOfWeek === 0 || row.dayOfWeek === 6 ? '#FEE2E2' : 'grey.100'
                                                                        }} />
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 600, color: row.status === 'LATE' ? '#F59E0B' : 'inherit' }}>
                                                                    {row.checkIn}
                                                                </TableCell>
                                                                <TableCell>{row.checkOut}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={`${st.icon} ${st.label}`} size="small"
                                                                        sx={{ fontWeight: 600, bgcolor: st.bg, color: st.color, border: `1px solid ${st.color}30` }} />
                                                                    {row.leave && <Typography variant="caption" display="block" sx={{ mt: 0.3 }}>{row.leave}</Typography>}
                                                                    {row.holiday && <Typography variant="caption" display="block" color="text.secondary">{row.holiday}</Typography>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {row.ot && <Chip label={`${row.ot.total_hours}h`} size="small" color="warning" variant="outlined" />}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {row.remark || ''}
                                                                        </Typography>
                                                                        <Tooltip title="แก้ไข Remark">
                                                                            <IconButton size="small" onClick={() => setRemarkDialog({
                                                                                open: true,
                                                                                empId: selectedEmp.employee_id,
                                                                                date: row.date,
                                                                                remark: row.remark || ''
                                                                            })}>
                                                                                <EditIcon sx={{ fontSize: 14 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    {dailyRows.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                                ไม่มีข้อมูล
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            )}

            {/* Remark Dialog */}
            <Dialog open={remarkDialog.open} onClose={() => setRemarkDialog(r => ({ ...r, open: false }))}
                maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>📝 แก้ไข Remark — {remarkDialog.date}</DialogTitle>
                <DialogContent>
                    <TextField fullWidth multiline rows={3} label="Remark" sx={{ mt: 1 }}
                        value={remarkDialog.remark}
                        onChange={e => setRemarkDialog(r => ({ ...r, remark: e.target.value }))}
                        placeholder="บันทึกหมายเหตุ เช่น ลาไม่แจ้งล่วงหน้า, กลับก่อนเวลา..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRemarkDialog(r => ({ ...r, open: false }))} sx={{ textTransform: 'none' }}>ยกเลิก</Button>
                    <Button variant="contained" onClick={saveRemark} sx={{ textTransform: 'none', borderRadius: 2 }}>บันทึก</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
